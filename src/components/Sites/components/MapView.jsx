/**
 * MapView Component
 * Interactive map showing site locations with clustering
 */

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import './MapView.css'
import logoImage from '../../../assets/images/logo-new.png'

// Track map position changes to prevent auto-reset
const MapEventHandler = ({ onMapMove }) => {
  const map = useMapEvents({
    moveend: () => {
      if (onMapMove) {
        const center = map.getCenter()
        const zoom = map.getZoom()
        onMapMove([center.lat, center.lng], zoom)
      }
    },
    zoomend: () => {
      if (onMapMove) {
        const center = map.getCenter()
        const zoom = map.getZoom()
        onMapMove([center.lat, center.lng], zoom)
      }
    }
  })
  return null
}

// Map controls component
const MapControls = ({ 
  onResetView, 
  onToggleClustering, 
  clustering,
  onLayerChange,
  currentLayer,
  onThemeChange,
  currentTheme
}) => {
  return (
    <div className="map-controls">
      <button 
        className="map-control-btn"
        onClick={onResetView}
        title="Reset View"
      >
        🏠
      </button>

      <button
        className={`map-control-btn ${clustering ? 'map-control-btn--active' : ''}`}
        onClick={onToggleClustering}
        title="Toggle Clustering"
      >
        📍
      </button>

      <div className="map-layers">
        <div className="map-layers__title">Map Style</div>
        <button
          className={`map-layer-btn ${currentLayer === 'default' ? 'map-layer-btn--active' : ''}`}
          onClick={() => onLayerChange('default')}
        >
          Default
        </button>
        <button
          className={`map-layer-btn ${currentLayer === 'satellite' ? 'map-layer-btn--active' : ''}`}
          onClick={() => onLayerChange('satellite')}
        >
          Satellite
        </button>
      </div>

      <div className="map-themes">
        <div className="map-themes__title">Glass Theme</div>
        <button
          className={`map-theme-btn ${currentTheme === 'none' ? 'map-theme-btn--active' : ''}`}
          onClick={() => onThemeChange('none')}
          title="No Glass Effect"
        >
          None
        </button>
        <button
          className={`map-theme-btn map-theme-btn--turquoise ${currentTheme === 'turquoise' ? 'map-theme-btn--active' : ''}`}
          onClick={() => onThemeChange('turquoise')}
          title="Turquoise Glass"
        >
          Turquoise
        </button>
        <button
          className={`map-theme-btn map-theme-btn--orange ${currentTheme === 'orange' ? 'map-theme-btn--active' : ''}`}
          onClick={() => onThemeChange('orange')}
          title="Orange Glass"
        >
          Orange
        </button>
        <button
          className={`map-theme-btn map-theme-btn--cyber ${currentTheme === 'cyber' ? 'map-theme-btn--active' : ''}`}
          onClick={() => onThemeChange('cyber')}
          title="Cyber Neon (Dark)"
        >
          ⚡ Cyber
        </button>
      </div>
    </div>
  )
}

// Auto-fit bounds when sites change
const AutoFitBounds = ({ bounds }) => {
  const map = useMap()
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [bounds, map])

  return null
}

// Custom marker icon based on status - e-YAS Orange Theme
const createCustomIcon = (status, color, theme = 'turquoise') => {
  // For Cyber theme - glowing orange dots
  if (theme === 'cyber') {
    return L.divIcon({
      html: `
        <div class="cyber-marker">
          <div class="cyber-marker__glow"></div>
          <div class="cyber-marker__core"></div>
        </div>
      `,
      className: 'custom-marker-icon-cyber',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    })
  }
  
  // Default orange markers for other themes
  const orangeColor = '#FF8566' // Matte orange
  
  return L.divIcon({
    html: `
      <div style="
        background: ${orangeColor};
        width: 26px;
        height: 26px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 3px 12px rgba(255, 133, 102, 0.4);
      "></div>
    `,
    className: 'custom-marker-icon',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26]
  })
}

