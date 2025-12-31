/**
 * Nokia Sites Page - With Rejection Review Feature (View-Only for site data)
 * Uses shared Sites components for filtering and display
 */

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import MainLayout from '../../components/Layout/MainLayout'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import {
  useSitesData,
  useSitesFilters,
  SiteFilters,
  SiteCard,
  SiteStats,
  RejectionModal
} from '../../components/Sites'
import './NokiaSites.css'

const NokiaSites = () => {
  const { t } = useTranslation()
  const { direction } = useLanguage()
  const { user } = useAuth()

  // Data hook
  const {
    sites,
    loading,
    phases,
    activePhase,
    setActivePhase,
    uniqueStatuses,
    uniqueContractors
  } = useSitesData()

  // Filters hook
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    contractorFilter,
    setContractorFilter,
    sortedSites
  } = useSitesFilters(sites)

  // Local state
  const [reviewModal, setReviewModal] = useState(null)
  const [nokiaReviews, setNokiaReviews] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  // Load Nokia reviews
  useEffect(() => {
    loadNokiaReviews()
  }, [])

  const loadNokiaReviews = async () => {
    try {
      const result = await window.electron.getNokiaReviews()
      if (result.success && result.reviews) {
        const reviewsMap = {}
        result.reviews.forEach(r => {
          reviewsMap[r.site_id] = r
        })
        setNokiaReviews(reviewsMap)
      }
    } catch (error) {
      console.error('Failed to load Nokia reviews:', error)
    }
  }

  // Merge sites with reviews
  const sitesWithReviews = useMemo(() => {
    return sortedSites.map(site => ({
      ...site,
      ...nokiaReviews[site.site_id]
    }))
  }, [sortedSites, nokiaReviews])

  const handleReview = (site) => {
    setReviewModal(site)
  }

  const handleSaveReview = async (data) => {
    try {
      const result = await window.electron.updateNokiaRejection(data)
      if (result.success) {
        setSuccessMessage('Review saved successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
        await loadNokiaReviews()
      }
    } catch (error) {
      console.error('Failed to save review:', error)
      throw error
    }
  }

  return (
    <MainLayout>
      <div className="nokia-sites-page" dir={direction}>
        {/* Success Message */}
        {successMessage && (
          <div className="nokia-success-toast">
            <span>✓</span> {successMessage}
          </div>
        )}

        <div className="nokia-page-header">
          <div className="nokia-header-info">
            <h1 className="nokia-page-title">Nokia Sites Review</h1>
            <p className="nokia-page-subtitle">
              {sitesWithReviews.length} sites
              {activePhase && activePhase !== 'ALL' && ` - ${activePhase}`}
            </p>
          </div>

          <SiteStats sites={sitesWithReviews} />
        </div>

        <SiteFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statuses={uniqueStatuses}
          contractorFilter={contractorFilter}
          onContractorChange={setContractorFilter}
          contractors={uniqueContractors}
          phaseFilter={activePhase}
          onPhaseChange={setActivePhase}
          phases={phases}
          showPhase={true}
          showPriority={false}
          variant="nokia"
          searchPlaceholder="Search by Site ID, Name, or Location..."
        />

        {loading ? (
          <div className="nokia-loading">
            <div className="nokia-spinner"></div>
            <p>Loading sites...</p>
          </div>
        ) : sitesWithReviews.length === 0 ? (
          <div className="nokia-empty">
            <p>No sites found matching your filters</p>
          </div>
        ) : (
          <div className="nokia-cards-grid">
            {sitesWithReviews.map((site) => (
              <SiteCard
                key={`${site.site_id}-${site.phase_name}`}
                site={site}
                onReview={handleReview}
              />
            ))}
          </div>
        )}

        {/* Rejection Modal */}
        {reviewModal && (
          <RejectionModal
            site={reviewModal}
            user={user}
            onClose={() => setReviewModal(null)}
            onSave={handleSaveReview}
          />
        )}
      </div>
    </MainLayout>
  )
}

export default NokiaSites
