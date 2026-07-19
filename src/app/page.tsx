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
import { ProspectTargetModal } from '@/components/ProspectTargetModal';
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
  SALE_ENTRY_KINDS,
} from '@/lib/constants';
import { requestCurrentGps } from '@/lib/geolocation';
import { useCounterStore } from '@/store/useCounterStore';
import { useDailyReportStore } from '@/store/useDailyReportStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type {
  Activity,
  ActivityDetails,
  ActivityRecordSource,
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
  SaleEntryKind,
} from '@/types';

const AUTO_EVENT_GAP_MS = 10_000;
const SAME_HOUSEHOLD_PRESS_WINDOW_MS = 60_000;

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

const sessionId = () =>
  'session-' +
  Date.now().toString(36) +
  '-' +
  Math.random().toString(36).slice(2, 8);

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
  recordSource: ActivityRecordSource;
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
  | { kind: 'ensure_instant_appointment' }
  | { kind: 'ensure_instant_visit' }
  | { kind: 'presentation_location'; entryKind: PresentationEntryKind }
  | { kind: 'prospect' }
  | { kind: 'sale' }
  | {
      kind: 'append_sale';
      entryKind?: SaleEntryKind;
      linkedProspectId?: string;
      linkedProspectLabel?: string;
    };

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
  | { kind: 'prospect' }
  | { kind: 'sale_entry' }
  | { kind: 'prospect_target'; prospects: Activity[] };

interface FunnelFlow {
  sessionId: string;
  operationId: string;
  closePressId?: string;
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
  const periodStartedAt = useCounterStore((state) => state.periodStartedAt);
  const activeSessionId = useCounterStore((state) => state.activeSessionId);
  const add = useCounterStore((state) => state.add);
  const updateActivity = useCounterStore((state) => state.updateActivity);
  const setActiveSessionId = useCounterStore(
    (state) => state.setActiveSessionId,
  );
  const undoLast = useCounterStore((state) => state.undoLast);
  const reset = useCounterStore((state) => state.reset);
  const dailyReports = useDailyReportStore((state) => state.reports);
  const saveDailyReport = useDailyReportStore(
    (state) => state.saveDailyReport,
  );
  const gpsEnabled = useSettingsStore((state) => state.gpsEnabled);
  const setGpsEnabled = useSettingsStore((state) => state.setGpsEnabled);

  const counterActivities = useMemo(() => {
    if (!hydrated) return [];
    const currentOperationIds = new Set(
      activities
        .filter((activity) => activity.timestamp > periodStartedAt)
        .map((activity) => activity.operationId)
        .filter((id): id is string => Boolean(id)),
    );
    return activities.filter(
      (activity) =>
        activity.timestamp > periodStartedAt ||
        Boolean(
          activity.operationId &&
            currentOperationIds.has(activity.operationId),
        ),
    );
  }, [activities, hydrated, periodStartedAt]);
  const countOf = (type: string) =>
    counterActivities.filter((activity) => activity.type === type).length;
  const total = counterActivities.length;
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

  const soldSessionIds = useMemo(
    () =>
      new Set(
        activities
          .filter((activity) => activity.type === 'sale' && activity.sessionId)
          .map((activity) => activity.sessionId!),
      ),
    [activities],
  );

