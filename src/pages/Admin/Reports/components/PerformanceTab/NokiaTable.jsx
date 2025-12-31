/**
 * NokiaTable - Enhanced
 * 
 * Features:
 * - Today Processed column with color coding
 * - Average Days column
 * - Clickable cells for drill-down
 * - GSD, NPO, ROM stages
 */

import React from 'react'

// Get color class based on today's count
const getTodayColorClass = (value) => {
    if (value >= 7) return 'today-green'
    if (value >= 3) return 'today-orange'
    return 'today-red'
}

// Format today's value with + prefix
const formatToday = (value) => {
    if (value > 0) return `+${value}`
    return '0'
}

const NokiaTable = ({ data, onDrillDown }) => {
    if (!data) {
        return (
            <div className="empty-table-message">
                <p>No Nokia data available</p>
            </div>
        )
    }

    // Transform data object to array
    const stages = [
        { key: 'gsd', name: 'GSD Validation', icon: '🔵', ...data.gsd },
        { key: 'npo', name: 'NPO Validation', icon: '🟣', ...data.npo },
        { key: 'rom', name: 'ROM Review', icon: '🟠', ...data.rom }
    ]

    // Calculate totals
    const totals = {
        received: stages.reduce((sum, s) => sum + (s.received || 0), 0),
        approved: stages.reduce((sum, s) => sum + (s.approved || 0), 0),
        rejected: stages.reduce((sum, s) => sum + (s.rejected || 0), 0),
        pending: stages.reduce((sum, s) => sum + (s.pending || 0), 0),
        todayProcessed: stages.reduce((sum, s) => sum + (s.todayProcessed || 0), 0),
    }

    return (
        <div className="table-responsive">
            <table className="responsive-table performance-table">
                <thead>
                    <tr>
                        <th className="col-name">Stage</th>
                        <th className="col-number">Received</th>
                        <th className="col-number">Approved</th>
                        <th className="col-number">Rejected</th>
                        <th className="col-number">Pending</th>
                        <th className="col-today">Today</th>
                        <th className="col-number">Avg Days</th>
                        <th className="col-rate">Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {stages.map((row) => (
                        <tr key={row.key}>
                            <td className="cell-name">
                                <span className="stage-icon">{row.icon}</span>
                                {row.name}
                            </td>
                            <td
                                className="clickable-cell"
                                onClick={() => onDrillDown(`Nokia ${row.name}`, 'Received', row.rawSites_received)}
                            >
                                {row.received || 0}
                            </td>
                            <td
                                className="clickable-cell cell-approved"
                                onClick={() => onDrillDown(`Nokia ${row.name}`, 'Approved', row.rawSites_approved)}
                            >
                                {row.approved || 0}
                            </td>
                            <td
                                className="clickable-cell cell-rejected"
                                onClick={() => onDrillDown(`Nokia ${row.name}`, 'Rejected', row.rawSites_rejected)}
                            >
                                {row.rejected || 0}
                            </td>
                            <td
                                className="clickable-cell cell-pending"
                                onClick={() => onDrillDown(`Nokia ${row.name}`, 'Pending', row.rawSites_pending)}
                            >
                                {row.pending || 0}
                            </td>
                            <td className={`cell-today ${getTodayColorClass(row.todayProcessed)}`}>
                                {formatToday(row.todayProcessed)}
                            </td>
                            <td className="cell-days">
                                {row.avgDays || '-'}
                            </td>
                            <td>
                                <span className={row.rate >= 95 ? 'cell-positive' : row.rate >= 80 ? 'cell-neutral' : 'cell-negative'}>
                                    {(row.rate || 0).toFixed(1)}%
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="totals-row">
                        <td className="cell-name"><strong>TOTAL</strong></td>
                        <td><strong>{totals.received}</strong></td>
                        <td className="cell-approved"><strong>{totals.approved}</strong></td>
                        <td className="cell-rejected"><strong>{totals.rejected}</strong></td>
                        <td className="cell-pending"><strong>{totals.pending}</strong></td>
                        <td className={`cell-today ${getTodayColorClass(totals.todayProcessed)}`}>
                            <strong>{formatToday(totals.todayProcessed)}</strong>
                        </td>
                        <td>-</td>
                        <td>-</td>
                    </tr>
                </tfoot>
            </table>
            <div className="table-hint">
                💡 Click any number to see the specific sites
            </div>
        </div>
    )
}

export default NokiaTable
