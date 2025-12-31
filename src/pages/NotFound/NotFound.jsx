// NotFound Page - 404 Error Page

import { useNavigate } from 'react-router-dom'
import './NotFound.css'

const NotFound = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="not-found" dir="rtl">
      <div className="not-found__content">
        <div className="not-found__code">404</div>

        <h1 className="not-found__title">الصفحة غير موجودة</h1>

        <p className="not-found__message">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        <div className="not-found__illustration">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="200"
            height="200"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>

        <div className="not-found__actions">
          <button
            className="not-found__button not-found__button--primary"
            onClick={handleGoHome}
          >
            العودة للرئيسية
          </button>
          <button
            className="not-found__button not-found__button--secondary"
            onClick={handleGoBack}
          >
            الرجوع للخلف
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
