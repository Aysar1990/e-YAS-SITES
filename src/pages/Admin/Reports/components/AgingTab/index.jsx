import React, { useState } from 'react'
import { useAgingAnalysis } from '../../hooks/useAgingAnalysis'
import AgingDistributionChart from './AgingDistributionChart'
import AgingByDepartmentTable from './AgingByDepartmentTable'
import CriticalAgingList from './CriticalAgingList'
import ConfigureBracketsModal from './ConfigureBracketsModal'
import './AgingTab.css'

const AgingTab = ({ sites }) => {
    const [brackets, setBrackets] = useState([
        { id: 'fresh', label: '< 3 days', min: 0, max: 3, color: '#8FD9D9' },
        { id: 'normal', label: '3-7 days', min: 3, max: 7, color: '#FBBF24' },
        { id: 'warning', label: '7-14 days', min: 7, max: 14, color: '#FF8566' },
        { id: 'critical', label: '> 14 days', min: 14, max: Infinity, color: '#EF4444' }
    ])
    const [showConfig, setShowConfig] = useState(false)

    const analysis = useAgingAnalysis(sites, brackets)

    return (
        <div className="aging-tab">
            <div className="aging-header">
                <div className="aging-title">
                    ⏱️ Aging Analysis
                    <span style={{ fontSize: '0.9rem', fontWeight: '400', color: '#9CA3AF', marginLeft: '12px' }}>
                        Avg Age: <strong style={{ color: '#F3F4F6' }}>{analysis.avgAge} days</strong>
                    </span>
                </div>
                <div>
                    <button className="configure-btn" onClick={() => setShowConfig(true)}>
                        ⚙️ Configure Brackets
                    </button>
                </div>
            </div>

            <div className="aging-grid">
                {/* Top Row: Distribution & By Department */}
                <div className="aging-card">
                    <div className="card-title">
                        ⏳ Aging Distribution
                    </div>
                    <AgingDistributionChart distribution={analysis.distribution} />
                </div>

                <div className="aging-card">
                    <div className="card-title">
                        🏢 Aging by Department
                    </div>
                    <AgingByDepartmentTable data={analysis.byDepartment} brackets={brackets} />
                </div>

                {/* Bottom Row: Critical List (Full Width) */}
                <div className="aging-card wide">
                    <div className="card-title">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🔴 Critical Aging Sites ({analysis.criticalSites.length})
                        </span>
                        <button className="configure-btn" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                            View All
                        </button>
                    </div>
                    <CriticalAgingList sites={analysis.criticalSites} />
                </div>
            </div>

            {showConfig && (
                <ConfigureBracketsModal
                    brackets={brackets}
                    onClose={() => setShowConfig(false)}
                    onSave={setBrackets}
                />
            )}
        </div>
    )
}

export default AgingTab
