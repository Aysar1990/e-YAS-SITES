import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTranslation } from 'react-i18next'
import Button from '../../components/UI/Button'
import { BrandLogo } from '../../components/Brand'
import './Login.css'

const Login = () => {
  const { t } = useTranslation()
  const { login } = useAuth()
  const { language, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(username, password)

      if (result.success) {
        // Navigate based on role
        switch (result.user.role) {
          case 'admin':
            navigate('/admin')
            break
          case 'management':
            navigate('/management')
            break
          case 'contractor':
            navigate('/contractor')
            break
          default:
            navigate('/')
        }
      } else {
        setError(result.error || t('login.error'))
      }
    } catch (err) {
      setError(t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-grid"></div>
        <div className="bg-glow bg-glow-1"></div>
        <div className="bg-glow bg-glow-2"></div>
      </div>

      <div className="login-card fade-in">
        <div className="login-header">
          <BrandLogo variant="login" />
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">{t('login.username')}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('login.username')}
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.password')}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message shake">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            fullWidth
          >
            {t('login.submit')}
          </Button>
        </form>

        <div className="login-footer">
          <button className="lang-switch" onClick={toggleLanguage}>
            {language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>
      </div>

      <div className="login-info">
        <div className="info-card">
          <h3>Demo Accounts</h3>
          <div className="info-item">
            <span className="role-badge admin">Admin</span>
            <code>admin / admin</code>
          </div>
          <div className="info-item">
            <span className="role-badge management">Management</span>
            <code>management / management</code>
          </div>
          <div className="info-item">
            <span className="role-badge contractor">Contractor</span>
            <code>subcon / subcon</code>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
