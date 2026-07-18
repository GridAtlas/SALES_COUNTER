'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityButton } from '@/components/ActivityButton';
import { AgeGroupModal } from '@/components/AgeGroupModal';
import { AppointmentList } from '@/components/AppointmentList';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CustomerStatusModal } from '@/components/CustomerStatusModal';
import { PresentationLocationModal } from '@/components/PresentationLocationModal';
import { RejectionReasonModal } from '@/components/RejectionReasonModal';
import { ViewTabs, type HomeView } from '@/components/ViewTabs';
import { BottomBar } from '@/components/BottomBar';
import { Header } from '@/components/Header';
import { ACTIVITIES, getActivityDef } from '@/lib/constants';
import { requestCurrentGps } from '@/lib/geolocation';
import { useCounterStore } from '@/store/useCounterStore';
import type {
  Activity,
  ActivityDetails,
  ActivityType,
  AgeGroup,
  AppointmentDetails,
  CustomerStatus,
  GpsDetails,
  PresentationLocation,
  RejectionReason,
} from '@/types';

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
  const [showAppointment, setShowAppointment] = useState(false);
  const [showPresentationLocation, setShowPresentationLocation] = useState(false);
  const [pendingRejectionType, setPendingRejectionType] =
    useState<ActivityType | null>(null);
  const pendingGpsRef = useRef<Promise<GpsDetails> | null>(null);

  useEffect(() => setHydrated(true), []);

  const activities = useCounterStore((state) => state.activities);
  const add = useCounterStore((state) => state.add);
  const updateActivity = useCounterStore((state) => state.updateActivity);
  const undoLast = useCounterStore((state) => state.undoLast);
  const reset = useCounterStore((state) => state.reset);

  const countOf = (type: string) =>
    hydrated ? activities.filter((activity) => activity.type === type).length : 0;
  const total = hydrated ? activities.length : 0;

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

  const handleAppointmentSave = (details: AppointmentDetails) => {
    recordPendingActivity('appointment', details);
    setShowAppointment(false);
    setActiveView('appointments');
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

  return (
    <>
      <Header totalCount={total} />
      <ViewTabs
        activeView={activeView}
        onChange={setActiveView}
        appointmentCount={appointments.length}
      />

      {activeView === 'counter' ? (
        <div className="grid flex-1 content-start grid-cols-3 gap-2 px-2">
          {ACTIVITIES.map((def) => (
            <ActivityButton
              key={def.type}
              def={def}
              count={countOf(def.type)}
              onTap={() => handleTap(def.type)}
            />
          ))}
        </div>
      ) : (
        <AppointmentList appointments={appointments} hydrated={hydrated} />
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

      {showAppointment && (
        <AppointmentModal
          onSave={handleAppointmentSave}
          onCancel={() => {
            cancelPendingGps();
            setShowAppointment(false);
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
