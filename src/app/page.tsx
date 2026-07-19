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
import { AppointmentTargetModal } from '@/components/AppointmentTargetModal';
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
  APPOINTMENT_ACQUISITION_KINDS,
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
  AppointmentAcquisitionKind,
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

const AUTO_EVENT_GAP_MS = 10_000;

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

const appointmentCategoryOf = (activity: Activity): AppointmentVisitKind =>
  activity.appointmentCategory ??
  (activity.appointmentDate === localDateKey(activity.timestamp)
    ? '当日取得アポ'
    : '予定アポ');

const appointmentDisplayLabel = (details: ActivityDetails) => {
  const date = details.appointmentDate ?? '日時未設定';
  const time = details.appointmentStartTime
    ? ` ${details.appointmentStartTime}${
        details.appointmentEndTime ? `〜${details.appointmentEndTime}` : ''
      }`
    : '';
  return `${date}${time}`;
};

const flowId = () =>
  `flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type FunnelTarget =
  | 'interphone'
  | 'interphone_response'
  | 'face_to_face_contact'
  | 'appointment'
  | 'appointment_visit'
  | 'presentation'
  | 'prospect'
  | 'sale';

type PlannedActivity = {
  id: string;
  type: ActivityType;
  details: ActivityDetails;
};

type FlowTask =
  | { kind: 'ensure_interphone' }
  | { kind: 'interphone' }
  | { kind: 'ensure_interphone_response' }
  | { kind: 'interphone_response' }
  | { kind: 'ensure_face_contact' }
  | { kind: 'face_contact' }
  | {
      kind: 'appointment';
      appointmentId: string;
      categoryOverride?: AppointmentVisitKind;
    }
  | {
      kind: 'appointment_form';
      appointmentId: string;
      acquisitionKind: AppointmentAcquisitionKind;
      categoryOverride?: AppointmentVisitKind;
    }
  | { kind: 'appointment_visit' }
  | {
      kind: 'append_appointment_visit';
      visitKind: AppointmentVisitKind;
      appointmentId: string;
      appointmentLabel?: string;
    }
  | { kind: 'presentation' }
  | { kind: 'presentation_location'; entryKind: PresentationEntryKind }
  | { kind: 'prospect' }
  | { kind: 'sale' };

type FlowModal =
  | { kind: 'customer_status' }
  | { kind: 'interphone_response' }
  | { kind: 'face_contact' }
  | {
      kind: 'appointment_source';
      appointmentId: string;
      categoryOverride?: AppointmentVisitKind;
    }
  | {
      kind: 'appointment_form';
      appointmentId: string;
      acquisitionKind: AppointmentAcquisitionKind;
      categoryOverride?: AppointmentVisitKind;
    }
  | { kind: 'appointment_visit_kind' }
  | {
      kind: 'appointment_target';
      visitKind: AppointmentVisitKind;
      appointments: Activity[];
    }
  | { kind: 'presentation_entry' }
  | { kind: 'presentation_location'; entryKind: PresentationEntryKind }
  | { kind: 'prospect' };

interface FunnelFlow {
  finalTarget: FunnelTarget;
  anchorTimestamp: number;
  planned: PlannedActivity[];
  tasks: FlowTask[];
  modal: FlowModal | null;
}

const tasksForTarget = (type: FunnelTarget): FlowTask[] => {
  if (type === 'interphone') return [{ kind: 'interphone' }];
  if (type === 'interphone_response') {
    return [{ kind: 'ensure_interphone' }, { kind: 'interphone_response' }];
  }
  if (type === 'face_to_face_contact') {
    return [{ kind: 'ensure_interphone_response' }, { kind: 'face_contact' }];
  }
  if (type === 'appointment') {
    return [{ kind: 'appointment', appointmentId: flowId() }];
  }
  if (type === 'appointment_visit') return [{ kind: 'appointment_visit' }];
  if (type === 'presentation') return [{ kind: 'presentation' }];
  if (type === 'prospect') return [{ kind: 'prospect' }];
  return [{ kind: 'sale' }];
};

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [activeView, setActiveView] = useState<HomeView>('counter');
  const [funnelFlow, setFunnelFlow] = useState<FunnelFlow | null>(null);
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
    timestamp?: number,
    requestedId?: string,
  ) => {
    const id = add(
      type,
      {
        ...details,
        gpsStatus: gpsEnabled ? 'pending' : 'disabled',
      },
      timestamp,
      requestedId,
    );
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

  const cancelFunnelFlow = () => {
    cancelPendingGps();
    setFunnelFlow(null);
  };

  const previousTypeOf = (flow: FunnelFlow): ActivityType | undefined =>
    flow.planned[flow.planned.length - 1]?.type ??
    activities[activities.length - 1]?.type;

  const finishFunnelFlow = (flow: FunnelFlow) => {
    const gpsPromise = pendingGpsRef.current ?? createGpsPromise();
    pendingGpsRef.current = null;
    const firstTimestamp =
      flow.anchorTimestamp - AUTO_EVENT_GAP_MS * (flow.planned.length - 1);

    flow.planned.forEach((planned, index) => {
      recordActivity(
        planned.type,
        planned.details,
        gpsPromise,
        firstTimestamp + AUTO_EVENT_GAP_MS * index,
        planned.id,
      );
    });

    setFunnelFlow(null);
    if (flow.finalTarget === 'appointment') setActiveView('appointments');
    if (flow.finalTarget === 'prospect') setActiveView('prospects');
  };

  const advanceFunnelFlow = (candidate: FunnelFlow) => {
    const next: FunnelFlow = {
      ...candidate,
      planned: [...candidate.planned],
      tasks: [...candidate.tasks],
      modal: null,
    };

    while (next.tasks.length > 0) {
      const task = next.tasks.shift()!;
      const previousType = previousTypeOf(next);

      if (task.kind === 'ensure_interphone') {
        if (previousType !== 'interphone') {
          next.tasks.unshift({ kind: 'interphone' });
        }
        continue;
      }

      if (task.kind === 'interphone') {
        next.modal = { kind: 'customer_status' };
        setFunnelFlow(next);
        return;
      }

      if (task.kind === 'ensure_interphone_response') {
        if (previousType !== 'interphone_response') {
          next.tasks.unshift(
            { kind: 'ensure_interphone' },
            { kind: 'interphone_response' },
          );
        }
        continue;
      }

      if (task.kind === 'interphone_response') {
        next.modal = { kind: 'interphone_response' };
        setFunnelFlow(next);
        return;
      }

      if (task.kind === 'ensure_face_contact') {
        if (previousType !== 'face_to_face_contact') {
          next.tasks.unshift(
            { kind: 'ensure_interphone_response' },
            { kind: 'face_contact' },
          );
        }
        continue;
      }

      if (task.kind === 'face_contact') {
        next.modal = { kind: 'face_contact' };
        setFunnelFlow(next);
        return;
      }

      if (task.kind === 'appointment') {
        if (previousType === 'face_to_face_contact') {
          next.tasks.unshift({
            kind: 'appointment_form',
            appointmentId: task.appointmentId,
            acquisitionKind: '対面取得',
            categoryOverride: task.categoryOverride,
          });
        } else {
          next.modal = {
            kind: 'appointment_source',
            appointmentId: task.appointmentId,
            categoryOverride: task.categoryOverride,
          };
          setFunnelFlow(next);
          return;
        }
        continue;
      }

      if (task.kind === 'appointment_form') {
        next.modal = {
          kind: 'appointment_form',
          appointmentId: task.appointmentId,
          acquisitionKind: task.acquisitionKind,
          categoryOverride: task.categoryOverride,
        };
        setFunnelFlow(next);
        return;
      }

      if (task.kind === 'appointment_visit') {
        next.modal = { kind: 'appointment_visit_kind' };
        setFunnelFlow(next);
        return;
      }

      if (task.kind === 'append_appointment_visit') {
        next.planned.push({
          id: flowId(),
          type: 'appointment_visit',
          details: {
            appointmentVisitKind: task.visitKind,
            linkedAppointmentId: task.appointmentId,
            linkedAppointmentLabel: task.appointmentLabel,
          },
        });
        continue;
      }

      if (task.kind === 'presentation') {
        if (previousType === 'appointment_visit') {
          next.tasks.unshift({
            kind: 'presentation_location',
            entryKind: 'アポ訪問',
          });
        } else {
          next.modal = { kind: 'presentation_entry' };
          setFunnelFlow(next);
          return;
        }
        continue;
      }

      if (task.kind === 'presentation_location') {
        next.modal = {
          kind: 'presentation_location',
          entryKind: task.entryKind,
        };
        setFunnelFlow(next);
        return;
      }

      if (task.kind === 'prospect') {
        if (previousType === 'presentation') {
          next.modal = { kind: 'prospect' };
          setFunnelFlow(next);
          return;
        }
        next.tasks.unshift({ kind: 'presentation' }, { kind: 'prospect' });
        continue;
      }

      if (previousType === 'presentation') {
        next.planned.push({ id: flowId(), type: 'sale', details: {} });
      } else {
        next.tasks.unshift({ kind: 'presentation' }, { kind: 'sale' });
      }
    }

    finishFunnelFlow(next);
  };

  const startFunnelFlow = (type: FunnelTarget) => {
    pendingGpsRef.current = createGpsPromise();
    advanceFunnelFlow({
      finalTarget: type,
      anchorTimestamp: Date.now(),
      planned: [],
      tasks: tasksForTarget(type),
      modal: null,
    });
  };

  const continueFunnelFlow = (
    planned: PlannedActivity[],
    tasks = funnelFlow?.tasks ?? [],
  ) => {
    if (!funnelFlow) return;
    advanceFunnelFlow({
      ...funnelFlow,
      planned,
      tasks,
      modal: null,
    });
  };

  const handleTap = (type: ActivityType) => {
    if (
      type === 'interphone' ||
      type === 'interphone_response' ||
      type === 'face_to_face_contact' ||
      type === 'appointment' ||
      type === 'appointment_visit' ||
      type === 'presentation' ||
      type === 'prospect' ||
      type === 'sale'
    ) {
      startFunnelFlow(type);
      return;
    }

    const gpsPromise = createGpsPromise();
    if (
      type === 'rejection_close' ||
      type === 'pre_presentation_rejection' ||
      type === 'post_presentation_rejection'
    ) {
      pendingGpsRef.current = gpsPromise;
      setPendingRejectionType(type);
      return;
    }
    recordActivity(type, {}, gpsPromise);
  };

  const handleCustomerStatusSelect = (customerStatus: CustomerStatus) => {
    if (!funnelFlow) return;
    continueFunnelFlow([
      ...funnelFlow.planned,
      {
        id: flowId(),
        type: 'interphone',
        details: { customerStatus },
      },
    ]);
  };

  const handleInterphoneResponseSelect = (
    interphoneResponseKind: InterphoneResponseKind,
  ) => {
    if (!funnelFlow) return;
    continueFunnelFlow([
      ...funnelFlow.planned,
      {
        id: flowId(),
        type: 'interphone_response',
        details: { interphoneResponseKind },
      },
    ]);
  };

  const handleFaceContactSave = (
    faceContactKind: FaceContactKind,
    ageGroup: AgeGroup,
  ) => {
    if (!funnelFlow) return;
    continueFunnelFlow([
      ...funnelFlow.planned,
      {
        id: flowId(),
        type: 'face_to_face_contact',
        details: { faceContactKind, ageGroup },
      },
    ]);
  };

  const handleAppointmentSourceSelect = (
    acquisitionKind: AppointmentAcquisitionKind,
  ) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'appointment_source') return;
    const { appointmentId, categoryOverride } = funnelFlow.modal;
    const formTask: FlowTask = {
      kind: 'appointment_form',
      appointmentId,
      acquisitionKind,
      categoryOverride,
    };
    const tasks =
      acquisitionKind === '対面取得'
        ? [{ kind: 'ensure_face_contact' } as FlowTask, formTask, ...funnelFlow.tasks]
        : [formTask, ...funnelFlow.tasks];
    continueFunnelFlow(funnelFlow.planned, tasks);
  };

  const handleAppointmentSave = (details: AppointmentDetails) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'appointment_form') return;
    const { appointmentId, acquisitionKind, categoryOverride } =
      funnelFlow.modal;
    const appointmentCategory =
      categoryOverride ??
      (details.appointmentDate === localDateKey(funnelFlow.anchorTimestamp)
        ? '当日取得アポ'
        : '予定アポ');
    const appointmentLabel = appointmentDisplayLabel(details);
    const tasks = [...funnelFlow.tasks];
    if (
      tasks[0]?.kind === 'append_appointment_visit' &&
      tasks[0].appointmentId === appointmentId
    ) {
      tasks[0] = { ...tasks[0], appointmentLabel };
    }

    continueFunnelFlow(
      [
        ...funnelFlow.planned,
        {
          id: appointmentId,
          type: 'appointment',
          details: {
            ...details,
            appointmentAcquisitionKind: acquisitionKind,
            appointmentCategory,
          },
        },
      ],
      tasks,
    );
  };

  const handleAppointmentVisitSelect = (
    appointmentVisitKind: AppointmentVisitKind,
  ) => {
    if (!funnelFlow) return;
    const matchingAppointments = appointments.filter(
      (appointment) =>
        appointmentCategoryOf(appointment) === appointmentVisitKind,
    );
    setFunnelFlow({
      ...funnelFlow,
      modal: {
        kind: 'appointment_target',
        visitKind: appointmentVisitKind,
        appointments: matchingAppointments,
      },
    });
  };

  const handleAppointmentTargetSelect = (appointment: Activity) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'appointment_target') return;
    const visitKind = funnelFlow.modal.visitKind;
    continueFunnelFlow([
      ...funnelFlow.planned,
      {
        id: flowId(),
        type: 'appointment_visit',
        details: {
          appointmentVisitKind: visitKind,
          linkedAppointmentId: appointment.id,
          linkedAppointmentLabel: appointmentDisplayLabel(appointment),
        },
      },
    ]);
  };

  const handleCreateAppointmentForVisit = () => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'appointment_target') return;
    const visitKind = funnelFlow.modal.visitKind;
    const appointmentId = flowId();
    continueFunnelFlow(funnelFlow.planned, [
      {
        kind: 'appointment',
        appointmentId,
        categoryOverride: visitKind,
      },
      {
        kind: 'append_appointment_visit',
        visitKind,
        appointmentId,
      },
      ...funnelFlow.tasks,
    ]);
  };

  const handlePresentationEntrySelect = (
    presentationEntryKind: PresentationEntryKind,
  ) => {
    if (!funnelFlow) return;
    const tasks: FlowTask[] =
      presentationEntryKind === '即プレゼン'
        ? [
            {
              kind: 'presentation_location',
              entryKind: presentationEntryKind,
            },
            ...funnelFlow.tasks,
          ]
        : [
            { kind: 'appointment_visit' },
            {
              kind: 'presentation_location',
              entryKind: presentationEntryKind,
            },
            ...funnelFlow.tasks,
          ];
    continueFunnelFlow(funnelFlow.planned, tasks);
  };

  const handlePresentationLocationSelect = (
    presentationLocation: PresentationLocation,
  ) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'presentation_location') return;
    continueFunnelFlow([
      ...funnelFlow.planned,
      {
        id: flowId(),
        type: 'presentation',
        details: {
          presentationEntryKind: funnelFlow.modal.entryKind,
          presentationLocation,
        },
      },
    ]);
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
    if (!funnelFlow) return;
    continueFunnelFlow([
      ...funnelFlow.planned,
      {
        id: flowId(),
        type: 'prospect',
        details: { prospectRating, prospectComment },
      },
    ]);
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

      {funnelFlow?.modal?.kind === 'customer_status' && (
        <CustomerStatusModal
          onSelect={handleCustomerStatusSelect}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'interphone_response' && (
        <ChoiceModal
          title="インターホン応答"
          description="応答回数を選択してください"
          options={INTERPHONE_RESPONSE_KINDS}
          onSelect={handleInterphoneResponseSelect}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'face_contact' && (
        <FaceContactModal
          onSave={handleFaceContactSave}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'appointment_source' && (
        <ChoiceModal
          title="アポ取得経路"
          description="今回のアポ取得経路を選択してください"
          options={APPOINTMENT_ACQUISITION_KINDS}
          onSelect={handleAppointmentSourceSelect}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'appointment_form' && (
        <AppointmentModal
          onSave={handleAppointmentSave}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'appointment_visit_kind' && (
        <ChoiceModal
          title="アポ訪問"
          description="アポ種別を選択してください"
          options={APPOINTMENT_VISIT_KINDS}
          onSelect={handleAppointmentVisitSelect}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'appointment_target' && (
        <AppointmentTargetModal
          visitKind={funnelFlow.modal.visitKind}
          appointments={funnelFlow.modal.appointments}
          onSelect={handleAppointmentTargetSelect}
          onCreate={handleCreateAppointmentForVisit}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'presentation_entry' && (
        <ChoiceModal
          title="プレゼン前確認"
          description="今回のプレゼン種別を選択してください"
          options={PRESENTATION_ENTRY_KINDS}
          onSelect={handlePresentationEntrySelect}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'presentation_location' && (
        <PresentationLocationModal
          onSelect={handlePresentationLocationSelect}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'prospect' && (
        <ProspectModal
          onSave={handleProspectSave}
          onCancel={cancelFunnelFlow}
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
