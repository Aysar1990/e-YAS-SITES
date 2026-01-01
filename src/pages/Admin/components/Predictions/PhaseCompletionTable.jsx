import React from 'react'

const PhaseCompletionTable = ({ predictions }) => {
    if (!predictions || predictions.length === 0) return null

    return (
        <div style={{ overflowX: 'auto' }}>
            <table className="prediction-table">
                <thead>
                    <tr>
                        <th>Phase</th>
                        <th>Total Sites</th>
                        <th>Pending</th>
                        <th>Est. Time</th>
                        <th>Target Date</th>
                    </tr>
                </thead>
                <tbody>
                    {predictions.map((phase, idx) => (
                        <tr key={idx}>
                            <td style={{ color: '#F3F4F6' }}>{phase.name}</td>
                            <td>{phase.total}</td>
                            <td>{phase.pending}</td>
                            <td style={{ color: phase.weeksReturning > 4 ? '#FBBF24' : '#8FD9D9' }}>
                                ~{phase.weeksReturning} weeks
                            </td>
                            <td>{phase.estimatedDate}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default PhaseCompletionTable
