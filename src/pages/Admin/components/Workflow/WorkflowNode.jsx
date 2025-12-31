import React from 'react'

const WorkflowNode = ({ label, icon, status, count, onClick }) => {
    // status: 'pending' | 'active' | 'completed' | 'rejected'

    return (
        <div
            className={`workflow-node \${status}`}
            onClick={onClick}
        >
            <div className="node-icon">
                {icon}
            </div>
            <div className="node-label">{label}</div>
            {count !== undefined && count > 0 && (
                <div className="node-status">{count} sites</div>
            )}
        </div>
    )
}

export default WorkflowNode
