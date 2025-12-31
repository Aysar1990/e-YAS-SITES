import { createContext, useContext, useState, useEffect } from 'react'
import i18n from '../i18n'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ar')
  const [direction, setDirection] = useState('rtl')

  useEffect(() => {
    const stored = localStorage.getItem('tssr_language') || 'ar'
    changeLanguage(stored)
  }, [])

  const changeLanguage = (lang) => {
    setLanguage(lang)
    const dir = lang === 'ar' ? 'rtl' : 'ltr'
    setDirection(dir)
    i18n.changeLanguage(lang)
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', lang)
    localStorage.setItem('tssr_language', lang)
  }

  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'ar' : 'en')
  }

  const value = {
    language,
    direction,
    isRTL: direction === 'rtl',
    changeLanguage,
    toggleLanguage,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export default LanguageContext
