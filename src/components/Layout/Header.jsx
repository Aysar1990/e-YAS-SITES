import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useTranslation } from 'react-i18next'
import Button from '../UI/Button'
import { BrandLogo } from '../Brand'
import NotificationBell from '../Notifications/NotificationBell'
import ConnectionIndicator from '../ConnectionIndicator'
import './Header.css'

const Header = () => {
  const { t } = useTranslation()
  const { language, toggleLanguage } = useLanguage()
  const { user, logout } = useAuth()
  const { syncStatus, manualSync, loading } = useData()

  const handleSync = async () => {
    await manualSync()
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'management':
        return 'Management'
      case 'contractor':
        return 'Contractor'
      default:
        return role
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <BrandLogo variant="header" />
      </div>

      <div className="header-center">
        {syncStatus && (
          <div className={`sync-status ${syncStatus.success ? 'success' : 'error'}`}>
            <span className="sync-dot"></span>
            <span className="sync-text">
              {syncStatus.success
                ? `${syncStatus.recordsSynced} ${t('sync.records')}`
                : t('sync.syncError')}
            </span>
          </div>
        )}
      </div>

      <div className="header-right">
        {/* Connection Status Indicator */}
        <ConnectionIndicator />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          loading={loading}
          className="sync-btn"
        >
          🔄 {t('sync.syncNow')}
        </Button>

        <NotificationBell />

        <button className="lang-toggle" onClick={toggleLanguage}>
          {language === 'en' ? 'العربية' : 'English'}
        </button>

        <div className="user-info">
          <span className="user-name">{user?.username}</span>
          <span className="user-role">{getRoleBadge(user?.role)}</span>
        </div>

        <Button variant="error" size="sm" onClick={logout}>
          {t('nav.logout')}
        </Button>
      </div>
    </header>
  )
}

export default Header
