import React, { useState, useEffect } from 'react'

const ConfigureBracketsModal = ({ brackets, onClose, onSave }) => {
    const [localBrackets, setLocalBrackets] = useState(brackets)

    useEffect(() => {
        setLocalBrackets(brackets)
    }, [brackets])

    const handleChange = (index, field, value) => {
        const newBrackets = [...localBrackets]
        newBrackets[index] = { ...newBrackets[index], [field]: value }
        setLocalBrackets(newBrackets)
    }

    const handleSave = () => {
        onSave(localBrackets)
        onClose()
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <div className="modal-title">⚙️ Configure Aging Brackets</div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {localBrackets.map((bracket, index) => (
                        <div key={bracket.id} className="bracket-row">
                            <div className="bracket-label">{bracket.label}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    className="bracket-input"
                                    value={bracket.min}
                                    readOnly={index > 0} // Only allow manual edit logic if sophisticated, simplistic for now
                                    onChange={(e) => handleChange(index, 'min', parseInt(e.target.value))}
                                />
                                <span>to</span>
                                <input
                                    type="number"
                                    className="bracket-input"
                                    value={bracket.max === Infinity ? '' : bracket.max}
                                    placeholder="∞"
                                    onChange={(e) => handleChange(index, 'max', e.target.value ? parseInt(e.target.value) : Infinity)}
                                />
                            </div>
                            <div className="color-preview" style={{ background: bracket.color }}></div>
                        </div>
                    ))}
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#9CA3AF' }}>
                        * Adjusting ranges affects all aging reports immediately.
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>Save Changes</button>
                </div>
            </div>
        </div>
    )
}

export default ConfigureBracketsModal
