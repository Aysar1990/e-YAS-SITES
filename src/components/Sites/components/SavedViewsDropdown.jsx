/**
 * Saved Views Dropdown Component
 * Allows users to save current filters and load them later
 * @module components/Sites/components/SavedViewsDropdown
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './SavedViewsDropdown.css'

export const SavedViewsDropdown = ({
    savedViews = [],
    onLoadView,
    onSaveView,
    onDeleteView,
    className = ''
}) => {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [showSaveInput, setShowSaveInput] = useState(false)
    const [newViewName, setNewViewName] = useState('')

    const handleSave = () => {
        if (newViewName.trim()) {
            onSaveView(newViewName.trim())
            setNewViewName('')
            setShowSaveInput(false)
            setIsOpen(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') setShowSaveInput(false)
    }

    return (
        <div className={`saved-views-container ${className}`}>
            {/* Trigger Button */}
            <button
                className="saved-views-trigger"
                onClick={() => setIsOpen(!isOpen)}
                title={t('sites.savedViews', 'Saved Views')}
            >
                <span className="icon">👁️</span>
                <span className="label">{t('sites.views', 'Views')}</span>
                <span className="arrow">▼</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="saved-views-menu">
                    {/* Header / Save Action */}
                    <div className="menu-header">
                        {!showSaveInput ? (
                            <button
                                className="btn-add-view"
                                onClick={() => setShowSaveInput(true)}
                            >
                                + {t('sites.saveCurrentView', 'Save Current View')}
                            </button>
                        ) : (
                            <div className="save-input-group">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={t('sites.viewName', 'View Name...')}
                                    value={newViewName}
                                    onChange={(e) => setNewViewName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button onClick={handleSave} className="btn-confirm-save">✓</button>
                                <button onClick={() => setShowSaveInput(false)} className="btn-cancel-save">✕</button>
                            </div>
                        )}
                    </div>

                    <div className="menu-divider"></div>

                    {/* Views List */}
                    <div className="views-list">
                        {savedViews.length === 0 ? (
                            <div className="empty-views">
                                {t('sites.noSavedViews', 'No saved views')}
                            </div>
                        ) : (
                            savedViews.map(view => (
                                <div key={view.id} className="view-item">
                                    <button
                                        className="view-name"
                                        onClick={() => {
                                            onLoadView(view.id)
                                            setIsOpen(false)
                                        }}
                                    >
                                        {view.name}
                                    </button>
                                    <button
                                        className="view-delete"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDeleteView(view.id)
                                        }}
                                        title={t('common.delete', 'Delete')}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && (
                <div className="menu-backdrop" onClick={() => setIsOpen(false)} />
            )}
        </div>
    )
}

export default SavedViewsDropdown
