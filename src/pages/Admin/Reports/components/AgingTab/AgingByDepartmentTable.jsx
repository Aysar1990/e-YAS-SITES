import React from 'react'

const AgingByDepartmentTable = ({ data, brackets }) => {
    return (
        <table className="dept-table">
            <thead>
                <tr>
                    <th>Department</th>
                    {brackets.map(b => (
                        <th key={b.id} style={{ color: b.color }}>{b.label}</th>
                    ))}
                    <th>Avg Age</th>
                </tr>
            </thead>
            <tbody>
                {data.map((dept, idx) => (
                    <tr key={idx}>
                        <td>{dept.department}</td>
                        {brackets.map(b => (
                            <td key={b.id}>
                                {dept[b.id] > 0 ? dept[b.id].toLocaleString() : '-'}
                            </td>
                        ))}
                        <td style={{ color: dept.avgAge > 7 ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                            {dept.avgAge} days
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default AgingByDepartmentTable
