# Map Integration Installation

## Step 1: Install Dependencies

```bash
npm install leaflet react-leaflet leaflet.markercluster --legacy-peer-deps
```

## What's included:
- **leaflet**: Core mapping library
- **react-leaflet**: React components for Leaflet
- **leaflet.markercluster**: Marker clustering for performance

## Step 2: Import CSS

Add to `src/index.css` or `Sites.css`:

```css
@import "leaflet/dist/leaflet.css";
@import "leaflet.markercluster/dist/MarkerCluster.css";
@import "leaflet.markercluster/dist/MarkerCluster.Default.css";
```

## Step 3: Fix Leaflet Icon Issue

Create `src/utils/leafletFix.js`:

```javascript
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow
})
```

## Done! Ready for Map Components 🗺️
