import React from 'react'

const SubcontractorRanking = ({ ranking }) => {
    // Check if data is empty
    if (!ranking || ranking.length === 0) {
        return (
            <div className="ranking-list empty-chart">
                <div className="no-data-message">
                    <span className="no-data-icon">🏆</span>
                    <p>No contractor data available</p>
                </div>
            </div>
        )
    }

    return (
        <div className="ranking-list">
            {ranking.map((sub, idx) => (
                <div key={idx} className="ranking-item">
                    <div className="rank-info">
                        <div className={`rank-number rank-${idx + 1}`}>
                            {idx + 1}
                        </div>
                        <div className="subcon-name">{sub.name}</div>
                    </div>
                    <div className="completion-rate">
                        {sub.rate}% <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#6B7280' }}>Success</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default SubcontractorRanking
