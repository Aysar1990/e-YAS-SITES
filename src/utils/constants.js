// Constants for YAS TSSR Monitor Application

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGEMENT: 'management',
  CONTRACTOR: 'contractor',
}

// Site Status
export const SITE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  ON_HOLD: 'on_hold',
}

// Site Status Labels (Arabic)
export const SITE_STATUS_LABELS = {
  pending: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  rejected: 'مرفوض',
  on_hold: 'متوقف',
}

// Site Status Colors
export const SITE_STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#FF8566',
  completed: '#8FD9D9',
  rejected: '#ef4444',
  on_hold: '#6b7280',
}

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
}

// Priority Labels (Arabic)
export const PRIORITY_LABELS = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
}

// Priority Colors
export const PRIORITY_COLORS = {
  low: '#8FD9D9',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
}

// Rejection Reasons
export const REJECTION_REASONS = {
  INCOMPLETE_DATA: 'incomplete_data',
  QUALITY_ISSUES: 'quality_issues',
  SAFETY_CONCERNS: 'safety_concerns',
  DOCUMENTATION_MISSING: 'documentation_missing',
  TECHNICAL_ISSUES: 'technical_issues',
  OTHER: 'other',
}

// Rejection Reasons Labels (Arabic)
export const REJECTION_REASONS_LABELS = {
  incomplete_data: 'بيانات غير مكتملة',
  quality_issues: 'مشاكل في الجودة',
  safety_concerns: 'مخاوف تتعلق بالسلامة',
  documentation_missing: 'وثائق ناقصة',
  technical_issues: 'مشاكل تقنية',
  other: 'أخرى',
}

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'DD MMMM YYYY',
  WITH_TIME: 'DD/MM/YYYY HH:mm',
  TIME_ONLY: 'HH:mm',
  ISO: 'YYYY-MM-DD',
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
}

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'tssr_auth_token',  // Centralized auth token key - use this everywhere
  USER: 'tssr_user',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  MODE: 'tssr_mode',
  SERVER_IP: 'tssr_server_ip',
}

// Auth token key constant for direct import
export const AUTH_TOKEN_KEY = 'tssr_auth_token'
export const AUTH_USER_KEY = 'tssr_user'

// Theme
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}

// Languages
export const LANGUAGES = {
  AR: 'ar',
  EN: 'en',
}

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  SITES: {
    LIST: '/sites',
    DETAIL: '/sites/:id',
    CREATE: '/sites',
    UPDATE: '/sites/:id',
    DELETE: '/sites/:id',
  },
  CONTRACTORS: {
    LIST: '/contractors',
    DETAIL: '/contractors/:id',
    CREATE: '/contractors',
    UPDATE: '/contractors/:id',
    DELETE: '/contractors/:id',
  },
  REPORTS: {
    LIST: '/reports',
    GENERATE: '/reports/generate',
    EXPORT: '/reports/export',
  },
}
