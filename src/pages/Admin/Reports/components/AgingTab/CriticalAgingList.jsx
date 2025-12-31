import React from 'react'

const CriticalAgingList = ({ sites }) => {
    if (!sites || sites.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                ✅ No critical aging sites found. Great job!
            </div>
        )
    }

    return (
        <div className="critical-list-container">
            <table className="critical-table">
                <thead>
                    <tr>
                        <th>Site ID</th>
                        <th>Site Name</th>
                        <th>Status</th>
                        <th>Days</th>
                        <th>Responsible</th>
                    </tr>
                </thead>
                <tbody>
                    {sites.map((site, idx) => (
                        <tr key={idx}>
                            <td style={{ fontWeight: '600', color: '#F3F4F6' }}>{site.site_id}</td>
                            <td>{site.final_site_name}</td>
                            <td>
                                <span style={{ fontSize: '0.85rem', color: '#D1D5DB' }}>
                                    {site.tssr_overall_status}
                                </span>
                            </td>
                            <td>
                                <span className="age-badger">
                                    {site.age} days
                                </span>
                            </td>
                            <td>
                                <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                                    {site.current_dept}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default CriticalAgingList