  const prospects = useMemo(
    () =>
      hydrated
        ? activities
            .filter(
              (activity) =>
                activity.type === 'prospect' &&
                (!activity.sessionId || !soldSessionIds.has(activity.sessionId)),
            )
            .sort((left, right) => right.timestamp - left.timestamp)
        : [],
    [activities, hydrated, soldSessionIds],
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

  const sessionActivitiesOf = (flow: FunnelFlow) =>
    activities.filter((activity) => activity.sessionId === flow.sessionId);

  const sessionHasType = (flow: FunnelFlow, type: ActivityType) =>
    sessionActivitiesOf(flow).some((activity) => activity.type === type) ||
    flow.planned.some((activity) => activity.type === type);

  const latestSessionRecord = (flow: FunnelFlow, type: ActivityType) =>
    [...sessionActivitiesOf(flow), ...flow.planned]
      .reverse()
      .find((activity) => activity.type === type);

  const latestSessionActivity = (flow: FunnelFlow) =>
    flow.planned[flow.planned.length - 1] ??
    sessionActivitiesOf(flow)[sessionActivitiesOf(flow).length - 1];

  const recordSourceFor = (
    flow: FunnelFlow,
    type: ActivityType,
  ): ActivityRecordSource =>
    type === flow.finalTarget ? 'manual' : 'auto_backfill';

  const finishFunnelFlow = (flow: FunnelFlow) => {
    const gpsPromise = pendingGpsRef.current ?? createGpsPromise();
    pendingGpsRef.current = null;
    const storedSessionActivities = sessionActivitiesOf(flow);
    const lastStoredTimestamp =
      storedSessionActivities[storedSessionActivities.length - 1]?.timestamp;
    const spacing =
      lastStoredTimestamp === undefined
        ? AUTO_EVENT_GAP_MS
        : Math.max(
            1,
            Math.min(
              AUTO_EVENT_GAP_MS,
              Math.floor(
                (flow.anchorTimestamp - lastStoredTimestamp) /
                  Math.max(flow.planned.length, 1),
              ),
            ),
          );
    const firstTimestamp =
      lastStoredTimestamp === undefined
        ? flow.anchorTimestamp -
          AUTO_EVENT_GAP_MS * (flow.planned.length - 1)
        : lastStoredTimestamp + spacing;

    if (flow.closePressId) {
      updateActivity(flow.closePressId, {
        interphoneAttemptOutcome: '無応答',
      });
    }

    const responsePlanned = flow.planned.some(
      (planned) => planned.type === 'interphone_response',
    );
    if (responsePlanned) {
      const plannedPress = [...flow.planned]
        .reverse()
        .find((planned) => planned.type === 'interphone');
      if (plannedPress) {
        plannedPress.details.interphoneAttemptOutcome = '応答';
      } else {
        const storedPress = [...sessionActivitiesOf(flow)]
          .reverse()
          .find((activity) => activity.type === 'interphone');
        if (storedPress) {
          updateActivity(storedPress.id, {
            interphoneAttemptOutcome: '応答',
          });
        }
      }
    }

    flow.planned.forEach((planned, index) => {
      recordActivity(
        planned.type,
        {
          ...planned.details,
          sessionId: flow.sessionId,
          operationId: flow.operationId,
          recordSource: planned.recordSource,
        },
        gpsPromise,
        firstTimestamp + spacing * index,
        planned.id,
      );
    });

    setActiveSessionId(flow.finalTarget === 'sale' ? undefined : flow.sessionId);
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

      if (task.kind === 'ensure_interphone') {
        if (!sessionHasType(next, 'interphone')) {
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
        if (!sessionHasType(next, 'interphone_response')) {
          next.tasks.unshift(
            { kind: 'ensure_interphone' },
            { kind: 'interphone_response' },
          );
        }
        continue;
      }

      if (task.kind === 'interphone_response') {
        if (sessionHasType(next, 'interphone_response')) continue;
        next.modal = { kind: 'interphone_response' };
        setFunnelFlow(next);
        return;
      }

      if (task.kind === 'ensure_face_contact') {
        if (!sessionHasType(next, 'face_to_face_contact')) {
          next.tasks.unshift(
            { kind: 'ensure_interphone_response' },
            { kind: 'face_contact' },
          );
        }
        continue;
      }

      if (task.kind === 'face_contact') {
        if (sessionHasType(next, 'face_to_face_contact')) continue;
        next.modal = { kind: 'face_contact' };
        setFunnelFlow(next);
        return;
      }

      if (task.kind === 'appointment') {
        if (sessionHasType(next, 'appointment')) continue;
        if (sessionHasType(next, 'face_to_face_contact')) {
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
        if (sessionHasType(next, 'appointment_visit')) continue;
        next.modal = { kind: 'appointment_visit_kind' };
        setFunnelFlow(next);
        return;
      }

      if (task.kind === 'append_appointment_visit') {
        if (sessionHasType(next, 'appointment_visit')) continue;
        next.planned.push({
          id: flowId(),
          type: 'appointment_visit',
          details: {
            appointmentVisitKind: task.visitKind,
            linkedAppointmentId: task.appointmentId,
            linkedAppointmentLabel: task.appointmentLabel,
          },
          recordSource: recordSourceFor(next, 'appointment_visit'),
        });
        continue;
      }

      if (task.kind === 'ensure_instant_appointment') {
        if (sessionHasType(next, 'appointment')) continue;
        next.planned.push({
          id: flowId(),
          type: 'appointment',
          details: {
            appointmentAcquisitionKind: '対面取得',
            appointmentCategory: '当日取得アポ',
            appointmentMemo: '即プレゼンによる自動補完',
          },
          recordSource: 'auto_backfill',
        });
        continue;
      }

      if (task.kind === 'ensure_instant_visit') {
        if (sessionHasType(next, 'appointment_visit')) continue;
        const appointment = latestSessionRecord(next, 'appointment');
        next.planned.push({
          id: flowId(),
          type: 'appointment_visit',
          details: {
            appointmentVisitKind: '当日取得アポ',
            linkedAppointmentId: appointment?.id,
            linkedAppointmentLabel: '即プレゼン補完',
          },
          recordSource: 'auto_backfill',
        });
        continue;
      }

      if (task.kind === 'presentation') {
        if (sessionHasType(next, 'presentation')) continue;
        if (sessionHasType(next, 'appointment_visit')) {
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
        if (sessionHasType(next, 'prospect')) continue;
        if (sessionHasType(next, 'presentation')) {
          next.modal = { kind: 'prospect' };
          setFunnelFlow(next);
          return;
        }
        next.tasks.unshift({ kind: 'presentation' }, { kind: 'prospect' });
        continue;
      }

      if (task.kind === 'sale') {
        if (sessionHasType(next, 'sale')) continue;
        if (latestSessionActivity(next)?.type === 'presentation') {
          next.tasks.unshift({ kind: 'append_sale' });
        } else {
          next.modal = { kind: 'sale_entry' };
          setFunnelFlow(next);
          return;
        }
        continue;
      }

      next.planned.push({
        id: flowId(),
        type: 'sale',
        details: {
          saleEntryKind: task.entryKind,
          linkedProspectId: task.linkedProspectId,
          linkedProspectLabel: task.linkedProspectLabel,
        },
        recordSource: recordSourceFor(next, 'sale'),
      });
    }

    finishFunnelFlow(next);
  };

  const selectSessionForTarget = (
    type: FunnelTarget,
    now: number,
  ): { selectedSessionId: string; closePressId?: string } => {
    const activeEvents = activeSessionId
      ? activities.filter((activity) => activity.sessionId === activeSessionId)
      : [];

    if (type === 'interphone') {
      const lastPress = [...activeEvents]
        .reverse()
        .find((activity) => activity.type === 'interphone');
      const responded = activeEvents.some(
        (activity) => activity.type === 'interphone_response',
      );
      const awaitingResponse = Boolean(lastPress && !responded);
      const reuse =
        awaitingResponse &&
        lastPress !== undefined &&
        now - lastPress.timestamp <= SAME_HOUSEHOLD_PRESS_WINDOW_MS;
      return {
        selectedSessionId:
          reuse && activeSessionId ? activeSessionId : sessionId(),
        closePressId: awaitingResponse ? lastPress?.id : undefined,
      };
    }

    const alreadyReached = activeEvents.some(
      (activity) => activity.type === type,
    );
    const terminal = activeEvents.some(
      (activity) =>
        activity.type === 'sale' ||
        activity.type === 'rejection_close' ||
        activity.type === 'pre_presentation_rejection' ||
        activity.type === 'post_presentation_rejection',
    );
    return {
      selectedSessionId:
        activeSessionId && !alreadyReached && !terminal
          ? activeSessionId
          : sessionId(),
    };
  };

  const startFunnelFlow = (type: FunnelTarget) => {
    const now = Date.now();
    const selection = selectSessionForTarget(type, now);
    pendingGpsRef.current = createGpsPromise();
    advanceFunnelFlow({
      sessionId: selection.selectedSessionId,
      operationId: flowId(),
      closePressId: selection.closePressId,
      finalTarget: type,
      anchorTimestamp: now,
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
    recordActivity(type, { operationId: flowId(), recordSource: 'manual' }, gpsPromise);
  };

  const handleCustomerStatusSelect = (customerStatus: CustomerStatus) => {
    if (!funnelFlow) return;
    continueFunnelFlow([
      ...funnelFlow.planned,
      {
        id: flowId(),
        type: 'interphone',
        details: { customerStatus },
        recordSource: recordSourceFor(funnelFlow, 'interphone'),
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
        recordSource: recordSourceFor(funnelFlow, 'interphone_response'),
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
        recordSource: recordSourceFor(funnelFlow, 'face_to_face_contact'),
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
          recordSource: recordSourceFor(funnelFlow, 'appointment'),
        },
      ],
      tasks,
    );
  };

  const handleAppointmentVisitSelect = (
    appointmentVisitKind: AppointmentVisitKind,
  ) => {
    if (!funnelFlow) return;
    const visitedSessionIds = new Set(
      activities
        .filter(
          (activity) =>
            activity.type === 'appointment_visit' && activity.sessionId,
        )
        .map((activity) => activity.sessionId!),
    );
    const matchingAppointments = appointments.filter(
      (appointment) =>
        appointmentCategoryOf(appointment) === appointmentVisitKind &&
        (!appointment.sessionId ||
          !visitedSessionIds.has(appointment.sessionId)),
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
    const targetSessionId = appointment.sessionId ?? funnelFlow.sessionId;
    advanceFunnelFlow({
      ...funnelFlow,
      sessionId: targetSessionId,
      planned: [],
      tasks: [
        { kind: 'ensure_face_contact' },
        {
          kind: 'append_appointment_visit',
          visitKind,
          appointmentId: appointment.id,
          appointmentLabel: appointmentDisplayLabel(appointment),
        },
        ...funnelFlow.tasks,
      ],
      modal: null,
    });
  };

  const handleCreateAppointmentForVisit = () => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'appointment_target') return;
    const visitKind = funnelFlow.modal.visitKind;
    const appointmentId = flowId();
    continueFunnelFlow(funnelFlow.planned, [
      { kind: 'ensure_face_contact' },
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
            { kind: 'ensure_face_contact' },
            { kind: 'ensure_instant_appointment' },
            { kind: 'ensure_instant_visit' },
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
        recordSource: recordSourceFor(funnelFlow, 'presentation'),
      },
    ]);
  };

  const handleSaleEntrySelect = (saleEntryKind: SaleEntryKind) => {
    if (!funnelFlow) return;
    if (saleEntryKind === '保留／見込からの成約') {
      setFunnelFlow({
        ...funnelFlow,
        modal: { kind: 'prospect_target', prospects },
      });
      return;
    }
    continueFunnelFlow(funnelFlow.planned, [
      { kind: 'presentation' },
      { kind: 'append_sale', entryKind: saleEntryKind },
      ...funnelFlow.tasks,
    ]);
  };

  const handleProspectTargetSelect = (prospect: Activity) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'prospect_target') return;
    const targetSessionId = prospect.sessionId ?? funnelFlow.sessionId;
    const label =
      prospect.prospectComment?.trim() ||
      '見込度 ' + (prospect.prospectRating ?? 0) + ' / 5';
    advanceFunnelFlow({
      ...funnelFlow,
      sessionId: targetSessionId,
      planned: [],
      tasks: [
        { kind: 'presentation' },
        {
          kind: 'append_sale',
          entryKind: '保留／見込からの成約',
          linkedProspectId: prospect.id,
          linkedProspectLabel: label,
        },
        ...funnelFlow.tasks,
      ],
      modal: null,
    });
  };

  const handleProspectTargetNewPresentation = () => {
    if (!funnelFlow) return;
    continueFunnelFlow(funnelFlow.planned, [
      { kind: 'presentation' },
      { kind: 'append_sale', entryKind: '新規プレゼン' },
      ...funnelFlow.tasks,
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
      sessionId: activeSessionId ?? sessionId(),
      operationId: flowId(),
      recordSource: 'manual',
    });
    setActiveSessionId(undefined);
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
        recordSource: recordSourceFor(funnelFlow, 'prospect'),
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

      {funnelFlow?.modal?.kind === 'sale_entry' && (
        <ChoiceModal
          title="セールス前確認"
          description="今回の成約経路を選択してください"
          options={SALE_ENTRY_KINDS}
          onSelect={handleSaleEntrySelect}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'prospect_target' && (
        <ProspectTargetModal
          prospects={funnelFlow.modal.prospects}
          onSelect={handleProspectTargetSelect}
          onNewPresentation={handleProspectTargetNewPresentation}
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
          activities={counterActivities}
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
