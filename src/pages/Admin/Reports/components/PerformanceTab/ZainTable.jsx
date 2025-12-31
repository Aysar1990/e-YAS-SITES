/**
 * ZainTable - Enhanced
 * 
 * Features:
 * - Today Processed column with color coding
 * - Average Days column
 * - Released status tracking
 * - Action Taken calculation
 * - Clickable cells for drill-down
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

const ZainTable = ({ data, onDrillDown }) => {
    if (!data) {
        return (
            <div className="empty-table-message">
                <p>No Zain department data available</p>
            </div>
        )
    }

    // Transform data object to array with display info
    const departments = [
        { key: 'ti', name: 'TI', icon: '🔧', fullName: 'Technical Integration', ...data.ti },
        { key: 'planning', name: 'Planning', icon: '📐', fullName: 'RF Planning', ...data.planning },
        { key: 'optimization', name: 'Optimization', icon: '📊', fullName: 'RF Optimization', ...data.optimization },
        { key: 'civil', name: 'Civil', icon: '🏗️', fullName: 'Civil Works', ...data.civil },
        { key: 'mw', name: 'MW', icon: '📡', fullName: 'Microwave', ...data.mw },
    ]

    // Calculate totals
    const totals = {
        received: departments.reduce((sum, d) => sum + (d.received || 0), 0),
        approved: departments.reduce((sum, d) => sum + (d.approved || 0), 0),
        pending: departments.reduce((sum, d) => sum + (d.pending || 0), 0),
        rejected: departments.reduce((sum, d) => sum + (d.rejected || 0), 0),
        released: departments.reduce((sum, d) => sum + (d.released || 0), 0),
        actionTaken: departments.reduce((sum, d) => sum + (d.actionTaken || 0), 0),
        todayProcessed: departments.reduce((sum, d) => sum + (d.todayProcessed || 0), 0),
    }

    return (
        <div className="table-responsive">
            <table className="responsive-table performance-table">
                <thead>
                    <tr>
                        <th className="col-name">Department</th>
                        <th className="col-number">Received</th>
                        <th className="col-number">Approved</th>
                        <th className="col-number">Pending</th>
                        <th className="col-number">Rejected</th>
                        <th className="col-number">Released</th>
                        <th className="col-number">Action Taken</th>
                        <th className="col-today">Today</th>
                        <th className="col-number">Avg Days</th>
                        <th className="col-rate">Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map((row) => (
                        <tr key={row.key}>
                            <td className="cell-name" title={row.fullName}>
                                <span className="dept-icon">{row.icon}</span>
                                {row.name}
                            </td>
                            <td
                                className="clickable-cell"
                                onClick={() => onDrillDown(`Zain ${row.fullName}`, 'Received', row.rawSites_received)}
                            >
                                {row.received || 0}
                            </td>
                            <td
                                className="clickable-cell cell-approved"
                                onClick={() => onDrillDown(`Zain ${row.fullName}`, 'Approved', row.rawSites_approved)}
                            >
                                {row.approved || 0}
                            </td>
                            <td
                                className="clickable-cell cell-pending"
                                onClick={() => onDrillDown(`Zain ${row.fullName}`, 'Pending', row.rawSites_pending)}
                            >
                                {row.pending || 0}
                            </td>
                            <td
                                className="clickable-cell cell-rejected"
                                onClick={() => onDrillDown(`Zain ${row.fullName}`, 'Rejected', row.rawSites_rejected)}
                            >
                                {row.rejected || 0}
                            </td>
                            <td
                                className="clickable-cell cell-released"
                                onClick={() => onDrillDown(`Zain ${row.fullName}`, 'Released', row.rawSites_released)}
                            >
                                {row.released || 0}
                            </td>
                            <td className="cell-action-taken">
                                {row.actionTaken || 0}
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
                        <td className="cell-pending"><strong>{totals.pending}</strong></td>
                        <td className="cell-rejected"><strong>{totals.rejected}</strong></td>
                        <td className="cell-released"><strong>{totals.released}</strong></td>
                        <td><strong>{totals.actionTaken}</strong></td>
                        <td className={`cell-today ${getTodayColorClass(totals.todayProcessed)}`}>
                            <strong>{formatToday(totals.todayProcessed)}</strong>
                        </td>
                        <td>-</td>
                        <td>-</td>
                    </tr>
                </tfoot>
            </table>
            <div className="table-hint">
                💡 Click any number to see the specific sites | 
                <span className="hint-note"> Released = Action taken by department (counts as completed)</span>
            </div>
        </div>
    )
}

export default ZainTable
