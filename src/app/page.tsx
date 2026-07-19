'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityButton } from '@/components/ActivityButton';
import { AnalysisButton } from '@/components/AnalysisButton';
import { AnalysisModal } from '@/components/AnalysisModal';
import { ActivityEndButton } from '@/components/ActivityEndButton';
import { ActivityEndModal } from '@/components/ActivityEndModal';
import { AgeGroupModal } from '@/components/AgeGroupModal';
import { AppointmentList } from '@/components/AppointmentList';
import { AppointmentModal } from '@/components/AppointmentModal';
import { ChoiceModal } from '@/components/ChoiceModal';
import { CustomerStatusModal } from '@/components/CustomerStatusModal';
import { DailyReportList } from '@/components/DailyReportList';
import { PresentationLocationModal } from '@/components/PresentationLocationModal';
import { ProspectList } from '@/components/ProspectList';
import { ProspectModal } from '@/components/ProspectModal';
import { SummaryButton } from '@/components/SummaryButton';
import { SummaryModal } from '@/components/SummaryModal';
import { RejectionReasonModal } from '@/components/RejectionReasonModal';
import { ViewTabs, type HomeView } from '@/components/ViewTabs';
import { BottomBar } from '@/components/BottomBar';
import { Header } from '@/components/Header';
import {
  ACTIVITIES,
  APPOINTMENT_VISIT_KINDS,
  getActivityDef,
  INTERPHONE_RESPONSE_KINDS,
} from '@/lib/constants';
import { requestCurrentGps } from '@/lib/geolocation';
import { useCounterStore } from '@/store/useCounterStore';
import { useDailyReportStore } from '@/store/useDailyReportStore';
import type {
  Activity,
  ActivityDetails,
  ActivityType,
  AgeGroup,
  AppointmentDetails,
  AppointmentVisitKind,
  CustomerStatus,
  GpsDetails,
  InterphoneResponseKind,
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

export default function HomePage() {
  // SSR ハイドレーション対策: localStorage を安全に読むため、初回は
  // 静的なゼロ値でレンダリング → mount 後に本物の store を反映。
  const [hydrated, setHydrated] = useState(false);
  const [activeView, setActiveView] = useState<HomeView>('counter');
  const [pendingContactType, setPendingContactType] =
    useState<ActivityType | null>(null);
  const [showInterphoneStatus, setShowInterphoneStatus] = useState(false);
  const [showInterphoneResponse, setShowInterphoneResponse] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const [showAppointmentVisit, setShowAppointmentVisit] = useState(false);
  const [showPresentationLocation, setShowPresentationLocation] = useState(false);
  const [showProspect, setShowProspect] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
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

  const recordActivity = (
    type: ActivityType,
    details: ActivityDetails = {},
    gpsPromise: Promise<GpsDetails> = requestCurrentGps(),
  ) => {
    const id = add(type, { ...details, gpsStatus: 'pending' });
    void gpsPromise.then((gpsDetails) => updateActivity(id, gpsDetails));
  };

  const recordPendingActivity = (
    type: ActivityType,
    details: ActivityDetails = {},
  ) => {
    const gpsPromise = pendingGpsRef.current ?? requestCurrentGps();
    pendingGpsRef.current = null;
    recordActivity(type, details, gpsPromise);
  };

  const cancelPendingGps = () => {
    pendingGpsRef.current = null;
  };

  const handleTap = (type: ActivityType) => {
    // GPS は活動ボタンを押した瞬間に取得開始。ポップアップの選択中も継続する。
    const gpsPromise = requestCurrentGps();

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
    if (type === 'first_contact' || type === 'revisit') {
      pendingGpsRef.current = gpsPromise;
      setPendingContactType(type);
      return;
    }
    if (type === 'appointment') {
      pendingGpsRef.current = gpsPromise;
      setShowAppointment(true);
      return;
    }
    if (type === 'appointment_visit') {
      pendingGpsRef.current = gpsPromise;
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
      setShowPresentationLocation(true);
      return;
    }
    if (type === 'prospect') {
      pendingGpsRef.current = gpsPromise;
      setShowProspect(true);
      return;
    }
    recordActivity(type, {}, gpsPromise);
  };

  const handleAgeSelect = (ageGroup: AgeGroup) => {
    if (!pendingContactType) return;
    recordPendingActivity(pendingContactType, { ageGroup });
    setPendingContactType(null);
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

  const handleAppointmentVisitSelect = (
    appointmentVisitKind: AppointmentVisitKind,
  ) => {
    recordPendingActivity('appointment_visit', { appointmentVisitKind });
    setShowAppointmentVisit(false);
  };

  const handlePresentationLocationSelect = (
    presentationLocation: PresentationLocation,
  ) => {
    recordPendingActivity('presentation', { presentationLocation });
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
      <Header totalCount={total} />
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
            <h2 className="counter-section-title">🔲 集計・報告</h2>
            <div className="counter-button-grid counter-button-grid--report">
              <SummaryButton
                totalCount={total}
                onTap={() => setShowSummary(true)}
              />
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

      {pendingContactType && (
        <AgeGroupModal
          contactLabel={getActivityDef(pendingContactType)?.label ?? ''}
          onSelect={handleAgeSelect}
          onCancel={() => {
            cancelPendingGps();
            setPendingContactType(null);
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

      {showAppointmentVisit && (
        <ChoiceModal
          title="アポ訪問"
          description="アポ種別を選択すると記録されます"
          options={APPOINTMENT_VISIT_KINDS}
          onSelect={handleAppointmentVisitSelect}
          onCancel={() => {
            cancelPendingGps();
            setShowAppointmentVisit(false);
          }}
        />
      )}

      {showPresentationLocation && (
        <PresentationLocationModal
          onSelect={handlePresentationLocationSelect}
          onCancel={() => {
            cancelPendingGps();
            setShowPresentationLocation(false);
          }}
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

      {showSummary && (
        <SummaryModal
          activities={activities}
          onClose={() => setShowSummary(false)}
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
