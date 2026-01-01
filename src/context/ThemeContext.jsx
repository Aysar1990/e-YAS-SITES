/**
 * ThemeContext - نظام الثيمات
 * يدعم 4 ثيمات: dark, yas, light, custom
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// تعريف الثيمات
const THEMES = {
  dark: {
    name: 'Dark',
    nameAr: 'داكن',
    icon: '🌙',
    colors: {
      primary: '#8FD9D9',
      primaryHover: '#7BC9C9',
      accent: '#FF8566',
      accentHover: '#FF7052',
      background: '#0f172a',
      backgroundAlt: '#0c1322',
      surface: '#1e293b',
      surfaceHover: '#263548',
      border: 'rgba(143, 217, 217, 0.2)',
      borderHover: 'rgba(143, 217, 217, 0.4)',
      text: '#e2e8f0',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      success: '#8FD9D9',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#FF8566'
    }
  },
  yas: {
    name: 'YAS',
    nameAr: 'ياس',
    icon: '🌊',
    colors: {
      primary: '#8FD9D9',
      primaryHover: '#7BC9C9',
      accent: '#FF8566',
      accentHover: '#FF7052',
      background: '#0a1628',
      backgroundAlt: '#071020',
      surface: '#112240',
      surfaceHover: '#1a3050',
      border: 'rgba(143, 217, 217, 0.25)',
      borderHover: 'rgba(143, 217, 217, 0.45)',
      text: '#ccd6f6',
      textSecondary: '#8892b0',
      textMuted: '#5c6b8a',
      success: '#64ffda',
      warning: '#ffd700',
      error: '#ff6b6b',
      info: '#57cbff'
    }
  },
  light: {
    name: 'Light',
    nameAr: 'فاتح',
    icon: '☀️',
    colors: {
      primary: '#0891b2',
      primaryHover: '#0e7490',
      accent: '#ea580c',
      accentHover: '#c2410c',
      background: '#f8fafc',
      backgroundAlt: '#f1f5f9',
      surface: '#ffffff',
      surfaceHover: '#f8fafc',
      border: 'rgba(8, 145, 178, 0.2)',
      borderHover: 'rgba(8, 145, 178, 0.4)',
      text: '#1e293b',
      textSecondary: '#475569',
      textMuted: '#64748b',
      success: '#6ECECE',
      warning: '#d97706',
      error: '#dc2626',
      info: '#FF5533'
    }
  },
  custom: {
    name: 'Custom',
    nameAr: 'مخصص',
    icon: '🎨',
    colors: {
      primary: '#8FD9D9',
      primaryHover: '#7BC9C9',
      accent: '#FF8566',
      accentHover: '#FF7052',
      background: '#0f172a',
      backgroundAlt: '#0c1322',
      surface: '#1e293b',
      surfaceHover: '#263548',
      border: 'rgba(143, 217, 217, 0.2)',
      borderHover: 'rgba(143, 217, 217, 0.4)',
      text: '#e2e8f0',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      success: '#8FD9D9',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#FF8566'
    }
  }
}

// مفتاح التخزين المحلي
const THEME_STORAGE_KEY = 'tssr-theme'
const CUSTOM_COLORS_KEY = 'tssr-custom-colors'

// إنشاء Context
const ThemeContext = createContext(null)

/**
 * ThemeProvider Component
 */
export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('dark')
  const [customColors, setCustomColors] = useState(THEMES.custom.colors)
  const [isLoaded, setIsLoaded] = useState(false)

  // تحميل الثيم المحفوظ عند بدء التشغيل
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      const savedCustomColors = localStorage.getItem(CUSTOM_COLORS_KEY)

      if (savedTheme && THEMES[savedTheme]) {
        setCurrentTheme(savedTheme)
      }

      if (savedCustomColors) {
        const parsed = JSON.parse(savedCustomColors)
        setCustomColors(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.warn('Error loading theme from storage:', error)
    }
    setIsLoaded(true)
  }, [])

  // تطبيق الثيم على CSS Variables
  useEffect(() => {
    if (!isLoaded) return

    const colors = currentTheme === 'custom' ? customColors : THEMES[currentTheme].colors
    const root = document.documentElement

    // تطبيق كل الألوان كـ CSS Variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${kebabCase(key)}`, value)
    })

    // إضافة class للثيم على body
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim()
    document.body.classList.add(`theme-${currentTheme}`)

    // حفظ الثيم
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme)
  }, [currentTheme, customColors, isLoaded])

  // تغيير الثيم
  const setTheme = useCallback((themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName)
    }
  }, [])

  // تحديث لون مخصص
  const updateCustomColor = useCallback((colorKey, value) => {
    setCustomColors(prev => {
      const updated = { ...prev, [colorKey]: value }
      localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // إعادة تعيين الألوان المخصصة للافتراضي
  const resetCustomColors = useCallback(() => {
    setCustomColors(THEMES.dark.colors)
    localStorage.removeItem(CUSTOM_COLORS_KEY)
  }, [])

  // الحصول على الألوان الحالية
  const getColors = useCallback(() => {
    return currentTheme === 'custom' ? customColors : THEMES[currentTheme].colors
  }, [currentTheme, customColors])

  // الحصول على معلومات الثيم الحالي
  const getThemeInfo = useCallback(() => {
    return {
      ...THEMES[currentTheme],
      colors: getColors()
    }
  }, [currentTheme, getColors])

  const value = {
    // الحالة
    currentTheme,
    customColors,
    themes: THEMES,
    isLoaded,

    // الدوال
    setTheme,
    updateCustomColor,
    resetCustomColors,
    getColors,
    getThemeInfo,

    // اختصارات
    isDark: currentTheme === 'dark' || currentTheme === 'yas',
    isLight: currentTheme === 'light',
    isCustom: currentTheme === 'custom'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook للوصول للثيم
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * تحويل camelCase إلى kebab-case
 */
function kebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export default ThemeContext
