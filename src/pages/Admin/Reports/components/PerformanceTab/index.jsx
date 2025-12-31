/**
 * PerformanceTab - Enhanced with Accordion Layout
 * 
 * Features:
 * - Accordion tables (click to expand/collapse)
 * - Today stats with color coding
 * - Full report export
 * - Period filtering
 */

import React, { useState } from 'react'
import PeriodSelector from './PeriodSelector'
import TodayStatsCard from './TodayStatsCard'
import OverallProgressCard from './OverallProgressCard'
import SubcontractorTable from './SubcontractorTable'
import NokiaTable from './NokiaTable'
import ZainTable from './ZainTable'
import DrillDownModal from './DrillDownModal'
import { usePerformanceData } from '../../hooks/usePerformanceData'
import { exportPerformanceReport } from '../../utils/performanceExport'
import './PerformanceTab.css'

const PerformanceTab = ({ sites, activePhase }) => {
    // State
    const [period, setPeriod] = useState('all')
    const [customRange, setCustomRange] = useState({ start: null, end: null })
    const [drillDown, setDrillDown] = useState({ open: false, title: '', sites: [] })
    const [exporting, setExporting] = useState(false)
    
    // Accordion state - which sections are open
    const [expandedSections, setExpandedSections] = useState({
        subcontractor: true,
        nokia: false,
        zain: false
    })

    // Get performance data
    const { loading, stats } = usePerformanceData(sites, period, customRange)

    // Toggle accordion section
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    // Expand all sections
    const expandAll = () => {
        setExpandedSections({
            subcontractor: true,
            nokia: true,
            zain: true
        })
    }

    // Collapse all sections
    const collapseAll = () => {
        setExpandedSections({
            subcontractor: false,
            nokia: false,
            zain: false
        })
    }

    // Handle custom date range
    const handleCustomRange = (start, end) => {
        setCustomRange({ start, end })
        setPeriod('custom')
    }

    // Handle drill-down click
    const handleDrillDown = (category, metric, filteredSites) => {
        setDrillDown({
            open: true,
            title: `${category} - ${metric}`,
            sites: filteredSites || []
        })
    }

    // Close drill-down modal
    const handleCloseModal = () => {
        setDrillDown(prev => ({ ...prev, open: false }))
    }

    // Export full report
    const handleExport = async () => {
        if (!stats) return
        setExporting(true)
        try {
            await exportPerformanceReport(stats, `Performance_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
        } catch (error) {
            console.error('Export failed:', error)
            alert('Export failed: ' + error.message)
        }
        setExporting(false)
    }

    // Loading state
    if (loading || !stats) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Calculating performance metrics...</p>
            </div>
        )
    }

    return (
        <div className="performance-tab fade-in">
            {/* Header */}
            <div className="performance-header">
                <h2 className="section-title" style={{ margin: 0 }}>
                    📊 Performance Report
                    {activePhase && activePhase !== 'ALL' && (
                        <span className="phase-badge">{activePhase}</span>
                    )}
                </h2>
                <div className="performance-actions">
                    <PeriodSelector
                        value={period}
                        onChange={setPeriod}
                        onCustomRange={handleCustomRange}
                        customRange={customRange}
                    />
                    <button 
                        className="btn btn--primary export-btn"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        {exporting ? '⏳ Exporting...' : '📥 Export Report'}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="performance-summary">
                <TodayStatsCard stats={stats.today} />
                <OverallProgressCard
                    total={stats.summary.total}
                    approved={stats.summary.approved}
                    inProgress={stats.summary.inProgress}
                    notStarted={stats.summary.notStarted}
                />
            </div>

            {/* Accordion Controls */}
            <div className="accordion-controls">
                <button className="accordion-control-btn" onClick={expandAll}>
                    ▼ Expand All
                </button>
                <button className="accordion-control-btn" onClick={collapseAll}>
                    ▲ Collapse All
                </button>
            </div>

            {/* Accordion Tables */}
            <div className="performance-accordion">
                {/* Subcontractor Section */}
                <div className={`accordion-section ${expandedSections.subcontractor ? 'expanded' : ''}`}>
                    <div 
                        className="accordion-header"
                        onClick={() => toggleSection('subcontractor')}
                    >
                        <div className="accordion-title">
                            <span className="accordion-icon">
                                {expandedSections.subcontractor ? '▼' : '▶'}
                            </span>
                            <span className="accordion-emoji">🏗️</span>
                            <span>Subcontractor Performance</span>
                            <span className="accordion-count">
                                ({stats.subcontractors?.length || 0} contractors)
                            </span>
                        </div>
                        <div className="accordion-summary">
                            {!expandedSections.subcontractor && (
                                <>
                                    <span className="summary-stat">
                                        Surveyed: {stats.subcontractors?.reduce((sum, s) => sum + s.surveyed, 0) || 0}
                                    </span>
                                    <span className="summary-stat">
                                        Submitted: {stats.subcontractors?.reduce((sum, s) => sum + s.submitted, 0) || 0}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    {expandedSections.subcontractor && (
                        <div className="accordion-content">
                            <SubcontractorTable
                                data={stats.subcontractors || []}
                                onDrillDown={handleDrillDown}
                            />
                        </div>
                    )}
                </div>

                {/* Nokia Section */}
                <div className={`accordion-section ${expandedSections.nokia ? 'expanded' : ''}`}>
                    <div 
                        className="accordion-header"
                        onClick={() => toggleSection('nokia')}
                    >
                        <div className="accordion-title">
                            <span className="accordion-icon">
                                {expandedSections.nokia ? '▼' : '▶'}
                            </span>
                            <span className="accordion-emoji">📡</span>
                            <span>Nokia Performance</span>
                            <span className="accordion-count">(GSD, NPO, ROM)</span>
                        </div>
                        <div className="accordion-summary">
                            {!expandedSections.nokia && stats.nokia && (
                                <>
                                    <span className="summary-stat">
                                        GSD: {stats.nokia.gsd?.approved || 0}/{stats.nokia.gsd?.received || 0}
                                    </span>
                                    <span className="summary-stat">
                                        NPO: {stats.nokia.npo?.approved || 0}/{stats.nokia.npo?.received || 0}
                                    </span>
                                    <span className="summary-stat">
                                        ROM: {stats.nokia.rom?.approved || 0}/{stats.nokia.rom?.received || 0}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    {expandedSections.nokia && (
                        <div className="accordion-content">
                            <NokiaTable
                                data={stats.nokia}
                                onDrillDown={handleDrillDown}
                            />
                        </div>
                    )}
                </div>

                {/* Zain Section */}
                <div className={`accordion-section ${expandedSections.zain ? 'expanded' : ''}`}>
                    <div 
                        className="accordion-header"
                        onClick={() => toggleSection('zain')}
                    >
                        <div className="accordion-title">
                            <span className="accordion-icon">
                                {expandedSections.zain ? '▼' : '▶'}
                            </span>
                            <span className="accordion-emoji">🏢</span>
                            <span>Zain Departments</span>
                            <span className="accordion-count">(TI, Planning, Optim, Civil, MW)</span>
                        </div>
                        <div className="accordion-summary">
                            {!expandedSections.zain && stats.zain && (
                                <>
                                    <span className="summary-stat">
                                        Approved: {
                                            (stats.zain.ti?.approved || 0) +
                                            (stats.zain.planning?.approved || 0) +
                                            (stats.zain.optimization?.approved || 0) +
                                            (stats.zain.civil?.approved || 0) +
                                            (stats.zain.mw?.approved || 0)
                                        }
                                    </span>
                                    <span className="summary-stat">
                                        Pending: {
                                            (stats.zain.ti?.pending || 0) +
                                            (stats.zain.planning?.pending || 0) +
                                            (stats.zain.optimization?.pending || 0) +
                                            (stats.zain.civil?.pending || 0) +
                                            (stats.zain.mw?.pending || 0)
                                        }
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    {expandedSections.zain && (
                        <div className="accordion-content">
                            <ZainTable
                                data={stats.zain}
                                onDrillDown={handleDrillDown}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Drill-Down Modal */}
            <DrillDownModal
                open={drillDown.open}
                title={drillDown.title}
                sites={drillDown.sites}
                onClose={handleCloseModal}
            />
        </div>
    )
}

export default PerformanceTab
