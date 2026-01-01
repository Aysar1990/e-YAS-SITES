/**
 * OverallProgressCard - Enhanced
 * 
 * Shows overall TSSR progress with animated progress bar
 */

import React from 'react'

const OverallProgressCard = ({ total, approved, inProgress, notStarted }) => {
    // Calculate percentages
    const completionRate = total > 0 ? Math.round((approved / total) * 100) : 0
    const inProgressRate = total > 0 ? Math.round((inProgress / total) * 100) : 0
    const notStartedRate = total > 0 ? Math.round((notStarted / total) * 100) : 0

    // Determine completion status
    const getCompletionStatus = () => {
        if (completionRate >= 90) return { text: 'Excellent', color: '#8FD9D9' }
        if (completionRate >= 70) return { text: 'Good Progress', color: '#8FD9D9' }
        if (completionRate >= 50) return { text: 'On Track', color: '#F59E0B' }
        return { text: 'Needs Attention', color: '#EF4444' }
    }

    const status = getCompletionStatus()

    return (
        <div className="stats-card">
            <div className="stats-card-header">
                <div className="stats-card-title">
                    📊 Overall TSSR Progress
                </div>
                <div style={{
                    color: status.color,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: status.color,
                        animation: 'pulse 2s infinite'
                    }}></span>
                    {completionRate}% Complete
                </div>
            </div>

            <div className="progress-container">
                {/* Multi-segment progress bar */}
                <div className="progress-bar-bg" style={{ position: 'relative' }}>
                    {/* Approved segment */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${completionRate}%`,
                            background: 'linear-gradient(90deg, #8FD9D9 0%, #8FD9D9 100%)',
                            borderRadius: completionRate === 100 ? '12px' : '12px 0 0 12px',
                            transition: 'width 1s ease-in-out',
                            zIndex: 3
                        }}
                    ></div>
                    
                    {/* In Progress segment */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${completionRate}%`,
                            top: 0,
                            height: '100%',
                            width: `${inProgressRate}%`,
                            background: '#F59E0B',
                            transition: 'width 1s ease-in-out',
                            zIndex: 2
                        }}
                    ></div>

                    {/* Completion text */}
                    <span className="progress-text">
                        {approved.toLocaleString()} / {total.toLocaleString()} Sites
                    </span>
                </div>

                {/* Legend with actual values */}
                <div className="progress-legend" style={{ marginTop: '20px' }}>
                    <div className="legend-item">
                        <span style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            background: 'linear-gradient(135deg, #8FD9D9, #8FD9D9)',
                            marginRight: '8px'
                        }}></span>
                        <div>
                            <span className="legend-label">Approved</span>
                            <span className="legend-value" style={{ color: '#8FD9D9' }}>
                                {approved.toLocaleString()} ({completionRate}%)
                            </span>
                        </div>
                    </div>
                    
                    <div className="legend-item">
                        <span style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            background: '#F59E0B',
                            marginRight: '8px'
                        }}></span>
                        <div>
                            <span className="legend-label">In Progress</span>
                            <span className="legend-value" style={{ color: '#F59E0B' }}>
                                {inProgress.toLocaleString()} ({inProgressRate}%)
                            </span>
                        </div>
                    </div>
                    
                    <div className="legend-item">
                        <span style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            background: '#6B7280',
                            marginRight: '8px'
                        }}></span>
                        <div>
                            <span className="legend-label">Not Started</span>
                            <span className="legend-value" style={{ color: '#9CA3AF' }}>
                                {notStarted.toLocaleString()} ({notStartedRate}%)
                            </span>
                        </div>
                    </div>
                    
                    <div className="legend-item">
                        <span style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            background: '#1F2937',
                            border: '1px solid #374151',
                            marginRight: '8px'
                        }}></span>
                        <div>
                            <span className="legend-label">Total</span>
                            <span className="legend-value" style={{ color: '#F9FAFB', fontWeight: 'bold' }}>
                                {total.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    )
}

export default OverallProgressCard
