/**
 * PeriodSelector - Enhanced
 * 
 * Period selection with custom date range support
 */

import React, { useState } from 'react'

const PeriodSelector = ({ value, onChange, onCustomRange, customRange }) => {
    const [showCustom, setShowCustom] = useState(false)
    const [tempStart, setTempStart] = useState('')
    const [tempEnd, setTempEnd] = useState('')

    const periods = [
        { id: 'today', label: 'Today', icon: '📅' },
        { id: 'week', label: 'This Week', icon: '📆' },
        { id: 'month', label: 'This Month', icon: '🗓️' },
        { id: 'all', label: 'All Time', icon: '♾️' },
    ]

    const handlePeriodClick = (periodId) => {
        if (periodId === 'custom') {
            setShowCustom(true)
        } else {
            setShowCustom(false)
            onChange(periodId)
        }
    }

    const handleApplyCustom = () => {
        if (tempStart && tempEnd) {
            onCustomRange(new Date(tempStart), new Date(tempEnd))
            setShowCustom(false)
        }
    }

    const handleCancelCustom = () => {
        setShowCustom(false)
        setTempStart('')
        setTempEnd('')
    }

    // Format date for display
    const formatDate = (date) => {
        if (!date) return ''
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        })
    }

    return (
        <div className="period-selector-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Period Buttons */}
            <div className="period-selector">
                {periods.map((p) => (
                    <button
                        key={p.id}
                        className={`period-btn ${value === p.id ? 'active' : ''}`}
                        onClick={() => handlePeriodClick(p.id)}
                        title={p.label}
                    >
                        <span className="period-icon">{p.icon}</span>
                        <span className="period-label">{p.label}</span>
                    </button>
                ))}
                
                {/* Custom Button */}
                <button
                    className={`period-btn ${value === 'custom' ? 'active' : ''}`}
                    onClick={() => handlePeriodClick('custom')}
                    title="Custom Date Range"
                >
                    <span className="period-icon">📅</span>
                    <span className="period-label">
                        {value === 'custom' && customRange?.start && customRange?.end
                            ? `${formatDate(customRange.start)} - ${formatDate(customRange.end)}`
                            : 'Custom'
                        }
                    </span>
                </button>
            </div>

            {/* Custom Date Picker Popup */}
            {showCustom && (
                <div className="custom-range-popup" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                    zIndex: 100,
                    minWidth: '320px'
                }}>
                    <div style={{ marginBottom: '12px', color: '#F9FAFB', fontWeight: '600' }}>
                        Select Date Range
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '4px', 
                                color: '#9CA3AF',
                                fontSize: '0.85rem'
                            }}>
                                From
                            </label>
                            <input
                                type="date"
                                value={tempStart}
                                onChange={(e) => setTempStart(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: '#374151',
                                    border: '1px solid #4B5563',
                                    borderRadius: '6px',
                                    color: '#F9FAFB',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '4px', 
                                color: '#9CA3AF',
                                fontSize: '0.85rem'
                            }}>
                                To
                            </label>
                            <input
                                type="date"
                                value={tempEnd}
                                onChange={(e) => setTempEnd(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: '#374151',
                                    border: '1px solid #4B5563',
                                    borderRadius: '6px',
                                    color: '#F9FAFB',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleCancelCustom}
                            style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                border: '1px solid #4B5563',
                                borderRadius: '6px',
                                color: '#9CA3AF',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApplyCustom}
                            disabled={!tempStart || !tempEnd}
                            style={{
                                padding: '8px 16px',
                                background: tempStart && tempEnd ? '#8FD9D9' : '#4B5563',
                                border: 'none',
                                borderRadius: '6px',
                                color: tempStart && tempEnd ? '#0F172A' : '#9CA3AF',
                                cursor: tempStart && tempEnd ? 'pointer' : 'not-allowed',
                                fontWeight: '600',
                                fontSize: '0.9rem'
                            }}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {showCustom && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99
                    }}
                    onClick={handleCancelCustom}
                />
            )}

            {/* Additional styles */}
            <style>{`
                .period-selector-wrapper {
                    position: relative;
                }
                .period-icon {
                    margin-right: 4px;
                }
                @media (max-width: 768px) {
                    .period-label {
                        display: none;
                    }
                    .period-icon {
                        margin-right: 0;
                    }
                }
            `}</style>
        </div>
    )
}

export default PeriodSelector
