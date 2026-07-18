'use client';

import { useEffect, useState } from 'react';
import { ActivityButton } from '@/components/ActivityButton';
import { AgeGroupModal } from '@/components/AgeGroupModal';
import { CustomerStatusModal } from '@/components/CustomerStatusModal';
import { PresentationLocationModal } from '@/components/PresentationLocationModal';
import { RejectionReasonModal } from '@/components/RejectionReasonModal';
import { BottomBar } from '@/components/BottomBar';
import { Header } from '@/components/Header';
import { ACTIVITIES, getActivityDef } from '@/lib/constants';
import { useCounterStore } from '@/store/useCounterStore';
import type {
  ActivityType,
  AgeGroup,
  CustomerStatus,
  PresentationLocation,
  RejectionReason,
} from '@/types';

export default function HomePage() {
  // SSR ハイドレーション対策: localStorage を安全に読むため、初回は
  // 静的なゼロ値でレンダリング → mount 後に本物の store を反映。
  const [hydrated, setHydrated] = useState(false);
  const [pendingContactType, setPendingContactType] =
    useState<ActivityType | null>(null);
  const [showInterphoneStatus, setShowInterphoneStatus] = useState(false);
  const [showPresentationLocation, setShowPresentationLocation] = useState(false);
  const [pendingRejectionType, setPendingRejectionType] =
    useState<ActivityType | null>(null);
  useEffect(() => setHydrated(true), []);

  const activities = useCounterStore((s) => s.activities);
  const add = useCounterStore((s) => s.add);
  const undoLast = useCounterStore((s) => s.undoLast);
  const reset = useCounterStore((s) => s.reset);

  const countOf = (type: string) =>
    hydrated ? activities.filter((a) => a.type === type).length : 0;
  const total = hydrated ? activities.length : 0;

  const handleTap = (type: ActivityType) => {
    if (type === 'interphone') {
      setShowInterphoneStatus(true);
      return;
    }
    if (type === 'first_contact' || type === 'revisit') {
      setPendingContactType(type);
      return;
    }
    if (
      type === 'rejection_close' ||
      type === 'pre_presentation_rejection' ||
      type === 'post_presentation_rejection'
    ) {
      setPendingRejectionType(type);
      return;
    }
    if (type === 'presentation') {
      setShowPresentationLocation(true);
      return;
    }
    add(type);
  };

  const handleAgeSelect = (ageGroup: AgeGroup) => {
    if (!pendingContactType) return;
    add(pendingContactType, { ageGroup });
    setPendingContactType(null);
  };

  const handleCustomerStatusSelect = (customerStatus: CustomerStatus) => {
    add('interphone', { customerStatus });
    setShowInterphoneStatus(false);
  };

  const handlePresentationLocationSelect = (
    presentationLocation: PresentationLocation,
  ) => {
    add('presentation', { presentationLocation });
    setShowPresentationLocation(false);
  };

  const handleRejectionReasonSelect = (
    rejectionReason: RejectionReason,
    rejectionReasonDetail?: string,
  ) => {
    if (!pendingRejectionType) return;
    add(pendingRejectionType, { rejectionReason, rejectionReasonDetail });
    setPendingRejectionType(null);
  };
  return (
    <>
      <Header totalCount={total} />

      <div className="flex-1 content-start px-2 grid grid-cols-3 gap-2">
        {ACTIVITIES.map((def) => (
          <ActivityButton
            key={def.type}
            def={def}
            count={countOf(def.type)}
            onTap={() => handleTap(def.type)}
          />
        ))}
      </div>

      <BottomBar
        disableUndo={total === 0}
        onUndo={undoLast}
        onReset={reset}
      />

      {pendingContactType && (
        <AgeGroupModal
          contactLabel={getActivityDef(pendingContactType)?.label ?? ''}
          onSelect={handleAgeSelect}
          onCancel={() => setPendingContactType(null)}
        />
      )}

      {showInterphoneStatus && (
        <CustomerStatusModal
          onSelect={handleCustomerStatusSelect}
          onCancel={() => setShowInterphoneStatus(false)}
        />
      )}

      {showPresentationLocation && (
        <PresentationLocationModal
          onSelect={handlePresentationLocationSelect}
          onCancel={() => setShowPresentationLocation(false)}
        />
      )}

      {pendingRejectionType && (
        <RejectionReasonModal
          activityLabel={getActivityDef(pendingRejectionType)?.label ?? ''}
          onSelect={handleRejectionReasonSelect}
          onCancel={() => setPendingRejectionType(null)}
        />
      )}
    </>
  );
}
