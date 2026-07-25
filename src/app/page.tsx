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
import { DailyReportButton } from '@/components/DailyReportButton';
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
  getActivityDef,
  PRESENTATION_ENTRY_KINDS,
  SALE_ENTRY_KINDS,
} from '@/lib/constants';
import { requestCurrentGps } from '@/lib/geolocation';
import {
  laterStage,
  PREREQUISITE_STAGE_ORDER,
  reachedStageIndex,
} from '@/lib/session';
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
  FunnelStage,
  GpsDetails,
  PresentationEntryKind,
  PresentationLocation,
  PriorStageDetails,
  ProspectRating,
  RejectionReason,
  SaleEntryKind,
  SessionOrigin,
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

const sessionId = () =>
  'session-' +
  Date.now().toString(36) +
  '-' +
  Math.random().toString(36).slice(2, 8);

type RejectionActivityType =
  | 'rejection_close'
  | 'pre_presentation_rejection'
  | 'post_presentation_rejection';

type FunnelTarget =
  | 'interphone'
  | 'interphone_response'
  | 'face_to_face_contact'
  | 'appointment'
  | 'appointment_visit'
  | 'presentation'
  | 'prospect'
  | 'sale'
  | RejectionActivityType;

type PlannedActivity = {
  id: string;
  type: ActivityType;
  details: ActivityDetails;
  recordSource: ActivityRecordSource;
  timestamp?: number;
};

type HistoricalStage = Exclude<FunnelStage, 'sale'>;

interface StageTimingContext {
  targetStage: HistoricalStage;
  resumeTask: FlowTask;
}

interface PriorDetailContext {
  stage: HistoricalStage;
  timing: StageTimingContext;
}

type FlowTask =
  | { kind: 'ensure_interphone'; historyChecked?: boolean }
  | { kind: 'interphone' }
  | { kind: 'ensure_interphone_response'; historyChecked?: boolean }
  | { kind: 'interphone_response' }
  | { kind: 'ensure_face_contact'; historyChecked?: boolean }
  | { kind: 'face_contact' }
  | {
      kind: 'appointment';
      appointmentId: string;
      categoryOverride?: AppointmentVisitKind;
      historyChecked?: boolean;
    }
  | {
      kind: 'appointment_form';
      appointmentId: string;
      acquisitionKind: AppointmentAcquisitionKind;
      categoryOverride?: AppointmentVisitKind;
    }
  | { kind: 'appointment_visit'; historyChecked?: boolean }
  | {
      kind: 'append_appointment_visit';
      visitKind?: AppointmentVisitKind;
      appointmentId?: string;
      appointmentLabel?: string;
    }
  | { kind: 'presentation'; historyChecked?: boolean }
  | { kind: 'ensure_instant_appointment' }
  | { kind: 'ensure_instant_visit' }
  | { kind: 'presentation_location'; entryKind: PresentationEntryKind }
  | { kind: 'prospect'; historyChecked?: boolean }
  | { kind: 'sale' }

  | { kind: 'rejection'; type: RejectionActivityType }
  | {
      kind: 'append_sale';
      entryKind?: SaleEntryKind;
      linkedAppointmentId?: string;
      linkedAppointmentLabel?: string;
      linkedProspectId?: string;
      linkedProspectLabel?: string;
    };

type FlowModal =
  | { kind: 'customer_status'; prior?: PriorDetailContext }
  | { kind: 'face_contact'; prior?: PriorDetailContext }
  | {
      kind: 'appointment_source';
      appointmentId?: string;
      categoryOverride?: AppointmentVisitKind;
      prior?: PriorDetailContext;
    }
  | {
      kind: 'appointment_form';
      appointmentId: string;
      acquisitionKind: AppointmentAcquisitionKind;
      categoryOverride?: AppointmentVisitKind;
    }
  | {
      kind: 'appointment_target';
      appointments: Activity[];
    }
  | { kind: 'presentation_entry' }
  | {
      kind: 'presentation_location';
      entryKind?: PresentationEntryKind;
      prior?: PriorDetailContext;
    }
  | { kind: 'prospect' }
  | { kind: 'sale_entry' }
  | { kind: 'sale_appointment_target'; appointments: Activity[] }
  | { kind: 'prospect_target'; prospects: Activity[] }
  | { kind: 'rejection_reason'; type: RejectionActivityType }
  | {
      kind: 'stage_timing';
      stage: HistoricalStage;
      timing: StageTimingContext;
    };

