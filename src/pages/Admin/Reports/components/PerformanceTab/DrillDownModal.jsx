/**
 * DrillDownModal - Enhanced
 * 
 * Features:
 * - Search functionality
 * - Pagination
 * - Excel export
 * - Improved styling
 */

import React, { useState, useMemo } from 'react'
import { exportDrillDownSites } from '../../utils/performanceExport'

const DrillDownModal = ({ open, onClose, title, sites }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [exporting, setExporting] = useState(false)
    const itemsPerPage = 15

    // Reset page when sites change
    React.useEffect(() => {
        setCurrentPage(1)
        setSearchTerm('')
    }, [sites, title])

    // Filter sites by search term
    const filteredSites = useMemo(() => {
        if (!sites || !Array.isArray(sites)) return []
        if (!searchTerm.trim()) return sites
        
        const term = searchTerm.toLowerCase()
        return sites.filter(site =>
            (site.site_id || site.siteId || '').toLowerCase().includes(term) ||
            (site.final_site_name || site.finalSiteName || '').toLowerCase().includes(term) ||
            (site.governorate || '').toLowerCase().includes(term) ||
            (site.tssr_subcon || site.tssrSubcon || '').toLowerCase().includes(term) ||
            (site.tssr_overall_status || site.tssrOverallStatus || '').toLowerCase().includes(term)
        )
    }, [sites, searchTerm])

    // Pagination
    const totalPages = Math.ceil(filteredSites.length / itemsPerPage)
    const currentSites = filteredSites.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Get status color class
    const getStatusClass = (status) => {
        if (!status) return ''
        const s = status.toLowerCase()
        if (s === 'approved') return 'status-approved'
        if (s.includes('rejected')) return 'status-rejected'
        if (s === 'pending') return 'status-pending'
        if (s === 'released') return 'status-released'
        return ''
    }

    // Handle export
    const handleExport = async () => {
        if (!filteredSites || filteredSites.length === 0) return
        
        setExporting(true)
        try {
            const filename = `DrillDown_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
            await exportDrillDownSites(filteredSites, title, filename)
        } catch (error) {
            console.error('Export failed:', error)
            alert('Export failed: ' + error.message)
        }
        setExporting(false)
    }

    if (!open) return null

    return (
        <div className="drill-down-modal-container">
            {/* Overlay */}
            <div className="modal-overlay" onClick={onClose}></div>

            {/* Modal */}
            <div className="drill-down-modal">
                {/* Header */}
                <div className="drill-down-header">
                    <h3>
                        📋 {title} 
                        <span style={{ 
                            marginLeft: '12px', 
                            fontSize: '0.9rem', 
                            color: '#8FD9D9',
                            fontWeight: 'normal'
                        }}>
                            ({filteredSites.length} sites)
                        </span>
                    </h3>
                    <button onClick={onClose} title="Close">✕</button>
                </div>

                {/* Toolbar */}
                <div className="drill-down-toolbar">
                    <input
                        type="text"
                        placeholder="🔍 Search by Site ID, Name, Governorate..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1)
                        }}
                    />
                    <button 
                        className="btn btn--primary"
                        onClick={handleExport}
                        disabled={exporting || filteredSites.length === 0}
                        style={{
                            background: 'linear-gradient(135deg, #8FD9D9 0%, #6BC4C4 100%)',
                            color: '#0F172A',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: exporting ? 'not-allowed' : 'pointer',
                            opacity: exporting ? 0.7 : 1
                        }}
                    >
                        {exporting ? '⏳ Exporting...' : '📥 Export to Excel'}
                    </button>
                </div>

                {/* Table */}
                <div className="drill-down-table-wrapper">
                    {filteredSites.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '60px 20px',
                            color: '#9CA3AF'
                        }}>
                            <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                                {searchTerm ? '🔍 No sites match your search' : '📭 No sites in this category'}
                            </p>
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid #374151',
                                        color: '#8FD9D9',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="responsive-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '100px' }}>Site ID</th>
                                    <th style={{ width: '180px' }}>Site Name</th>
                                    <th style={{ width: '80px' }}>Phase</th>
                                    <th style={{ width: '100px' }}>Governorate</th>
                                    <th style={{ width: '120px' }}>Subcontractor</th>
                                    <th style={{ width: '180px' }}>Overall Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentSites.map((site, idx) => (
                                    <tr key={site.site_id || site.siteId || idx}>
                                        <td style={{ fontWeight: '500', color: '#8FD9D9' }}>
                                            {site.site_id || site.siteId || '-'}
                                        </td>
                                        <td>{site.final_site_name || site.finalSiteName || '-'}</td>
                                        <td>{site.phase_name || site.phaseName || '-'}</td>
                                        <td>{site.governorate || '-'}</td>
                                        <td>{site.tssr_subcon || site.tssrSubcon || '-'}</td>
                                        <td className={getStatusClass(site.tssr_overall_status || site.tssrOverallStatus)}>
                                            {site.tssr_overall_status || site.tssrOverallStatus || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="drill-down-footer">
                    <div>
                        Showing {currentSites.length} of {filteredSites.length} sites
                        {searchTerm && ` (filtered from ${sites?.length || 0})`}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            className="pagination-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                            title="First Page"
                        >
                            ⏮
                        </button>
                        <button
                            className="pagination-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(c => c - 1)}
                        >
                            ◀ Prev
                        </button>
                        <span style={{ 
                            padding: '4px 12px', 
                            background: 'rgba(143, 217, 217, 0.2)',
                            borderRadius: '4px',
                            minWidth: '80px',
                            textAlign: 'center'
                        }}>
                            {currentPage} / {totalPages || 1}
                        </span>
                        <button
                            className="pagination-btn"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(c => c + 1)}
                        >
                            Next ▶
                        </button>
                        <button
                            className="pagination-btn"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            title="Last Page"
                        >
                            ⏭
                        </button>
                    </div>
                </div>
            </div>

            {/* Inline styles for status colors */}
            <style>{`
                .status-approved { color: #10B981; font-weight: 500; }
                .status-rejected { color: #EF4444; font-weight: 500; }
                .status-pending { color: #F59E0B; font-weight: 500; }
                .status-released { color: #D97706; font-weight: 500; }
            `}</style>
        </div>
    )
}

export default DrillDownModal
