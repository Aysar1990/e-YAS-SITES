import React from 'react'
import WorkflowNode from './WorkflowNode'
import WorkflowConnector from './WorkflowConnector'
import './Workflow.css'

const WorkflowExpanded = ({ onClose, currentStage }) => {
    // This could be a complex SVG or a structured grid
    // For now, we simulate a more detailed view with rejection paths visualized

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content workflow-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">Detailed Approval Workflow</div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>

                    <div style={{ textAlign: 'center', marginBottom: '40px', color: '#9CA3AF' }}>
                        This view shows the complete decision tree including rejection loops.
                    </div>

                    <div className="workflow-compact" style={{ width: '100%', maxWidth: '1000px', flexDirection: 'column', gap: '40px' }}>

                        {/* Main Path */}
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <WorkflowNode label="Survey" icon="📝" status={'completed'} />
                            <WorkflowConnector active={true} />
                            <WorkflowNode label="Subcon" icon="👷" status={'completed'} />
                            <WorkflowConnector active={true} />
                            <WorkflowNode label="Nokia GSD" icon="🏢" status={'active'} />
                            <WorkflowConnector active={false} />
                            <WorkflowNode label="Nokia NPO" icon="📡" status={'pending'} />
                            <WorkflowConnector active={false} />
                            <WorkflowNode label="Zain" icon="👑" status={'pending'} />
                        </div>

                        {/* Rejection Path Simulation (Visual Only) */}
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div className="workflow-node rejected">
                                <div className="node-icon">❌</div>
                                <div className="node-label">Rejection</div>
                            </div>
                            <span style={{ color: '#EF4444' }}>Returns to Subcon or Previous Stage</span>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    )
}

export default WorkflowExpanded
