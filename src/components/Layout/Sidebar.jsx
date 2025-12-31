import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { BrandLogo } from '../Brand'
import './Sidebar.css'

const Sidebar = ({ collapsed = false, onToggle }) => {
  const { t } = useTranslation()
  const { user } = useAuth()

  const adminLinks = [
    { path: '/admin', icon: '📊', label: t('nav.dashboard'), end: true },
    { path: '/admin/contractors', icon: '👥', label: t('nav.contractors') },
    { path: '/admin/sites', icon: '📍', label: t('nav.sites') },
    { path: '/admin/spreadsheet', icon: '📋', label: 'Spreadsheet View' },
    { path: '/admin/change-requests', icon: '📝', label: 'Change Requests' },
    { path: '/admin/map', icon: '🗺️', label: t('nav.map') || 'Map' },
    { path: '/admin/reports', icon: '📈', label: t('nav.reports') },
    { path: '/admin/ghirbal', icon: '🔍', label: 'Ghirbal' },
    { path: '/admin/clear-tssr', icon: '✅', label: 'Clear TSSR' },
    { path: '/admin/backups', icon: '💾', label: 'Backups' },
    { path: '/admin/import', icon: '📥', label: t('nav.import', 'Import') },
    { path: '/admin/transform-import', icon: '🔄', label: 'Transform Import' },
    { path: '/admin/settings', icon: '⚙️', label: t('nav.settings') },
  ]

  const managementLinks = [
    { path: '/management', icon: '📊', label: t('nav.dashboard'), end: true },
    { path: '/management/contractors', icon: '👥', label: t('nav.contractors') },
    { path: '/management/sites', icon: '📍', label: t('nav.sites') },
    { path: '/management/spreadsheet', icon: '📋', label: 'Spreadsheet View' },
    { path: '/management/map', icon: '🗺️', label: t('nav.map') || 'Map' },
    { path: '/management/reports', icon: '📈', label: t('nav.reports') },
    { path: '/management/transform-import', icon: '🔄', label: 'Transform Import' },
  ]

  const contractorLinks = [
    { path: '/contractor', icon: '📊', label: t('nav.dashboard'), end: true },
    { path: '/contractor/sites', icon: '📍', label: t('nav.sites') },
    { path: '/contractor/map', icon: '🗺️', label: t('nav.map') || 'Map' },
    { path: '/contractor/rejections', icon: '❌', label: t('nav.rejections') },
  ]

  const nokiaLinks = [
    { path: '/nokia', icon: '📊', label: t('nav.dashboard'), end: true },
    { path: '/nokia/sites', icon: '📍', label: t('nav.sites') },
    { path: '/nokia/map', icon: '🗺️', label: t('nav.map') || 'Map' },
    { path: '/nokia/reports', icon: '📈', label: t('nav.reports') },
    { path: '/nokia/ghirbal', icon: '🔍', label: 'Ghirbal' },
    { path: '/nokia/clear-tssr', icon: '✅', label: 'Clear TSSR' },
  ]

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return adminLinks
      case 'management':
        return managementLinks
      case 'contractor':
        return contractorLinks
      case 'nokia_engineer':
        return nokiaLinks
      default:
        return []
    }
  }

  const links = getLinks()

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Toggle Button */}
      <button 
        className="sidebar-toggle"
        onClick={onToggle}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? '»' : '«'}
      </button>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{link.icon}</span>
            {!collapsed && <span className="sidebar-label">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="footer-brand">
            <BrandLogo variant="sidebar" />
          </div>
          <div className="powered-by">
            <span className="powered-text">Powered by</span>
            <span className="powered-name">YAS MCPs</span>
            <span className="powered-slogan">Your AI System</span>
          </div>
          <div className="footer-copyright">© 2025</div>
        </div>
      )}

      {collapsed && (
        <div className="sidebar-footer collapsed">
          <BrandLogo variant="minimal" />
        </div>
      )}
    </aside>
  )
}

export default Sidebar
