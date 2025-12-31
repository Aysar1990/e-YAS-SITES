/**
 * useMapView Hook
 * Manages map state, clustering, and site visualization
 */

import { useState, useMemo, useCallback, useRef } from 'react'

export const useMapView = (sites) => {
  const [center, setCenter] = useState([31.9454, 35.9284]) // Jordan center
  const [zoom, setZoom] = useState(8)
  const [clustering, setClustering] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [mapLayer, setMapLayer] = useState('default') // default, satellite, terrain
  
  // Store current map position to prevent auto-reset
  const currentMapPosition = useRef({ center: [31.9454, 35.9284], zoom: 8 })

  // Update stored position when map moves
  const updateMapPosition = useCallback((newCenter, newZoom) => {
    currentMapPosition.current = { center: newCenter, zoom: newZoom }
  }, [])

  // Filter sites with valid coordinates
  const validSites = useMemo(() => {
    return sites.filter(site => 
      site.latitude && 
      site.longitude &&
      !isNaN(parseFloat(site.latitude)) &&
      !isNaN(parseFloat(site.longitude))
    )
  }, [sites])

  // Group sites by status for color coding
  const sitesByStatus = useMemo(() => {
    const groups = {}
    validSites.forEach(site => {
      const status = site.tssr_overall_status || 'Unknown'
      if (!groups[status]) {
        groups[status] = []
      }
      groups[status].push(site)
    })
    return groups
  }, [validSites])

  // Calculate map bounds from sites
  const mapBounds = useMemo(() => {
    if (validSites.length === 0) return null

    const lats = validSites.map(s => parseFloat(s.latitude))
    const lngs = validSites.map(s => parseFloat(s.longitude))

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }
  }, [validSites])

  // Fit map to show all sites
  const fitBounds = useCallback(() => {
    if (!mapBounds) return null
    
    return [
      [mapBounds.south, mapBounds.west],
      [mapBounds.north, mapBounds.east]
    ]
  }, [mapBounds])

  // Focus on specific site
  const focusSite = useCallback((site) => {
    if (site.latitude && site.longitude) {
      const newCenter = [parseFloat(site.latitude), parseFloat(site.longitude)]
      const newZoom = 15
      setCenter(newCenter)
      setZoom(newZoom)
      setSelectedMarker(site.site_id)
      // Save position to prevent auto-reset
      currentMapPosition.current = { center: newCenter, zoom: newZoom }
    }
  }, [])

  // Reset map view
  const resetView = useCallback(() => {
    setCenter([31.9454, 35.9284])
    setZoom(8)
    setSelectedMarker(null)
  }, [])

  // Get status color
  const getStatusColor = useCallback((status) => {
    const statusLower = String(status || '').toLowerCase()
    
    if (statusLower.includes('approved')) return '#22c55e'
    if (statusLower.includes('rejected')) return '#ef4444'
    if (statusLower.includes('pending') || statusLower.includes('review')) return '#eab308'
    if (statusLower.includes('validation')) return '#3b82f6'
    return '#64748b'
  }, [])

  return {
    // State
    center,
    zoom,
    clustering,
    selectedMarker,
    mapLayer,
    validSites,
    sitesByStatus,
    mapBounds,

    // Setters
    setCenter,
    setZoom,
    setClustering,
    setSelectedMarker,
    setMapLayer,

    // Methods
    fitBounds,
    focusSite,
    resetView,
    getStatusColor,
    updateMapPosition
  }
}

export default useMapView
