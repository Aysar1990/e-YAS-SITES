import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../UI'
import './BulkUpdateModal.css'

// Predefined TSSR Status List
const TSSR_STATUSES = [
    'Approved',
    'TSSR Under Zain validation',
    'TSSR Under ROM Review',
    'TSSR Under Nokia NPO Validation',
    'TSSR Under Nokia ROM Validation',
    'TSSR Under Nokia GSD Validation',
    'TSSR Under Subcon validation',
    'Site not Surveyed',
    'Need Access'
]

const BulkUpdateModal = ({ isOpen, onClose, onConfirm, selectedCount, availableStatuses }) => {
    const { t } = useTranslation()
    const [selectedStatus, setSelectedStatus] = useState('')
    const [updating, setUpdating] = useState(false)

    // Use predefined list, fallback to available if needed
    const statusList = TSSR_STATUSES

    if (!isOpen) return null

    const handleConfirm = async () => {
        if (!selectedStatus) return
        setUpdating(true)
        await onConfirm(selectedStatus)
        setUpdating(false)
        onClose()
    }

    return (
        <div className="bulk-modal-overlay">
            <div className="bulk-modal">
                <div className="bulk-modal-header">
                    <h3>{t('bulk.updateTitle') || 'Bulk Update Status'}</h3>
                    <button className="bulk-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="bulk-modal-body">
                    <p className="bulk-modal-desc">
                        {t('bulk.updateDesc', { count: selectedCount }) || `Update status for ${selectedCount} selected sites:`}
                    </p>

                    <div className="status-select-container">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bulk-status-select"
                        >
                            <option value="">{t('common.select') || 'Select new status...'}</option>
                            {statusList.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bulk-warning">
                        ⚠️ This action cannot be easily undone.
                    </div>
                </div>

                <div className="bulk-modal-footer">
                    <Button variant="ghost" onClick={onClose} disabled={updating}>
                        {t('common.cancel') || 'Cancel'}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!selectedStatus || updating}
                        isLoading={updating}
                    >
                        {t('common.update') || 'Update'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default BulkUpdateModal
