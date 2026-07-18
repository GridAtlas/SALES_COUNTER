import type { GpsDetails, GpsStatus } from '@/types';

const errorStatus = (error: GeolocationPositionError): GpsStatus => {
  if (error.code === error.PERMISSION_DENIED) return 'denied';
  if (error.code === error.POSITION_UNAVAILABLE) return 'unavailable';
  if (error.code === error.TIMEOUT) return 'timeout';
  return 'error';
};

/** 活動ボタン押下時の現在地取得。失敗時も状態を返して内部記録する。 */
export const requestCurrentGps = (): Promise<GpsDetails> =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ gpsStatus: 'unavailable' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          gpsStatus: 'captured',
          gpsLatitude: position.coords.latitude,
          gpsLongitude: position.coords.longitude,
          gpsAccuracy: position.coords.accuracy,
          gpsCapturedAt: Date.now(),
        });
      },
      (error) => resolve({ gpsStatus: errorStatus(error) }),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
