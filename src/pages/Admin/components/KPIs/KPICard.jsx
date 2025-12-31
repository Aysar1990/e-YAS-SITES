import React from 'react'

const KPICard = ({ title, value, icon, subValue, subLabel, color }) => {
    return (
        <div className="kpi-card">
            <div className="stat-card-inner">
                <div
                    className="stat-icon-wrapper"
                    style={{
                        background: `${color}20`,
                        color: color,
                        border: `1px solid ${color}40`
                    }}
                >
                    {icon}
                </div>
                <div className="stat-content">
                    <div className="stat-value">{value}</div>
                    <div className="stat-label">{title}</div>
                </div>
            </div>
            {
                subValue && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: '#9CA3AF' }}>
                        <span style={{ color: color, fontWeight: '600' }}>{subValue}</span> {subLabel}
                    </div>
                )
            }
        </div >
    )
}

export default KPICard
