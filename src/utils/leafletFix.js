/**
 * Leaflet Icon Fix for Vite
 * 
 * Fixes the default marker icon issue in Vite builds.
 * This uses a simpler approach that works with Vite's asset handling.
 */

import L from 'leaflet';

// Delete the broken icon URL
delete L.Icon.Default.prototype._getIconUrl;

// Use Leaflet's default icons from CDN
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
