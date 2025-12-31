import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Card } from '../UI'
import './SiteMap.css'

// Fix for default marker icon issues in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const SiteMap = ({ sites, onSiteClick }) => {

    // Filter out invalid coordinates
    const validSites = useMemo(() => {
        return sites.filter(s => s.latitude && s.longitude && !isNaN(s.latitude) && !isNaN(s.longitude))
    }, [sites])

    // Center map on Jordan (Amman approx) or average of sites
    const center = [31.95, 35.91] // Amman

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || ''
        if (s.includes('approved')) return '#10b981' // Green
        if (s.includes('reject')) return '#ef4444' // Red
        if (s.includes('submit')) return '#3b82f6' // Blue
        if (s.includes('job done')) return '#a855f7' // Purple
        return '#64748b' // Gray
    }

    return (
        <Card className="map-card-container">
            <div className="map-header">
                <h3>Site Geolocation ({validSites.length} mapped)</h3>
                <div className="map-legend">
                    <span className="legend-item"><span className="dot approved"></span> Approved</span>
                    <span className="legend-item"><span className="dot submitted"></span> Submitted</span>
                    <span className="legend-item"><span className="dot rejected"></span> Rejected</span>
                </div>
            </div>
            <div className="leaflet-map-wrapper">
                <MapContainer center={center} zoom={8} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    {/* Dark Matter Tiles for Futuristic Look */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    {validSites.map((site, index) => {
                        const color = getStatusColor(site.tssrOverallStatus)
                        const customIcon = L.divIcon({
                            className: 'custom-site-marker',
                            html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                            iconSize: [16, 16],
                            iconAnchor: [8, 8]
                        })

                        // Use composite key to handle same site in multiple phases
                        const uniqueKey = `${site.siteId}-${site.phaseName || 'phases'}-${index}`

                        return (
                            <Marker
                                key={uniqueKey}
                                position={[site.latitude, site.longitude]}
                                icon={customIcon}
                                eventHandlers={{
                                    click: () => onSiteClick && onSiteClick(site)
                                }}
                            >
                                <Popup className="site-popup" style={{ '--status-color': color }}>
                                    <div className="popup-card-content" style={{ borderLeft: `4px solid ${color}` }}>
                                        <h4 style={{ color: color }}>{site.siteId}</h4>
                                        <div className="popup-row">
                                            <strong>Status:</strong>
                                            <span className="status-badge" style={{ backgroundColor: `${color}20`, color: color }}>
                                                {site.tssrOverallStatus}
                                            </span>
                                        </div>
                                        <p><strong>Name:</strong> {site.finalSiteName}</p>
                                        <p><strong>Phase:</strong> {site.phaseName}</p>
                                        {site.partOf && <p><strong>Part Of:</strong> {site.partOf}</p>}
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}
                </MapContainer>
            </div>
        </Card>
    )
}

export default SiteMap
