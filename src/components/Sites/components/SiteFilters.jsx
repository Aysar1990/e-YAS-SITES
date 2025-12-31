/**
 * Shared site filter controls component
 * @module components/Sites/components/SiteFilters
 */

import { useTranslation } from 'react-i18next'
import { Card } from '../../UI'
import { SavedViewsDropdown } from './SavedViewsDropdown'

/**
 * Site filters component
 * @param {Object} props - Component props
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Search change handler
 * @param {string} props.statusFilter - Current status filter
 * @param {Function} props.onStatusChange - Status change handler
 * @param {Array} props.statuses - Available statuses
 * @param {string} props.priorityFilter - Current priority filter
 * @param {Function} props.onPriorityChange - Priority change handler
 * @param {Array} props.priorities - Available priorities
 * @param {string} props.contractorFilter - Current contractor filter
 * @param {Function} props.onContractorChange - Contractor change handler
 * @param {Array} props.contractors - Available contractors
 * @param {string} props.phaseFilter - Current phase filter
 * @param {Function} props.onPhaseChange - Phase change handler
 * @param {Array} props.phases - Available phases
 * @param {string} props.className - Additional CSS class
 * @param {string} props.variant - 'admin' | 'nokia' for styling
 */
export const SiteFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statuses = [],
  priorityFilter,
  onPriorityChange,
  priorities = [],
  contractorFilter,
  onContractorChange,
  contractors = [],
  phaseFilter,
  onPhaseChange,
  phases = [],
  governorateFilter,
  onGovernorateChange,
  governorates = [],
  className = '',
  variant = 'admin',
  showPhase = false,
  showContractor = true,
  showPriority = true,
  showGovernorate = false,
  searchPlaceholder,
  // Saved Views Props
  savedViews = [],
  onLoadView,
  onSaveView,
  onDeleteView,
  showSavedViews = false
}) => {
  const { t } = useTranslation()
  const isNokia = variant === 'nokia'
  const baseClass = isNokia ? 'nokia-filters' : 'filters'
  const searchClass = isNokia ? 'nokia-search-input' : 'search-input'
  const selectClass = isNokia ? 'nokia-filter-select' : 'filter-select'

  return (
    <Card className={`${isNokia ? 'nokia-filters-card' : 'filters-card'} ${className}`}>
      <div className={baseClass}>

        {/* Saved Views Dropdown (Rendered First for Layout) */}
        {showSavedViews && (
          <div className="filters-actions">
            <SavedViewsDropdown
              savedViews={savedViews}
              onLoadView={onLoadView}
              onSaveView={onSaveView}
              onDeleteView={onDeleteView}
              className={isNokia ? 'nokia-saved-views' : ''}
            />
          </div>
        )}

        {/* Search Box */}
        <div className={isNokia ? 'nokia-search-box' : 'search-box'}>
          <input
            type="text"
            placeholder={searchPlaceholder || t('sites.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={searchClass}
          />
        </div>

        {/* Phase Filter */}
        {showPhase && phases.length > 0 && (
          <select
            value={phaseFilter || 'ALL'}
            onChange={(e) => onPhaseChange(e.target.value)}
            className={selectClass}
          >
            <option value="ALL">{t('sites.allPhases', 'All Phases')}</option>
            {phases.map(phase => (
              <option key={phase.phase_name || phase} value={phase.phase_name || phase}>
                {phase.phase_name || phase}
              </option>
            ))}
          </select>
        )}

        {/* Contractor Filter */}
        {showContractor && contractors.length > 0 && (
          <select
            value={contractorFilter}
            onChange={(e) => onContractorChange(e.target.value)}
            className={selectClass}
          >
            <option value="all">{t('sites.allContractors', 'All Contractors')}</option>
            {contractors.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className={selectClass}
        >
          <option value="all">{t('sites.allStatuses')}</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {/* Priority Filter */}
        {showPriority && priorities.length > 0 && (
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className={selectClass}
          >
            <option value="all">{t('sites.allPriorities')}</option>
            {priorities.map(p => (
              <option key={p} value={String(p)}>{t('sites.priority')} {p}</option>
            ))}
          </select>
        )}

        {/* Governorate Filter */}
        {showGovernorate && governorates.length > 0 && (
          <select
            value={governorateFilter}
            onChange={(e) => onGovernorateChange(e.target.value)}
            className={selectClass}
          >
            <option value="all">{t('sites.allGovernorates', 'All Governorates')}</option>
            {governorates.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        )}
      </div>
    </Card>
  )
}

export default SiteFilters
