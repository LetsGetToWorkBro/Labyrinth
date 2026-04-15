/**
 * geo.ts — Geo-lock utilities for check-in validation
 *
 * Haversine distance calculation and geo-fence check
 * against admin-configured gym coordinates stored in localStorage.
 */

export function haversineYards(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const meters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return meters * 1.09361; // convert meters to yards
}

export async function validateGeoIfRequired(): Promise<{ allowed: boolean; error?: string }> {
  try {
    const config = JSON.parse(localStorage.getItem('lbjj_geo_config') || '{}');
    if (!config.enabled) return { allowed: true }; // geo-lock disabled

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ allowed: false, error: 'Location services not available on this device.' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dist = haversineYards(pos.coords.latitude, pos.coords.longitude, config.lat, config.lng);
          if (dist <= config.radiusYards) {
            resolve({ allowed: true });
          } else {
            resolve({ allowed: false, error: `You must be at the gym to check in. You are ${Math.round(dist)} yards away.` });
          }
        },
        (err) => {
          if (err.code === 1) { // PERMISSION_DENIED
            resolve({ allowed: false, error: 'Location permission denied. Enable location to check in.' });
          } else {
            resolve({ allowed: false, error: 'Could not verify location. Try again.' });
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    });
  } catch {
    return { allowed: true }; // fail open if config corrupted
  }
}