const HISTORICAL_STAGE_LABELS: Record<HistoricalStage, string> = {
  interphone: 'インターホン押下',
  interphone_response: 'インターホン応答',
  face_to_face_contact: '対面接触',
  appointment: 'アポ取得',
  appointment_visit: 'アポ訪問',
  presentation: 'プレゼン',
};

const HISTORICAL_STAGE_ORDER = PREREQUISITE_STAGE_ORDER;

const taskForHistoricalStage = (stage: HistoricalStage): FlowTask => {
  if (stage === 'interphone') return { kind: 'interphone' };
  if (stage === 'interphone_response') return { kind: 'interphone_response' };
  if (stage === 'face_to_face_contact') return { kind: 'face_contact' };
  if (stage === 'appointment') {
    return {
      kind: 'appointment',
      appointmentId: flowId(),
      historyChecked: true,
    };
  }
  if (stage === 'appointment_visit') {
    return { kind: 'appointment_visit', historyChecked: true };
  }
  return { kind: 'presentation', historyChecked: true };
};

interface FunnelFlow {
  sessionId: string;
  operationId: string;
  closePressId?: string;
  finalTarget: FunnelTarget;
  anchorTimestamp: number;
  sessionOrigin?: SessionOrigin;
  priorReachedThrough?: HistoricalStage;
  priorStageDetails?: PriorStageDetails;
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
  if (type === 'rejection_close' || type === 'pre_presentation_rejection') {
    return [
      { kind: 'ensure_face_contact' },
      { kind: 'rejection', type },
    ];
  }
  if (type === 'post_presentation_rejection') {
    return [
      { kind: 'presentation' },
      { kind: 'rejection', type },
    ];
  }
  return [{ kind: 'sale' }];
};

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [activeView, setActiveView] = useState<HomeView>('counter');
  const [funnelFlow, setFunnelFlow] = useState<FunnelFlow | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showActivityEnd, setShowActivityEnd] = useState(false);
  const pendingGpsRef = useRef<Promise<GpsDetails> | null>(null);

  useEffect(() => setHydrated(true), []);

  const activities = useCounterStore((state) => state.activities);
  const periodStartedAt = useCounterStore((state) => state.periodStartedAt);
  const activeSessionId = useCounterStore((state) => state.activeSessionId);
  const add = useCounterStore((state) => state.add);
  const updateActivity = useCounterStore((state) => state.updateActivity);
  const removeActivity = useCounterStore((state) => state.removeActivity);
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

  useEffect(() => {
    if (!hydrated || !activeSessionId) return;
    const latest = [...activities]
      .reverse()
      .find((activity) => activity.sessionId === activeSessionId);
    if (!latest || localDateKey(latest.timestamp) !== localDateKey(Date.now())) {
      setActiveSessionId(undefined);
    }
  }, [activeSessionId, activities, hydrated, setActiveSessionId]);

  const reportDate = localDateKey(Date.now());
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
        activity.recordSource !== 'historical_confirmation' &&
        (activity.timestamp > periodStartedAt ||
          Boolean(
            activity.recordSource === 'auto_backfill' &&
              activity.operationId &&
              currentOperationIds.has(activity.operationId),
          )),
    );
  }, [activities, hydrated, periodStartedAt]);
  const countOf = (type: string) =>
    counterActivities.filter((activity) => activity.type === type).length;
  const total = counterActivities.length;
  const todaysActivities = useMemo(
    () =>
      hydrated
        ? activities.filter(
            (activity) =>
              activity.recordSource !== 'historical_confirmation' &&
              localDateKey(activity.timestamp) === reportDate,
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
            .filter(
              (activity) =>
                activity.type === 'appointment' &&
                activity.recordSource !== 'historical_confirmation',
            )
            .sort((left, right) => {
              const keyComparison = appointmentSortKey(left).localeCompare(
                appointmentSortKey(right),
              );
              return keyComparison || right.timestamp - left.timestamp;
            })
        : [],
    [activities, hydrated],
  );

  const terminalSessionIds = useMemo(
    () =>
      new Set(
        activities
          .filter(
            (activity) =>
              activity.sessionId &&
              (activity.type === 'sale' ||
                activity.type === 'rejection_close' ||
                activity.type === 'pre_presentation_rejection' ||
                activity.type === 'post_presentation_rejection'),
          )
          .map((activity) => activity.sessionId!),
      ),
    [activities],
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

  const cancelPendingGps = () => {
    pendingGpsRef.current = null;
  };

  const cancelFunnelFlow = () => {
    cancelPendingGps();
    setFunnelFlow(null);
  };

  const sessionActivitiesOf = (flow: FunnelFlow) =>
    activities.filter((activity) => activity.sessionId === flow.sessionId);

  const priorReachedThroughOf = (
    flow: FunnelFlow,
  ): HistoricalStage | undefined => {
    const storedStages = sessionActivitiesOf(flow).map(
      (activity) => activity.priorReachedThrough,
    );
    const plannedStages = flow.planned.map(
      (activity) => activity.details.priorReachedThrough,
    );
    return [...storedStages, ...plannedStages, flow.priorReachedThrough].reduce<
      HistoricalStage | undefined
    >((latest, stage) => laterStage(latest, stage), undefined);
  };

  const priorStageDetailsOf = (flow: FunnelFlow): PriorStageDetails =>
    [
      ...sessionActivitiesOf(flow).map((activity) => activity.priorStageDetails),
      ...flow.planned.map((activity) => activity.details.priorStageDetails),
      flow.priorStageDetails,
    ].reduce<PriorStageDetails>(
      (details, current) => ({ ...details, ...(current ?? {}) }),
      {},
    );

  const sessionHasType = (flow: FunnelFlow, type: ActivityType) => {
    if (
      sessionActivitiesOf(flow).some((activity) => activity.type === type) ||
      flow.planned.some((activity) => activity.type === type)
    ) {
      return true;
    }
    const stageIndex = HISTORICAL_STAGE_ORDER.indexOf(
      type as HistoricalStage,
    );
    return (
      stageIndex >= 0 &&
      reachedStageIndex(priorReachedThroughOf(flow)) >= stageIndex
    );
  };

  const latestSessionRecord = (flow: FunnelFlow, type: ActivityType) =>
    [...sessionActivitiesOf(flow), ...flow.planned]
      .reverse()
      .find((activity) => activity.type === type);


  const visitableAppointmentsOf = (flow: FunnelFlow): Activity[] => {
    const visitedSessionIds = new Set(
      activities
        .filter(
          (activity) =>
            activity.type === 'appointment_visit' && activity.sessionId,
        )
        .map((activity) => activity.sessionId!),
    );
    const plannedAppointments: Activity[] = flow.planned
      .filter((planned) => planned.type === 'appointment')
      .map((planned) => ({
        id: planned.id,
        type: planned.type,
        timestamp: planned.timestamp ?? flow.anchorTimestamp,
        ...planned.details,
        sessionId: flow.sessionId,
        operationId: flow.operationId,
        recordSource: planned.recordSource,
      }));
    return [...plannedAppointments, ...appointments].filter(
      (appointment) =>
        !appointment.sessionId ||
        !visitedSessionIds.has(appointment.sessionId),
    );
  };

  const canAskHistorical = (
    flow: FunnelFlow,
    stage: HistoricalStage,
  ) => {
    const stageIndex = HISTORICAL_STAGE_ORDER.indexOf(stage);
    const startOfToday = new Date(flow.anchorTimestamp);
    startOfToday.setHours(0, 0, 0, 0);
    const earlierStages = new Set(
      HISTORICAL_STAGE_ORDER.slice(0, stageIndex),
    );
    const hasEarlierStageToday = [
      ...sessionActivitiesOf(flow),
      ...flow.planned.map((planned) => ({
        ...planned.details,
        id: planned.id,
        type: planned.type,
        timestamp: planned.timestamp ?? flow.anchorTimestamp,
      })),
    ].some(
      (activity) =>
        earlierStages.has(activity.type as HistoricalStage) &&
        activity.timestamp >= startOfToday.getTime(),
    );
    return !hasEarlierStageToday;
  };

  const stageTimingModal = (
    flow: FunnelFlow,
    targetStage: HistoricalStage,
    resumeTask: FlowTask,
  ): FlowModal => {
    const targetIndex = HISTORICAL_STAGE_ORDER.indexOf(targetStage);
    const firstMissingStage = HISTORICAL_STAGE_ORDER.slice(0, targetIndex + 1).find(
      (stage) => !sessionHasType(flow, stage),
    );
    return {
      kind: 'stage_timing',
      stage: firstMissingStage ?? targetStage,
      timing: { targetStage, resumeTask },
    };
  };

  const recordSourceFor = (
    flow: FunnelFlow,
    type: ActivityType,
  ): ActivityRecordSource =>
    type === flow.finalTarget ? 'manual' : 'auto_backfill';

  const finishFunnelFlow = (flow: FunnelFlow) => {
    const gpsPromise = pendingGpsRef.current ?? createGpsPromise();
    pendingGpsRef.current = null;
    const storedSessionActivities = sessionActivitiesOf(flow);
    const currentPlanned = flow.planned.filter(
      (planned) => planned.timestamp === undefined,
    );
    const currentCount = currentPlanned.length;
    const lastStoredTimestamp =
      storedSessionActivities.length > 0
        ? Math.max(
            ...storedSessionActivities.map((activity) => activity.timestamp),
          )
        : undefined;
    const defaultFirstTimestamp =
      flow.anchorTimestamp -
      AUTO_EVENT_GAP_MS * Math.max(currentCount - 1, 0);
    const needsCompression =
      lastStoredTimestamp !== undefined &&
      defaultFirstTimestamp <= lastStoredTimestamp;
    const spacing = needsCompression
      ? Math.max(
          1,
          Math.floor(
            (flow.anchorTimestamp - lastStoredTimestamp!) /
              Math.max(currentCount, 1),
          ),
        )
      : AUTO_EVENT_GAP_MS;
    const firstTimestamp = needsCompression
      ? lastStoredTimestamp! + spacing
      : defaultFirstTimestamp;
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

    const priorReachedThrough = priorReachedThroughOf(flow);
    const sessionOrigin =
      flow.sessionOrigin ??
      (priorReachedThrough ? 'carryover' : undefined);
    const collectedPriorStageDetails = priorStageDetailsOf(flow);
    const priorStageDetails =
      Object.keys(collectedPriorStageDetails).length > 0
        ? collectedPriorStageDetails
        : undefined;
    let currentIndex = 0;
    flow.planned.forEach((planned) => {
      const timestamp =
        planned.timestamp ?? firstTimestamp + spacing * currentIndex++;
      const plannedGpsPromise =
        planned.recordSource === 'historical_confirmation'
          ? Promise.resolve<GpsDetails>({ gpsStatus: 'unavailable' })
          : gpsPromise;
      recordActivity(
        planned.type,
        {
          ...planned.details,
          sessionId: flow.sessionId,
          operationId: flow.operationId,
          recordSource: planned.recordSource,
          sessionOrigin,
          priorReachedThrough,
          priorStageDetails,
        },
        plannedGpsPromise,
        timestamp,
        planned.id,
      );
    });

    const terminalTarget =
      flow.finalTarget === 'sale' ||
      flow.finalTarget === 'rejection_close' ||
      flow.finalTarget === 'pre_presentation_rejection' ||
      flow.finalTarget === 'post_presentation_rejection';
    setActiveSessionId(terminalTarget ? undefined : flow.sessionId);
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
          if (
            !task.historyChecked &&
            canAskHistorical(next, 'interphone')
          ) {
            next.modal = stageTimingModal(
              next,
              'interphone',
              {
                kind: 'ensure_interphone',
                historyChecked: true,
              },
            );
            setFunnelFlow(next);
            return;
          }
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
          if (
            !task.historyChecked &&
            canAskHistorical(next, 'interphone_response')
          ) {
            next.modal = stageTimingModal(
              next,
              'interphone_response',
              {
                kind: 'ensure_interphone_response',
                historyChecked: true,
              },
            );
            setFunnelFlow(next);
            return;
          }
          next.tasks.unshift(
            { kind: 'ensure_interphone' },
            { kind: 'interphone_response' },
          );
        }
        continue;
      }

      if (task.kind === 'interphone_response') {
        if (sessionHasType(next, 'interphone_response')) continue;
        next.planned.push({
          id: flowId(),
          type: 'interphone_response',
          details: {},
          recordSource: recordSourceFor(next, 'interphone_response'),
        });
        continue;
      }

      if (task.kind === 'ensure_face_contact') {
        if (!sessionHasType(next, 'face_to_face_contact')) {
          if (
            !task.historyChecked &&
            canAskHistorical(next, 'face_to_face_contact')
          ) {
            next.modal = stageTimingModal(
              next,
              'face_to_face_contact',
              {
                kind: 'ensure_face_contact',
                historyChecked: true,
              },
            );
            setFunnelFlow(next);
            return;
          }
          next.tasks.unshift(
            {
              kind: 'ensure_interphone_response',
              historyChecked: false,
            },
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
        } else if (
          !task.historyChecked &&
          canAskHistorical(next, 'face_to_face_contact')
        ) {
          next.modal = stageTimingModal(
              next,
              'face_to_face_contact',
              {
              ...task,
              historyChecked: true,
            },
            );
          setFunnelFlow(next);
          return;
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
        next.modal = {
          kind: 'appointment_target',
          appointments: visitableAppointmentsOf(next),
        };
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
        } else if (
          !task.historyChecked &&
          canAskHistorical(next, 'appointment_visit')
        ) {
          next.modal = stageTimingModal(
              next,
              'appointment_visit',
              {
              kind: 'presentation',
              historyChecked: true,
            },
            );
          setFunnelFlow(next);
          return;
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
        if (
          !task.historyChecked &&
          canAskHistorical(next, 'presentation')
        ) {
          next.modal = stageTimingModal(
              next,
              'presentation',
              {
              kind: 'prospect',
              historyChecked: true,
            },
            );
          setFunnelFlow(next);
          return;
        }
        next.tasks.unshift(
          { kind: 'presentation', historyChecked: true },
          { kind: 'prospect', historyChecked: true },
        );
        continue;
      }

      if (task.kind === 'sale') {
        if (sessionHasType(next, 'sale')) continue;
        if (sessionHasType(next, 'presentation')) {

          next.tasks.unshift({ kind: 'append_sale' });
        } else {
          next.modal = { kind: 'sale_entry' };
          setFunnelFlow(next);
          return;
        }
        continue;
      }

      if (task.kind === 'rejection') {
        next.modal = { kind: 'rejection_reason', type: task.type };
        setFunnelFlow(next);
        return;
      }

      next.planned.push({
        id: flowId(),
        type: 'sale',
        details: {
          saleEntryKind: task.entryKind,
          linkedAppointmentId: task.linkedAppointmentId,
          linkedAppointmentLabel: task.linkedAppointmentLabel,
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
    const storedActiveEvents = activeSessionId
      ? activities.filter((activity) => activity.sessionId === activeSessionId)
      : [];
    const latestActiveEvent = storedActiveEvents[storedActiveEvents.length - 1];
    const reusableActiveSessionId =
      activeSessionId &&
      latestActiveEvent &&
      localDateKey(latestActiveEvent.timestamp) === localDateKey(now)
        ? activeSessionId
        : undefined;
    const activeEvents = reusableActiveSessionId ? storedActiveEvents : [];

    if (type === 'interphone') {
      const lastPress = [...activeEvents]
        .reverse()
        .find((activity) => activity.type === 'interphone');
      const responded = activeEvents.some(
        (activity) => activity.type === 'interphone_response',
      );
      const awaitingResponse = Boolean(lastPress && !responded);
      return {
        selectedSessionId: sessionId(),
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
        reusableActiveSessionId && !alreadyReached && !terminal
          ? reusableActiveSessionId
          : sessionId(),
    };
  };

  const startFunnelFlow = (type: FunnelTarget) => {
    const now = Date.now();
    const selection = selectSessionForTarget(type, now);
    if (activeSessionId && selection.selectedSessionId !== activeSessionId) {
      setActiveSessionId(undefined);
    }
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

  const completePriorStageCapture = (
    prior: PriorDetailContext,
    details: PriorStageDetails,
  ) => {
    if (!funnelFlow) return;
    const updatedFlow: FunnelFlow = {
      ...funnelFlow,
      sessionOrigin: 'carryover',
      priorReachedThrough: laterStage(
        priorReachedThroughOf(funnelFlow),
        prior.stage,
      ) as HistoricalStage,
      priorStageDetails: {
        ...priorStageDetailsOf(funnelFlow),
        ...details,
      },
      modal: null,
    };
    const currentIndex = HISTORICAL_STAGE_ORDER.indexOf(prior.stage);
    const targetIndex = HISTORICAL_STAGE_ORDER.indexOf(
      prior.timing.targetStage,
    );
    if (currentIndex < targetIndex) {
      setFunnelFlow({
        ...updatedFlow,
        modal: {
          kind: 'stage_timing',
          stage: HISTORICAL_STAGE_ORDER[currentIndex + 1],
          timing: prior.timing,
        },
      });
      return;
    }
    advanceFunnelFlow({
      ...updatedFlow,
      tasks: [prior.timing.resumeTask, ...funnelFlow.tasks],
    });
  };

  const handleStageTimingSelect = (
    answer: '今日' | '今日より前',
  ) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'stage_timing') return;
    const { stage, timing } = funnelFlow.modal;
    if (answer === '今日') {
      const startIndex = HISTORICAL_STAGE_ORDER.indexOf(stage);
      const targetIndex = HISTORICAL_STAGE_ORDER.indexOf(timing.targetStage);
      const todayTasks = HISTORICAL_STAGE_ORDER
        .slice(startIndex, targetIndex + 1)
        .map(taskForHistoricalStage);
      advanceFunnelFlow({
        ...funnelFlow,
        tasks: [...todayTasks, timing.resumeTask, ...funnelFlow.tasks],
        modal: null,
      });
      return;
    }

    const prior: PriorDetailContext = { stage, timing };
    if (
      stage === 'interphone_response' ||
      stage === 'appointment_visit'
    ) {
      completePriorStageCapture(prior, {});
      return;
    }
    const modal: FlowModal =
      stage === 'interphone'
        ? { kind: 'customer_status', prior }
        : stage === 'face_to_face_contact'
          ? { kind: 'face_contact', prior }
          : stage === 'appointment'
            ? { kind: 'appointment_source', prior }
            : { kind: 'presentation_location', prior };
    setFunnelFlow({ ...funnelFlow, modal });
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
      type === 'sale' ||
      type === 'rejection_close' ||
      type === 'pre_presentation_rejection' ||
      type === 'post_presentation_rejection'
    ) {
      startFunnelFlow(type);
      return;
    }

    const gpsPromise = createGpsPromise();
    recordActivity(type, { operationId: flowId(), recordSource: 'manual' }, gpsPromise);
  };

  const handleCustomerStatusSelect = (customerStatus: CustomerStatus) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'customer_status') return;
    if (funnelFlow.modal.prior) {
      completePriorStageCapture(funnelFlow.modal.prior, { customerStatus });
      return;
    }
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

  const handleFaceContactSave = (ageGroup: AgeGroup) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'face_contact') return;
    if (funnelFlow.modal.prior) {
      completePriorStageCapture(funnelFlow.modal.prior, { ageGroup });
      return;
    }
    continueFunnelFlow([
      ...funnelFlow.planned,
      {
        id: flowId(),
        type: 'face_to_face_contact',
        details: { ageGroup },
        recordSource: recordSourceFor(funnelFlow, 'face_to_face_contact'),
      },
    ]);
  };

  const handleAppointmentSourceSelect = (
    acquisitionKind: AppointmentAcquisitionKind,
  ) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'appointment_source') return;
    if (funnelFlow.modal.prior) {
      completePriorStageCapture(funnelFlow.modal.prior, {
        appointmentAcquisitionKind: acquisitionKind,
      });
      return;
    }
    const { appointmentId, categoryOverride } = funnelFlow.modal;
    if (!appointmentId) return;
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
      tasks[0] = {
        ...tasks[0],
        appointmentLabel,
        visitKind: appointmentCategory,
      };
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

  const handleAppointmentTargetSelect = (appointment: Activity) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'appointment_target') return;
    const visitKind = appointmentCategoryOf(appointment);
    const targetSessionId = appointment.sessionId ?? funnelFlow.sessionId;
    const isPlannedAppointment = funnelFlow.planned.some(
      (planned) => planned.id === appointment.id,
    );
    advanceFunnelFlow({
      ...funnelFlow,
      sessionId: targetSessionId,
      planned: isPlannedAppointment ? funnelFlow.planned : [],
      tasks: [
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
    const hasUnlinkedPriorAppointment =
      reachedStageIndex(priorReachedThroughOf(funnelFlow)) >=
        reachedStageIndex('appointment') &&
      !latestSessionRecord(funnelFlow, 'appointment');
    if (hasUnlinkedPriorAppointment) {
      continueFunnelFlow(funnelFlow.planned, [
        {
          kind: 'append_appointment_visit',
        },
        ...funnelFlow.tasks,
      ]);
      return;
    }
    const appointmentId = flowId();
    continueFunnelFlow(funnelFlow.planned, [
      { kind: 'ensure_face_contact' },
      {
        kind: 'appointment',
        appointmentId,
      },
      {
        kind: 'append_appointment_visit',
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
    if (funnelFlow.modal.prior) {
      completePriorStageCapture(funnelFlow.modal.prior, {
        presentationLocation,
      });
      return;
    }
    if (!funnelFlow.modal.entryKind) return;
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
    if (saleEntryKind === 'アポリストからの成約') {
      const soldAppointmentIds = new Set(
        activities
          .filter((activity) => activity.type === 'sale')
          .map((activity) => activity.linkedAppointmentId)
          .filter((id): id is string => Boolean(id)),
      );
      setFunnelFlow({
        ...funnelFlow,
        modal: {
          kind: 'sale_appointment_target',
          appointments: appointments.filter(
            (appointment) =>
              !soldAppointmentIds.has(appointment.id) &&
              (!appointment.sessionId || !soldSessionIds.has(appointment.sessionId)),
          ),
        },
      });
      return;
    }
    if (saleEntryKind === '保留／見込からの成約') {
      setFunnelFlow({
        ...funnelFlow,
        modal: { kind: 'prospect_target', prospects },
      });
      return;
    }
    continueFunnelFlow(funnelFlow.planned, [
      { kind: 'presentation', historyChecked: true },
      { kind: 'append_sale', entryKind: saleEntryKind },
      ...funnelFlow.tasks,
    ]);
  };

  const handleSaleAppointmentTargetSelect = (appointment: Activity) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'sale_appointment_target') {
      return;
    }
    const sourceSessionClosed = Boolean(
      appointment.sessionId && terminalSessionIds.has(appointment.sessionId),
    );
    const targetSessionId = sourceSessionClosed
      ? sessionId()
      : appointment.sessionId ?? funnelFlow.sessionId;
    const appointmentLabel = appointmentDisplayLabel(appointment);
    advanceFunnelFlow({
      ...funnelFlow,
      sessionId: targetSessionId,
      sessionOrigin: sourceSessionClosed
        ? 'carryover'
        : funnelFlow.sessionOrigin,
      priorReachedThrough: sourceSessionClosed
        ? (laterStage(
            priorReachedThroughOf(funnelFlow),
            'appointment',
          ) as HistoricalStage)
        : funnelFlow.priorReachedThrough,
      planned: [],
      tasks: [
        {
          kind: 'append_appointment_visit',
          visitKind: appointmentCategoryOf(appointment),
          appointmentId: appointment.id,
          appointmentLabel,
        },
        { kind: 'presentation' },
        {
          kind: 'append_sale',
          entryKind: 'アポリストからの成約',
          linkedAppointmentId: appointment.id,
          linkedAppointmentLabel: appointmentLabel,
        },
        ...funnelFlow.tasks,
      ],
      modal: null,
    });
  };

  const handleProspectTargetSelect = (prospect: Activity) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'prospect_target') return;
    const sourceSessionClosed = Boolean(
      prospect.sessionId && terminalSessionIds.has(prospect.sessionId),
    );
    const targetSessionId = sourceSessionClosed
      ? sessionId()
      : prospect.sessionId ?? funnelFlow.sessionId;
    const label =
      prospect.prospectComment?.trim() ||
      '見込度 ' + (prospect.prospectRating ?? 0) + ' / 5';
    advanceFunnelFlow({
      ...funnelFlow,
      sessionId: targetSessionId,
      sessionOrigin: sourceSessionClosed
        ? 'carryover'
        : funnelFlow.sessionOrigin,
      priorReachedThrough: sourceSessionClosed
        ? (laterStage(
            priorReachedThroughOf(funnelFlow),
            'presentation',
          ) as HistoricalStage)
        : funnelFlow.priorReachedThrough,
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
      { kind: 'presentation', historyChecked: true },
      { kind: 'append_sale', entryKind: '新規プレゼン' },
      ...funnelFlow.tasks,
    ]);
  };
  const handleRejectionReasonSelect = (
    rejectionReason: RejectionReason,
    rejectionReasonDetail?: string,
  ) => {
    if (!funnelFlow || funnelFlow.modal?.kind !== 'rejection_reason') return;
    const rejectionType = funnelFlow.modal.type;
    continueFunnelFlow([
      ...funnelFlow.planned,
      {
        id: flowId(),
        type: rejectionType,
        details: { rejectionReason, rejectionReasonDetail },
        recordSource: recordSourceFor(funnelFlow, rejectionType),
      },
    ]);
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
    const endedAt = Date.now();
    setActiveSessionId(undefined);
    const finalizedTodayActivities = useCounterStore
      .getState()
      .activities.filter(
        (activity) =>
          activity.recordSource !== 'historical_confirmation' &&
          localDateKey(activity.timestamp) === reportDate,
      );
    saveDailyReport(reportDate, finalizedTodayActivities, endedAt);
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
              <DailyReportButton
                reportCount={hydrated ? dailyReports.length : 0}
                onTap={() => setActiveView('reports')}
              />
              <ActivityEndButton
                disabled={todaysActivities.length === 0}
                onTap={() => setShowActivityEnd(true)}
              />
            </div>
          </section>
        </div>
      ) : activeView === 'appointments' ? (
        <AppointmentList
          appointments={appointments}
          hydrated={hydrated}
          onReschedule={(id, details) => updateActivity(id, details)}
          onCancelAppointment={removeActivity}
        />
      ) : activeView === 'prospects' ? (
        <ProspectList
          prospects={prospects}
          hydrated={hydrated}
          onUpdate={(id, details) => updateActivity(id, details)}
          onDelete={removeActivity}
        />
      ) : (
        <DailyReportList reports={dailyReports} hydrated={hydrated} />
      )}

      {activeView === 'counter' && (
        <BottomBar
          disableUndo={total === 0}
          onUndo={undoLast}
          onReset={reset}
        />
      )}

      {funnelFlow?.modal?.kind === 'stage_timing' && (
        <ChoiceModal
          title="開始時点の確認"
          description={
            'この世帯で一番最初に「' +
            HISTORICAL_STAGE_LABELS[funnelFlow.modal.stage] +
            '」したのはいつですか？'
          }
          options={['今日', '今日より前'] as const}
          onSelect={handleStageTimingSelect}
          onCancel={cancelFunnelFlow}
        />
      )}

      {funnelFlow?.modal?.kind === 'customer_status' && (
        <CustomerStatusModal
          title={funnelFlow.modal.prior ? '顧客属性' : undefined}
          onSelect={handleCustomerStatusSelect}
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
          description={
            funnelFlow.modal.prior
              ? '初めてアポを取得した時の経路を選択してください'
              : '今回のアポ取得経路を選択してください'
          }
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

      {funnelFlow?.modal?.kind === 'appointment_target' && (
        <AppointmentTargetModal
          appointments={funnelFlow.modal.appointments}
          onSelect={handleAppointmentTargetSelect}
          onCreate={handleCreateAppointmentForVisit}
          fallbackLabel={
            reachedStageIndex(priorReachedThroughOf(funnelFlow)) >=
              reachedStageIndex('appointment') &&
            !latestSessionRecord(funnelFlow, 'appointment')
              ? 'リスト外の過去アポとして続ける'
              : '対象アポを登録して続ける'
          }
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

      {funnelFlow?.modal?.kind === 'sale_appointment_target' && (
        <AppointmentTargetModal
          appointments={funnelFlow.modal.appointments}
          title="成約したアポを選択"
          description="アポリストから今回の成約元を選んでください"
          onSelect={handleSaleAppointmentTargetSelect}
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

      {funnelFlow?.modal?.kind === 'rejection_reason' && (
        <RejectionReasonModal
          activityLabel={
            getActivityDef(funnelFlow.modal.type)?.label ?? ''
          }
          onSelect={handleRejectionReasonSelect}
          onCancel={cancelFunnelFlow}
        />
      )}
    </>
  );
}
