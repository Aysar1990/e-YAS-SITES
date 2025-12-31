import React from 'react'

const WorkflowConnector = ({ active }) => {
    return (
        <div className={`connector-line \${active ? 'active' : ''}`}></div>
    )
}

export default WorkflowConnector
