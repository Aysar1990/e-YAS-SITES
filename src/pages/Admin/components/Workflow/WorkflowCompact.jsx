import React, { useMemo, useState } from 'react'
import { useFirebaseData } from '../../../../hooks/useFirebaseData' // Assuming this path, might need adjustment
import WorkflowNode from './WorkflowNode'
import WorkflowConnector from './WorkflowConnector'
import WorkflowExpanded from './WorkflowExpanded'
import './Workflow.css'

const WorkflowCompact = () => {
    const { sites } = useFirebaseData({ phase: 'ALL' })
    const [selectedStage, setSelectedStage] = useState(null)
    const [showExpanded, setShowExpanded] = useState(false)

    // Define Stages
    const stages = [
        { id: 'survey', label: 'Survey', icon: '📝', match: ['survey'] },
        { id: 'subcon', label: 'Subcon Design', icon: '👷', match: ['subcon'] },
        { id: 'nokia_gsd', label: 'Nokia GSD', icon: '🏢', match: ['gsd'] },
        { id: 'nokia_npo', label: 'Nokia NPO', icon: '📡', match: ['npo'] },
        { id: 'nokia_rom', label: 'Nokia ROM', icon: '📋', match: ['nokia rom'] },
        { id: 'zain', label: 'Zain Validation', icon: '👑', match: ['zain', 'ti', 'civil', 'mw'] },
        { id: 'approved', label: 'Approved', icon: '✅', match: ['approved'] }
    ]

    // Calculate Counts per Stage
    const stageCounts = useMemo(() => {
        if (!sites) return {}

        const counts = {}
        stages.forEach(stage => counts[stage.id] = 0)
        counts['other'] = 0

        sites.forEach(site => {
            const status = (site.tssrOverallStatus || '').toLowerCase()
            let found = false

            // Reverse loop to prioritized Approved (last stage) check if needed, 
            // but strict matching is better.

            if (status === 'approved') {
                counts['approved']++
                found = true
            } else if (status === 'site not surveyed' || status.includes('survey')) {
                counts['survey']++
                found = true
            } else {
                // Check intermediate stages
                for (let i = 1; i < stages.length - 1; i++) {
                    if (stages[i].match.some(m => status.includes(m))) {
                        counts[stages[i].id]++
                        found = true
                        break
                    }
                }
            }

            if (!found) counts['other']++
        })
        return counts
    }, [sites])


    return (
        <div className="workflow-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#F3F4F6', fontWeight: '600', margin: 0 }}>🔄 Live Approval Pipeline</h3>
                <button
                    onClick={() => setShowExpanded(true)}
                    style={{ background: 'rgba(55, 65, 81, 0.5)', border: '1px solid #4B5563', color: '#D1D5DB', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer' }}
                >
                    View Details
                </button>
            </div>
            <div className="workflow-compact">
                {stages.map((stage, index) => (
                    <React.Fragment key={stage.id}>
                        <WorkflowNode
                            label={stage.label}
                            icon={stage.icon}
                            count={stageCounts[stage.id]}
                            status={stageCounts[stage.id] > 0 ? 'active' : 'pending'}
                            onClick={() => setSelectedStage(stage.id)}
                        />
                        {index < stages.length - 1 && (
                            <WorkflowConnector active={stageCounts[stage.id] > 0} />
                        )}
                    </React.Fragment>
                ))}
            </div>
            {/* Legend or Note */}
            <div className="workflow-legend">
                <div className="legend-item"><div className="legend-dot" style={{ background: '#3B82F6' }}></div> Active Stage</div>
                <div className="legend-item"><div className="legend-dot" style={{ background: '#10B981' }}></div> Completed</div>
                <div className="legend-item"><div className="legend-dot" style={{ background: '#1F2937' }}></div> Pending</div>
            </div>

            {showExpanded && (
                <WorkflowExpanded
                    onClose={() => setShowExpanded(false)}
                    currentStage={selectedStage}
                />
            )}
        </div>
    )
}

export default WorkflowCompact
