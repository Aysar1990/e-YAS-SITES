# Map Integration Guide - Complete Implementation

## 📦 Step 1: Install Packages

```bash
cd "C:\Users\aysar\Downloads\New folder (3)\New folder (3)\TSSR Monitor\tssr-app"
npm install leaflet react-leaflet react-leaflet-cluster --legacy-peer-deps
```

## 🎨 Step 2: Import Leaflet CSS

Add to `src/index.css` or at the top of `Sites.css`:

```css
/* Leaflet CSS */
@import "~leaflet/dist/leaflet.css";
```

## 🔧 Step 3: Fix Leaflet Icons

Create `src/utils/leafletFix.js`:

```javascript
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

export default L
```

Then import in `Sites.jsx`:

```javascript
import '../utils/leafletFix' // Add at top of imports
```

## 🗺️ Step 4: Update Sites.jsx

### 4.1 Add Imports

```javascript
import {
  useSitesData,
  useSitesFilters,
  usePagination,
  useAdvancedSearch,
  useBatchOperations,
  useMapView, // NEW
  // ... rest of imports
  MapView // NEW
} from '../../components/Sites'
```

### 4.2 Add Map Hook

After other hooks:

```javascript
// Map View hook
const {
  center,
  zoom,
  clustering,
  selectedMarker,
  validSites,
  setClustering,
  focusSite,
  resetView,
  getStatusColor
} = useMapView(searchFilteredSites)
```

### 4.3 Update View Mode State

Change viewMode to support 'map':

```javascript
const [viewMode, setViewMode] = useState('cards') // 'cards', 'table', 'map'
```

### 4.4 Update SitesToolbar

Add 'map' option to viewMode:

```javascript
<SitesToolbar
  // ... existing props
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  // ... rest of props
/>
```

**Update SitesToolbar.jsx** to support map view:

```javascript
// In SitesToolbar.jsx, add third button
<button
  className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
  onClick={() => onViewModeChange('map')}
  title="Map View"
>
  🗺️
</button>
```

### 4.5 Add Map View to Render

After table view section, add:

```javascript
) : viewMode === 'map' ? (
  <>
    {/* Map View */}
    <MapView
      sites={paginatedSites}
      center={center}
      zoom={zoom}
      clustering={clustering}
      selectedSiteId={selectedMarker}
      onSiteClick={(site) => {
        focusSite(site)
        if (canEdit && useFirebase && firebaseConnected) {
          handleEditSite(site, { stopPropagation: () => {} })
        }
      }}
      onResetView={resetView}
      onToggleClustering={() => setClustering(!clustering)}
      onLayerChange={(layer) => console.log('Layer:', layer)}
      getStatusColor={getStatusColor}
      className="sites-map-view"
    />
    
    {/* Pagination for Map */}
    <Pagination
      paginationInfo={paginationInfo}
      itemsPerPage={itemsPerPage}
      itemsPerPageOptions={itemsPerPageOptions}
      onPageChange={goToPage}
      onItemsPerPageChange={changeItemsPerPage}
      onFirstPage={goToFirstPage}
      onLastPage={goToLastPage}
      onNextPage={goToNextPage}
      onPreviousPage={goToPreviousPage}
    />
  </>
) : null}
```

## 🎯 Step 5: Test the Map

1. Start the app:
```bash
npm run dev
```

2. Go to Sites page
3. Click Map View button (🗺️)
4. You should see:
   - Interactive map centered on Jordan
   - Colored markers for each site
   - Clustering enabled (groups nearby markers)
   - Click markers to see site details
   - Click site to edit (if Firebase enabled)

## ✨ Features Included

✅ **Interactive Map** - Pan, zoom, explore
✅ **Site Markers** - Color-coded by status:
  - 🟢 Green: Approved
  - 🔴 Red: Rejected  
  - 🟡 Yellow: Pending/Review
  - 🔵 Blue: Validation
  - ⚫ Gray: Unknown

✅ **Clustering** - Groups nearby sites for performance
✅ **Popups** - Click markers to see full site details
✅ **Auto-fit** - Map automatically fits all sites
✅ **Reset View** - Return to Jordan center
✅ **Toggle Clustering** - Enable/disable grouping
✅ **Stats Overlay** - Shows total sites on map
✅ **Responsive** - Works on mobile

## 🎨 Customization

### Change Default Center/Zoom

```javascript
const {
  center,
  zoom,
  // ...
} = useMapView(searchFilteredSites)

// Then set custom values
setCenter([yourLat, yourLng])
setZoom(yourZoom)
```

### Add Custom Layers

In `MapView.jsx`, add satellite/terrain layers:

```javascript
{mapLayer === 'satellite' ? (
  <TileLayer
    url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
  />
) : (
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
)}
```

### Custom Marker Colors

Edit `getStatusColor()` in useMapView.js:

```javascript
const getStatusColor = useCallback((status) => {
  // Add your custom logic
  if (status.includes('myStatus')) return '#yourColor'
  // ...
}, [])
```

## 🐛 Troubleshooting

### Markers not showing?
- Check if sites have valid `latitude` and `longitude` fields
- Verify coordinates are numbers, not strings
- Check console for errors

### Map not centering?
- Ensure at least one site has valid coordinates
- Check `validSites` length in console

### Clustering not working?
- Verify `react-leaflet-cluster` installed correctly
- Check if clustering toggle is enabled

## 📊 Performance

- **Clustering**: Handles 1000+ markers smoothly
- **Lazy Loading**: Only renders visible map area
- **Pagination**: Limits sites per page (default: 50)
- **Optimized**: Custom markers use CSS, not images

## 🎉 Done!

Your map integration is complete! Users can now:
- View all sites geographically
- Click to see details
- Cluster for performance
- Filter and search as before

---

**Next Steps:**
- Test with real data
- Customize colors/icons
- Add more layers (satellite, terrain)
- Export map as image (future feature)
