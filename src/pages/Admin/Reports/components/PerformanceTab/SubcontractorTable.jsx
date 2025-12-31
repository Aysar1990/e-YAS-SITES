/**
 * SubcontractorTable - Enhanced
 * 
 * Features:
 * - Today columns with color coding (🟢+7, 🟠3-6, 🔴0-2)
 * - Average Days column
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

const SubcontractorTable = ({ data, onDrillDown }) => {
    if (!data || data.length === 0) {
        return (
            <div className="empty-table-message">
                <p>No subcontractor data available</p>
            </div>
        )
    }

    // Calculate totals
    const totals = {
        assigned: data.reduce((sum, r) => sum + (r.assigned || 0), 0),
        surveyed: data.reduce((sum, r) => sum + (r.surveyed || 0), 0),
        submitted: data.reduce((sum, r) => sum + (r.submitted || 0), 0),
        pendingSurvey: data.reduce((sum, r) => sum + (r.pendingSurvey || 0), 0),
        pendingSubmit: data.reduce((sum, r) => sum + (r.pendingSubmit || 0), 0),
        todaySurveyed: data.reduce((sum, r) => sum + (r.todaySurveyed || 0), 0),
        todaySubmitted: data.reduce((sum, r) => sum + (r.todaySubmitted || 0), 0),
    }
    const avgRate = data.length > 0 
        ? data.reduce((sum, r) => sum + (r.surveyRate || 0), 0) / data.length 
        : 0

    return (
        <div className="table-responsive">
            <table className="responsive-table performance-table">
                <thead>
                    <tr>
                        <th className="col-name">Subcontractor</th>
                        <th className="col-number">Assigned</th>
                        <th className="col-number">Surveyed</th>
                        <th className="col-number">Submitted</th>
                        <th className="col-number">Pending Survey</th>
                        <th className="col-number">Pending Submit</th>
                        <th className="col-today">Today +Survey</th>
                        <th className="col-today">Today +Submit</th>
                        <th className="col-number">Avg Days</th>
                        <th className="col-rate">Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={idx}>
                            <td className="cell-name">{row.name}</td>
                            <td
                                className="clickable-cell"
                                onClick={() => onDrillDown(row.name, 'All Assigned', row.rawSites)}
                            >
                                {row.assigned}
                            </td>
                            <td
                                className="clickable-cell"
                                onClick={() => onDrillDown(row.name, 'Surveyed', row.rawSites_surveyed)}
                            >
                                {row.surveyed}
                            </td>
                            <td
                                className="clickable-cell"
                                onClick={() => onDrillDown(row.name, 'Submitted to Nokia', row.rawSites_submitted)}
                            >
                                {row.submitted}
                            </td>
                            <td
                                className="clickable-cell cell-warning"
                                onClick={() => onDrillDown(row.name, 'Pending Survey', row.rawSites_pendingSurvey)}
                            >
                                {row.pendingSurvey}
                            </td>
                            <td
                                className="clickable-cell cell-warning"
                                onClick={() => onDrillDown(row.name, 'Pending Submit', row.rawSites_pendingSubmit)}
                            >
                                {row.pendingSubmit}
                            </td>
                            <td className={`cell-today ${getTodayColorClass(row.todaySurveyed)}`}>
                                {formatToday(row.todaySurveyed)}
                            </td>
                            <td className={`cell-today ${getTodayColorClass(row.todaySubmitted)}`}>
                                {formatToday(row.todaySubmitted)}
                            </td>
                            <td className="cell-days">
                                {row.avgDays || '-'}
                            </td>
                            <td>
                                <span className={row.surveyRate >= 95 ? 'cell-positive' : row.surveyRate >= 80 ? 'cell-neutral' : 'cell-negative'}>
                                    {row.surveyRate.toFixed(1)}%
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="totals-row">
                        <td className="cell-name"><strong>TOTAL</strong></td>
                        <td><strong>{totals.assigned}</strong></td>
                        <td><strong>{totals.surveyed}</strong></td>
                        <td><strong>{totals.submitted}</strong></td>
                        <td className="cell-warning"><strong>{totals.pendingSurvey}</strong></td>
                        <td className="cell-warning"><strong>{totals.pendingSubmit}</strong></td>
                        <td className={`cell-today ${getTodayColorClass(totals.todaySurveyed)}`}>
                            <strong>{formatToday(totals.todaySurveyed)}</strong>
                        </td>
                        <td className={`cell-today ${getTodayColorClass(totals.todaySubmitted)}`}>
                            <strong>{formatToday(totals.todaySubmitted)}</strong>
                        </td>
                        <td>-</td>
                        <td>
                            <strong className={avgRate >= 95 ? 'cell-positive' : 'cell-neutral'}>
                                {avgRate.toFixed(1)}%
                            </strong>
                        </td>
                    </tr>
                </tfoot>
            </table>
            <div className="table-hint">
                💡 Click any number to see the specific sites
            </div>
        </div>
    )
}

export default SubcontractorTable
