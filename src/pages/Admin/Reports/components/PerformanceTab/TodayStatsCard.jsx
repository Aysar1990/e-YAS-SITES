/**
 * TodayStatsCard - Enhanced
 * 
 * Shows today's activity with color-coded values
 * Colors: 🟢 +7 | 🟠 3-6 | 🔴 0-2
 */

import React from 'react'

// Get color class based on value
const getValueColorClass = (value) => {
    if (value >= 7) return 'value-green'
    if (value >= 3) return 'value-orange'
    return 'value-red'
}

const TodayStatsCard = ({ stats }) => {
    // Default values
    const s = stats || {
        surveyed: 0,
        submitted: 0,
        gsdProcessed: 0,
        npoProcessed: 0,
        romProcessed: 0,
        zainApproved: 0,
        total: 0
    }

    const items = [
        { label: 'Surveyed', value: s.surveyed || 0, icon: '🔍', description: 'Sites surveyed' },
        { label: 'Submitted', value: s.submitted || 0, icon: '📤', description: 'Submitted to Nokia' },
        { label: 'GSD', value: s.gsdProcessed || 0, icon: '✅', description: 'Passed GSD' },
        { label: 'NPO', value: s.npoProcessed || 0, icon: '📋', description: 'Passed NPO' },
        { label: 'Approved', value: s.zainApproved || 0, icon: '🎉', description: 'Fully approved' },
    ]

    // Calculate total activity
    const totalActivity = items.reduce((sum, item) => sum + item.value, 0)

    return (
        <div className="stats-card">
            <div className="stats-card-header">
                <div className="stats-card-title">
                    📅 Today's Activity
                </div>
                <div className="stats-card-badge" style={{
                    background: totalActivity > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    color: totalActivity > 0 ? '#8FD9D9' : '#6B7280',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                }}>
                    {totalActivity} actions
                </div>
            </div>
            
            <div className="today-stats-grid">
                {items.map((item, idx) => (
                    <div 
                        key={idx} 
                        className="today-stat-item"
                        title={item.description}
                    >
                        <div className={`stat-value ${getValueColorClass(item.value)}`}>
                            {item.value > 0 ? `+${item.value}` : '0'}
                        </div>
                        <div className="stat-label">{item.label}</div>
                        <div className="stat-icon">{item.icon}</div>
                    </div>
                ))}
            </div>

            {/* Color legend */}
            <div className="today-legend" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #374151',
                fontSize: '0.75rem',
                color: '#9CA3AF'
            }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        background: '#8FD9D9',
                        display: 'inline-block'
                    }}></span>
                    +7 Excellent
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        background: '#F59E0B',
                        display: 'inline-block'
                    }}></span>
                    3-6 Good
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        background: '#EF4444',
                        display: 'inline-block'
                    }}></span>
                    0-2 Low
                </span>
            </div>

            {/* Additional CSS for value colors */}
            <style>{`
                .value-green { color: #8FD9D9 !important; }
                .value-orange { color: #F59E0B !important; }
                .value-red { color: #EF4444 !important; }
            `}</style>
        </div>
    )
}

export default TodayStatsCard
