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

// Default demo sites in Jordan
const DEFAULT_SITES = [
    {
        siteId: 'DEMO-AMM-001',
        finalSiteName: 'Amman Downtown Tower',
        latitude: 31.9539,
        longitude: 35.9106,
        tssrOverallStatus: 'Approved',
        phaseName: 'Phase 1',
        partOf: 'Amman Region'
    },
    {
        siteId: 'DEMO-AMM-002',
        finalSiteName: 'Abdali Business Center',
        latitude: 31.9656,
        longitude: 35.9089,
        tssrOverallStatus: 'Submitted',
        phaseName: 'Phase 1',
        partOf: 'Amman Region'
    },
    {
        siteId: 'DEMO-ZRQ-001',
        finalSiteName: 'Zarqa Industrial Zone',
        latitude: 32.0728,
        longitude: 36.0880,
        tssrOverallStatus: 'Job Done',
        phaseName: 'Phase 2',
        partOf: 'Zarqa Region'
    },
    {
        siteId: 'DEMO-IRB-001',
        finalSiteName: 'Irbid University Area',
        latitude: 32.5568,
        longitude: 35.8469,
        tssrOverallStatus: 'Approved',
        phaseName: 'Phase 1',
        partOf: 'Irbid Region'
    },
    {
        siteId: 'DEMO-AQB-001',
        finalSiteName: 'Aqaba Port Tower',
        latitude: 29.5267,
        longitude: 35.0078,
        tssrOverallStatus: 'Rejected',
        phaseName: 'Phase 3',
        partOf: 'Aqaba Region'
    },
    {
        siteId: 'DEMO-KRK-001',
        finalSiteName: 'Karak Castle View',
        latitude: 31.1853,
        longitude: 35.7047,
        tssrOverallStatus: 'Submitted',
        phaseName: 'Phase 2',
        partOf: 'Karak Region'
    },
    {
        siteId: 'DEMO-MDB-001',
        finalSiteName: 'Madaba Heritage Site',
        latitude: 31.7167,
        longitude: 35.7936,
        tssrOverallStatus: 'Approved',
        phaseName: 'Phase 1',
        partOf: 'Madaba Region'
    },
    {
        siteId: 'DEMO-SLT-001',
        finalSiteName: 'Salt Old Town',
        latitude: 32.0392,
        longitude: 35.7272,
        tssrOverallStatus: 'Job Done',
        phaseName: 'Phase 2',
        partOf: 'Balqa Region'
    },
    {
        siteId: 'DEMO-JRS-001',
        finalSiteName: 'Jerash Ruins Area',
        latitude: 32.2747,
        longitude: 35.8914,
        tssrOverallStatus: 'Submitted',
        phaseName: 'Phase 3',
        partOf: 'Jerash Region'
    },
    {
        siteId: 'DEMO-MFQ-001',
        finalSiteName: 'Mafraq Border Zone',
        latitude: 32.3422,
        longitude: 36.2078,
        tssrOverallStatus: 'Rejected',
        phaseName: 'Phase 3',
        partOf: 'Mafraq Region'
    }
]

const SiteMap = ({ sites = [], onSiteClick, showDefaultSites = true }) => {

    // Normalize site data to handle both snake_case (from DB) and camelCase
    const normalizeSite = (s) => ({
        siteId: s.siteId || s.site_id,
        finalSiteName: s.finalSiteName || s.final_site_name,
        latitude: parseFloat(s.latitude) || 0,
        longitude: parseFloat(s.longitude) || 0,
        tssrOverallStatus: s.tssrOverallStatus || s.tssr_overall_status,
        phaseName: s.phaseName || s.phase_name,
        partOf: s.partOf || s.part_of,
        tssrSubcon: s.tssrSubcon || s.tssr_subcon,
        governorate: s.governorate
    })

    // Filter out invalid coordinates and merge with default sites if needed
    const validSites = useMemo(() => {
        if (!Array.isArray(sites)) return showDefaultSites ? DEFAULT_SITES : []

        const realSites = sites
            .map(normalizeSite)
            .filter(s => s.latitude && s.longitude && !isNaN(s.latitude) && !isNaN(s.longitude))

        // If no real sites with coordinates, show default demo sites
        if (realSites.length === 0 && showDefaultSites) {
            return DEFAULT_SITES
        }

        return realSites
    }, [sites, showDefaultSites])

    // Center map on Jordan (Amman approx) or average of sites
    const center = [31.95, 35.91] // Amman

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || ''
        if (s.includes('approved')) return '#8FD9D9' // Green
        if (s.includes('reject')) return '#ef4444' // Red
        if (s.includes('submit')) return '#FF8566' // Blue
        if (s.includes('job done')) return '#8FD9D9' // Purple
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
