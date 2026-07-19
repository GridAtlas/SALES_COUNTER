'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityButton } from '@/components/ActivityButton';
import { AnalysisButton } from '@/components/AnalysisButton';
import { AnalysisModal } from '@/components/AnalysisModal';
import { ActivityEndButton } from '@/components/ActivityEndButton';
import { ActivityEndModal } from '@/components/ActivityEndModal';
import { FaceContactModal } from '@/components/FaceContactModal';
import { AppointmentList } from '@/components/AppointmentList';
import { AppointmentModal } from '@/components/AppointmentModal';
import { ChoiceModal } from '@/components/ChoiceModal';
import { CustomerStatusModal } from '@/components/CustomerStatusModal';
import { DailyReportList } from '@/components/DailyReportList';
import { PresentationLocationModal } from '@/components/PresentationLocationModal';
import { ProspectList } from '@/components/ProspectList';
import { ProspectModal } from '@/components/ProspectModal';
import { RejectionReasonModal } from '@/components/RejectionReasonModal';
import { ViewTabs, type HomeView } from '@/components/ViewTabs';
import { BottomBar } from '@/components/BottomBar';
import { Header } from '@/components/Header';
import {
  ACTIVITIES,
  APPOINTMENT_VISIT_KINDS,
  getActivityDef,
  INTERPHONE_RESPONSE_KINDS,
  PRESENTATION_ENTRY_KINDS,
} from '@/lib/constants';
import { requestCurrentGps } from '@/lib/geolocation';
import { useCounterStore } from '@/store/useCounterStore';
import { useDailyReportStore } from '@/store/useDailyReportStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type {
  Activity,
  ActivityDetails,
  ActivityType,
  AgeGroup,
  AppointmentDetails,
  AppointmentVisitKind,
  CustomerStatus,
  FaceContactKind,
  GpsDetails,
  InterphoneResponseKind,
  PresentationEntryKind,
  PresentationLocation,
  ProspectRating,
  RejectionReason,
} from '@/types';

const localDateKey = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const appointmentSortKey = (activity: Activity) =>
  activity.appointmentDate
    ? `${activity.appointmentDate}T${activity.appointmentStartTime ?? '23:59'}`
    : '9999-12-31T23:59';

type AppointmentVisitFlow = 'standalone' | 'presentation';

