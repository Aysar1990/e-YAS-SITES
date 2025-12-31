import React from 'react'

const WeekForecastCard = ({ prediction }) => {
    if (!prediction) return null

    return (
        <div className="forecast-card">
            <div className="forecast-main">
                <div className="forecast-icon">🔮</div>
                <div className="forecast-info">
                    <h4>Estimated Completion</h4>
                    <div className="forecast-date">{prediction.estimatedCompletionDate}</div>
                </div>
            </div>

            <div style={{ textAlign: 'right' }}>
                <div className="velocity-badge">
                    ⚡ {prediction.velocity} sites / week
                </div>
                <div style={{ marginTop: '8px', color: '#9CA3AF', fontSize: '0.9rem' }}>
                    ~{prediction.weeksRemaining} weeks remaining
                </div>
            </div>
        </div>
    )
}

export default WeekForecastCard