const MapView = ({
  sites = [],
  center = [31.9454, 35.9284],
  zoom = 8,
  clustering = true,
  selectedSiteId,
  onSiteClick,
  onResetView,
  onToggleClustering,
  onLayerChange,
  onMapMove, // NEW: track map movement
  getStatusColor,
  className = ''
}) => {
  // Glass theme state (none, turquoise, orange, cyber)
  const [glassTheme, setGlassTheme] = useState('turquoise')
  
  // Map style state (default, satellite, dark)
  const [mapStyle, setMapStyle] = useState('default')
  
  // Auto-switch to dark map when cyber theme is selected
  useEffect(() => {
    if (glassTheme === 'cyber') {
      setMapStyle('dark')
    } else if (mapStyle === 'dark' && glassTheme !== 'cyber') {
      setMapStyle('default')
    }
  }, [glassTheme])
  
  // Filter valid sites
  const validSites = sites.filter(site => 
    site.latitude && 
    site.longitude &&
    !isNaN(parseFloat(site.latitude)) &&
    !isNaN(parseFloat(site.longitude))
  )

  // Calculate bounds
  const bounds = validSites.length > 0 ? [
    [
      Math.min(...validSites.map(s => parseFloat(s.latitude))),
      Math.min(...validSites.map(s => parseFloat(s.longitude)))
    ],
    [
      Math.max(...validSites.map(s => parseFloat(s.latitude))),
      Math.max(...validSites.map(s => parseFloat(s.longitude)))
    ]
  ] : null

  return (
    <div className={`map-view map-view--${glassTheme} ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="map-view__container"
        zoomControl={true}
      >
        {/* Track map position changes */}
        <MapEventHandler onMapMove={onMapMove} />
        
        {/* Tile Layer - Dynamic based on map style */}
        {mapStyle === 'dark' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        )}
        {mapStyle === 'satellite' && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}
        {mapStyle === 'default' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {/* Auto-fit bounds */}
        {bounds && <AutoFitBounds bounds={bounds} />}

        {/* Map Controls */}
        <div className="map-controls-wrapper">
          <MapControls
            onResetView={onResetView}
            onToggleClustering={onToggleClustering}
            clustering={clustering}
            onLayerChange={onLayerChange}
            currentLayer="default"
            onThemeChange={setGlassTheme}
            currentTheme={glassTheme}
          />
        </div>

        {/* Markers */}
        {clustering ? (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {validSites.map((site) => {
              const color = getStatusColor(site.tssr_overall_status)
              const icon = createCustomIcon(site.tssr_overall_status, color, glassTheme)
              
              return (
                <Marker
                  key={site.site_id}
                  position={[parseFloat(site.latitude), parseFloat(site.longitude)]}
                  icon={icon}
                  eventHandlers={{
                    click: () => onSiteClick && onSiteClick(site)
                  }}
                >
                  {/* Hover Tooltip */}
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                    <div className="map-tooltip">
                      <div className="map-tooltip__row">
                        <strong>ID:</strong> {site.site_id}
                      </div>
                      <div className="map-tooltip__row">
                        <strong>Status:</strong> {site.tssr_overall_status || 'N/A'}
                      </div>
                      <div className="map-tooltip__row">
                        <strong>Priority:</strong> {site.priority || 'N/A'}
                      </div>
                      <div className="map-tooltip__row">
                        <strong>Cluster:</strong> {site.cluster || 'N/A'}
                      </div>
                    </div>
                  </Tooltip>
                  
                  {/* Click Popup */}
                  <Popup>
                    <div className="map-popup">
                      <h3 className="map-popup__title">{site.final_site_name}</h3>
                      <div className="map-popup__details">
                        <p><strong>ID:</strong> {site.site_id}</p>
                        <p><strong>Phase:</strong> {site.phase_name}</p>
                        <p><strong>Status:</strong> 
                          <span style={{ color }}> {site.tssr_overall_status}</span>
                        </p>
                        <p><strong>Governorate:</strong> {site.governorate}</p>
                        {site.tssr_subcon && (
                          <p><strong>Contractor:</strong> {site.tssr_subcon}</p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MarkerClusterGroup>
        ) : (
          <>
            {validSites.map((site) => {
              const color = getStatusColor(site.tssr_overall_status)
              const icon = createCustomIcon(site.tssr_overall_status, color, glassTheme)
              
              return (
                <Marker
                  key={site.site_id}
                  position={[parseFloat(site.latitude), parseFloat(site.longitude)]}
                  icon={icon}
                  eventHandlers={{
                    click: () => onSiteClick && onSiteClick(site)
                  }}
                >
                  {/* Hover Tooltip */}
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                    <div className="map-tooltip">
                      <div className="map-tooltip__row">
                        <strong>ID:</strong> {site.site_id}
                      </div>
                      <div className="map-tooltip__row">
                        <strong>Status:</strong> {site.tssr_overall_status || 'N/A'}
                      </div>
                      <div className="map-tooltip__row">
                        <strong>Priority:</strong> {site.priority || 'N/A'}
                      </div>
                      <div className="map-tooltip__row">
                        <strong>Cluster:</strong> {site.cluster || 'N/A'}
                      </div>
                    </div>
                  </Tooltip>
                  
                  {/* Click Popup */}
                  <Popup>
                    <div className="map-popup">
                      <h3 className="map-popup__title">{site.final_site_name}</h3>
                      <div className="map-popup__details">
                        <p><strong>ID:</strong> {site.site_id}</p>
                        <p><strong>Phase:</strong> {site.phase_name}</p>
                        <p><strong>Status:</strong> 
                          <span style={{ color }}> {site.tssr_overall_status}</span>
                        </p>
                        <p><strong>Governorate:</strong> {site.governorate}</p>
                        {site.tssr_subcon && (
                          <p><strong>Contractor:</strong> {site.tssr_subcon}</p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </>
        )}
      </MapContainer>

      {/* Stats Overlay */}
      <div className="map-stats">
        <div className="map-stat">
          <span className="map-stat__value">{validSites.length}</span>
          <span className="map-stat__label">Sites</span>
        </div>
      </div>
      
      {/* e-YAS Branding - Bottom Right */}
      <div className="map-branding">
        <img src={logoImage} alt="YAS Logo" className="map-branding__logo" />
        <span className="map-branding__tagline">Powered by YAS for AI & Automation Services</span>
      </div>
    </div>
  )
}

export default MapView