export default function HomePage() {
  // SSR ハイドレーション対策: localStorage を安全に読むため、初回は
  // 静的なゼロ値でレンダリング → mount 後に本物の store を反映。
  const [hydrated, setHydrated] = useState(false);
  const [activeView, setActiveView] = useState<HomeView>('counter');
  const [showFaceContact, setShowFaceContact] = useState(false);
  const [showInterphoneStatus, setShowInterphoneStatus] = useState(false);
  const [showInterphoneResponse, setShowInterphoneResponse] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const [showAppointmentVisit, setShowAppointmentVisit] = useState(false);
  const [appointmentVisitFlow, setAppointmentVisitFlow] =
    useState<AppointmentVisitFlow>('standalone');
  const [showPresentationEntryChoice, setShowPresentationEntryChoice] =
    useState(false);
  const [pendingPresentationEntryKind, setPendingPresentationEntryKind] =
    useState<PresentationEntryKind | null>(null);
  const [showPresentationLocation, setShowPresentationLocation] = useState(false);
  const [showProspect, setShowProspect] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showActivityEnd, setShowActivityEnd] = useState(false);
  const [pendingRejectionType, setPendingRejectionType] =
    useState<ActivityType | null>(null);
  const pendingGpsRef = useRef<Promise<GpsDetails> | null>(null);

  useEffect(() => setHydrated(true), []);

  const activities = useCounterStore((state) => state.activities);
  const add = useCounterStore((state) => state.add);
  const updateActivity = useCounterStore((state) => state.updateActivity);
  const undoLast = useCounterStore((state) => state.undoLast);
  const reset = useCounterStore((state) => state.reset);
  const dailyReports = useDailyReportStore((state) => state.reports);
  const saveDailyReport = useDailyReportStore(
    (state) => state.saveDailyReport,
  );
  const gpsEnabled = useSettingsStore((state) => state.gpsEnabled);
  const setGpsEnabled = useSettingsStore((state) => state.setGpsEnabled);

  const countOf = (type: string) =>
    hydrated ? activities.filter((activity) => activity.type === type).length : 0;
  const total = hydrated ? activities.length : 0;
  const reportDate = localDateKey(Date.now());
  const todaysActivities = useMemo(
    () =>
      hydrated
        ? activities.filter(
            (activity) => localDateKey(activity.timestamp) === reportDate,
          )
        : [],
    [activities, hydrated, reportDate],
  );
  const existingTodayReport = hydrated
    ? dailyReports.find((report) => report.date === reportDate)
    : undefined;

  const appointments = useMemo(
    () =>
      hydrated
        ? activities
            .filter((activity) => activity.type === 'appointment')
            .sort((left, right) => {
              const keyComparison = appointmentSortKey(left).localeCompare(
                appointmentSortKey(right),
              );
              return keyComparison || right.timestamp - left.timestamp;
            })
        : [],
    [activities, hydrated],
  );

  const prospects = useMemo(
    () =>
      hydrated
        ? activities
            .filter((activity) => activity.type === 'prospect')
            .sort((left, right) => right.timestamp - left.timestamp)
        : [],
    [activities, hydrated],
  );

  const createGpsPromise = (): Promise<GpsDetails> =>
    gpsEnabled
      ? requestCurrentGps()
      : Promise.resolve({ gpsStatus: 'disabled' });

  const recordActivity = (
    type: ActivityType,
    details: ActivityDetails = {},
    gpsPromise: Promise<GpsDetails> = createGpsPromise(),
  ) => {
    const id = add(type, {
      ...details,
      gpsStatus: gpsEnabled ? 'pending' : 'disabled',
    });
    void gpsPromise.then((gpsDetails) => updateActivity(id, gpsDetails));
  };

  const recordPendingActivity = (
    type: ActivityType,
    details: ActivityDetails = {},
  ) => {
    const gpsPromise = pendingGpsRef.current ?? createGpsPromise();
    pendingGpsRef.current = null;
    recordActivity(type, details, gpsPromise);
  };

  const cancelPendingGps = () => {
    pendingGpsRef.current = null;
  };

  const cancelPresentationFlow = () => {
    cancelPendingGps();
    setShowPresentationEntryChoice(false);
    setShowAppointmentVisit(false);
    setAppointmentVisitFlow('standalone');
    setPendingPresentationEntryKind(null);
    setShowPresentationLocation(false);
  };

  const handleTap = (type: ActivityType) => {
    // 設定ON時のみ、ボタンを押した瞬間にGPS取得を開始する。
    const gpsPromise = createGpsPromise();

    if (type === 'interphone') {
      pendingGpsRef.current = gpsPromise;
      setShowInterphoneStatus(true);
      return;
    }
    if (type === 'interphone_response') {
      pendingGpsRef.current = gpsPromise;
      setShowInterphoneResponse(true);
      return;
    }
    if (type === 'face_to_face_contact') {
      pendingGpsRef.current = gpsPromise;
      setShowFaceContact(true);
      return;
    }
    if (type === 'appointment') {
      pendingGpsRef.current = gpsPromise;
      setShowAppointment(true);
      return;
    }
    if (type === 'appointment_visit') {
      pendingGpsRef.current = gpsPromise;
      setAppointmentVisitFlow('standalone');
      setShowAppointmentVisit(true);
      return;
    }
    if (
      type === 'rejection_close' ||
      type === 'pre_presentation_rejection' ||
      type === 'post_presentation_rejection'
    ) {
      pendingGpsRef.current = gpsPromise;
      setPendingRejectionType(type);
      return;
    }
    if (type === 'presentation') {
      pendingGpsRef.current = gpsPromise;
      const previousActivity = activities[activities.length - 1];
      if (previousActivity?.type === 'appointment_visit') {
        setPendingPresentationEntryKind('アポ訪問');
        setShowPresentationLocation(true);
      } else {
        setShowPresentationEntryChoice(true);
      }
      return;
    }
    if (type === 'prospect') {
      pendingGpsRef.current = gpsPromise;
      setShowProspect(true);
      return;
    }
    recordActivity(type, {}, gpsPromise);
  };

  const handleFaceContactSave = (
    faceContactKind: FaceContactKind,
    ageGroup: AgeGroup,
  ) => {
    recordPendingActivity('face_to_face_contact', { faceContactKind, ageGroup });
    setShowFaceContact(false);
  };

  const handleCustomerStatusSelect = (customerStatus: CustomerStatus) => {
    recordPendingActivity('interphone', { customerStatus });
    setShowInterphoneStatus(false);
  };

  const handleInterphoneResponseSelect = (
    interphoneResponseKind: InterphoneResponseKind,
  ) => {
    recordPendingActivity('interphone_response', { interphoneResponseKind });
    setShowInterphoneResponse(false);
  };

  const handleAppointmentSave = (details: AppointmentDetails) => {
    recordPendingActivity('appointment', details);
    setShowAppointment(false);
    setActiveView('appointments');
  };

  const handlePresentationEntrySelect = (
    presentationEntryKind: PresentationEntryKind,
  ) => {
    setShowPresentationEntryChoice(false);
    setPendingPresentationEntryKind(presentationEntryKind);
    if (presentationEntryKind === '即プレゼン') {
      setShowPresentationLocation(true);
      return;
    }
    setAppointmentVisitFlow('presentation');
    setShowAppointmentVisit(true);
  };

  const handleAppointmentVisitSelect = (
    appointmentVisitKind: AppointmentVisitKind,
  ) => {
    if (appointmentVisitFlow === 'presentation') {
      const visitGpsPromise = pendingGpsRef.current ?? createGpsPromise();
      pendingGpsRef.current = null;
      recordActivity(
        'appointment_visit',
        { appointmentVisitKind },
        visitGpsPromise,
      );
      pendingGpsRef.current = createGpsPromise();
      setPendingPresentationEntryKind('アポ訪問');
      setAppointmentVisitFlow('standalone');
      setShowAppointmentVisit(false);
      setShowPresentationLocation(true);
      return;
    }
    recordPendingActivity('appointment_visit', { appointmentVisitKind });
    setAppointmentVisitFlow('standalone');
    setShowAppointmentVisit(false);
  };

  const handlePresentationLocationSelect = (
    presentationLocation: PresentationLocation,
  ) => {
    recordPendingActivity('presentation', {
      presentationEntryKind: pendingPresentationEntryKind ?? undefined,
      presentationLocation,
    });
    setPendingPresentationEntryKind(null);
    setShowPresentationLocation(false);
  };

  const handleRejectionReasonSelect = (
    rejectionReason: RejectionReason,
    rejectionReasonDetail?: string,
  ) => {
    if (!pendingRejectionType) return;
    recordPendingActivity(pendingRejectionType, {
      rejectionReason,
      rejectionReasonDetail,
    });
    setPendingRejectionType(null);
  };

  const handleProspectSave = (
    prospectRating: ProspectRating,
    prospectComment?: string,
  ) => {
    recordPendingActivity('prospect', { prospectRating, prospectComment });
    setShowProspect(false);
    setActiveView('prospects');
  };

  const handleConfirmActivityEnd = () => {
    if (todaysActivities.length === 0) return;
    saveDailyReport(reportDate, todaysActivities, Date.now());
    setShowActivityEnd(false);
    setActiveView('reports');
  };

  return (
    <>
      <Header
        gpsEnabled={hydrated ? gpsEnabled : false}
        onGpsEnabledChange={setGpsEnabled}
      />
      <ViewTabs
        activeView={activeView}
        onChange={setActiveView}
        appointmentCount={appointments.length}
        prospectCount={prospects.length}
        reportCount={hydrated ? dailyReports.length : 0}
      />

      {activeView === 'counter' ? (
        <div className="counter-frame">
          <section className="counter-section">
            <h2 className="counter-section-title">🔲 移動・休憩</h2>
            <div className="counter-button-grid counter-button-grid--movement">
              {ACTIVITIES.slice(0, 6).map((def) => (
                <ActivityButton
                  key={def.type}
                  def={def}
                  count={countOf(def.type)}
                  onTap={() => handleTap(def.type)}
                />
              ))}
            </div>
          </section>

          <section className="counter-section">
            <h2 className="counter-section-title">🔲 営業活動</h2>
            <div className="counter-button-grid counter-button-grid--sales">
              {ACTIVITIES.slice(6).map((def) => (
                <ActivityButton
                  key={def.type}
                  def={def}
                  count={countOf(def.type)}
                  onTap={() => handleTap(def.type)}
                />
              ))}
            </div>
          </section>

          <section className="counter-section">
            <h2 className="counter-section-title">🔲 分析・報告</h2>
            <div className="counter-button-grid counter-button-grid--report">
              <AnalysisButton onTap={() => setShowAnalysis(true)} />
              <ActivityEndButton
                disabled={todaysActivities.length === 0}
                onTap={() => setShowActivityEnd(true)}
              />
            </div>
          </section>
        </div>
      ) : activeView === 'appointments' ? (
        <AppointmentList appointments={appointments} hydrated={hydrated} />
      ) : activeView === 'prospects' ? (
        <ProspectList prospects={prospects} hydrated={hydrated} />
      ) : (
        <DailyReportList reports={dailyReports} hydrated={hydrated} />
      )}

      <BottomBar
        disableUndo={total === 0}
        onUndo={undoLast}
        onReset={reset}
      />

      {showFaceContact && (
        <FaceContactModal
          onSave={handleFaceContactSave}
          onCancel={() => {
            cancelPendingGps();
            setShowFaceContact(false);
          }}
        />
      )}

      {showInterphoneStatus && (
        <CustomerStatusModal
          onSelect={handleCustomerStatusSelect}
          onCancel={() => {
            cancelPendingGps();
            setShowInterphoneStatus(false);
          }}
        />
      )}

      {showInterphoneResponse && (
        <ChoiceModal
          title="インターホン応答"
          description="応答回数を選択すると記録されます"
          options={INTERPHONE_RESPONSE_KINDS}
          onSelect={handleInterphoneResponseSelect}
          onCancel={() => {
            cancelPendingGps();
            setShowInterphoneResponse(false);
          }}
        />
      )}

      {showAppointment && (
        <AppointmentModal
          onSave={handleAppointmentSave}
          onCancel={() => {
            cancelPendingGps();
            setShowAppointment(false);
          }}
        />
      )}

      {showPresentationEntryChoice && (
        <ChoiceModal
          title="プレゼン前確認"
          description="今回のプレゼン種別を選択してください"
          options={PRESENTATION_ENTRY_KINDS}
          onSelect={handlePresentationEntrySelect}
          onCancel={cancelPresentationFlow}
        />
      )}

      {showAppointmentVisit && (
        <ChoiceModal
          title="アポ訪問"
          description="アポ種別を選択すると記録されます"
          options={APPOINTMENT_VISIT_KINDS}
          onSelect={handleAppointmentVisitSelect}
          onCancel={cancelPresentationFlow}
        />
      )}

      {showPresentationLocation && (
        <PresentationLocationModal
          onSelect={handlePresentationLocationSelect}
          onCancel={cancelPresentationFlow}
        />
      )}

      {showProspect && (
        <ProspectModal
          onSave={handleProspectSave}
          onCancel={() => {
            cancelPendingGps();
            setShowProspect(false);
          }}
        />
      )}

      {showAnalysis && (
        <AnalysisModal
          activities={activities}
          onClose={() => setShowAnalysis(false)}
        />
      )}

      {showActivityEnd && (
        <ActivityEndModal
          activityCount={todaysActivities.length}
          reportDate={reportDate}
          willUpdate={Boolean(existingTodayReport)}
          onConfirm={handleConfirmActivityEnd}
          onCancel={() => setShowActivityEnd(false)}
        />
      )}

      {pendingRejectionType && (
        <RejectionReasonModal
          activityLabel={getActivityDef(pendingRejectionType)?.label ?? ''}
          onSelect={handleRejectionReasonSelect}
          onCancel={() => {
            cancelPendingGps();
            setPendingRejectionType(null);
          }}
        />
      )}
    </>
  );
}
