import React, { useState } from 'react'
import { MainLayout } from '../../../components/Layout'
import SiteMap from '../../../components/Map/SiteMap'
import { useData } from '../../../context/DataContext'
import { useTranslation } from 'react-i18next'
import './MapPage.css'

const MapPage = () => {
    const { sites, loading, activePhase, setActivePhase, phases } = useData()
    const { t } = useTranslation()

    // Filter sites locally if needed, or rely on activePhase from context
    // The context 'sites' are already filtered by the API based on activePhase usually, 
    // depending on implementation. In DataContext.jsx, fetchData uses activePhase.

    return (
        <MainLayout>
            <div className="map-page-container">
                <div className="map-page-header">
                    <div>
                        <h1 className="page-title">{t('common.map') || 'Interactive Map'}</h1>
                        <p className="page-subtitle">Geographic distribution of sites and rollout status</p>
                    </div>

                    <div className="map-actions">
                        {/* Re-use Phase Selector logic or component */}
                        <select
                            value={activePhase}
                            onChange={(e) => setActivePhase(e.target.value)}
                            className="phase-select"
                        >
                            <option value="ALL">All Phases</option>
                            {phases.map((phase) => (
                                <option key={phase.phase_name} value={phase.phase_name}>
                                    {phase.phase_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="map-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading Map Data...</p>
                        </div>
                    ) : (
                        <SiteMap sites={sites} />
                    )}
                </div>
            </div>
        </MainLayout>
    )
}

export default MapPage
