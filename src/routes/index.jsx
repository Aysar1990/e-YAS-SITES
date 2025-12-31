import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Pages (Always loaded)
import Login from '../pages/Login/Login'
import NotFound from '../pages/NotFound/NotFound'

// Admin Pages (Eager loading for frequently used pages)
import AdminDashboard from '../pages/Admin/AdminDashboard'
import Settings from '../pages/Admin/Settings'
import Contractors from '../pages/Admin/Contractors'
import Sites from '../pages/Admin/Sites'

// Admin Pages (Lazy loading for heavy pages)
const Reports = lazy(() => import('../pages/Admin/Reports/'))
const Backups = lazy(() => import('../pages/Admin/Backups'))
const MapPage = lazy(() => import('../pages/Admin/Map'))
const ImportPage = lazy(() => import('../pages/Admin/ImportPage'))
const SpreadsheetView = lazy(() => import('../pages/Admin/SpreadsheetView'))
const TransformImport = lazy(() => import('../pages/Admin/TransformImport'))
const ChangeRequests = lazy(() => import('../pages/Admin/ChangeRequests'))

// Management Pages - Now using Admin pages (same views, no settings)

// Contractor Pages (Lazy loading)
const ContractorDashboard = lazy(() => import('../pages/Contractor/ContractorDashboard'))
const ContractorSites = lazy(() => import('../pages/Contractor/ContractorSites'))
const ContractorRejections = lazy(() => import('../pages/Contractor/ContractorRejections'))

// Nokia Engineer Pages (Lazy loading)
const NokiaDashboard = lazy(() => import('../pages/Nokia/NokiaDashboard'))
const NokiaSites = lazy(() => import('../pages/Nokia/NokiaSites'))
const NokiaReports = lazy(() => import('../pages/Nokia/NokiaReports'))
const Ghirbal = lazy(() => import('../pages/Nokia/Ghirbal'))
const ClearTSSR = lazy(() => import('../pages/Nokia/ClearTSSR'))

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div className="loading-screen" style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" style={{
        width: '50px',
        height: '50px',
        border: '5px solid rgba(143, 217, 217, 0.2)',
        borderTop: '5px solid #8FD9D9',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      <p style={{ color: '#8FD9D9', fontSize: '14px' }}>Loading...</p>
    </div>
  </div>
)

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    return <Navigate to={getDefaultRoute(user.role)} replace />
  }

  return children
}

// Get default route based on role
const getDefaultRoute = (role) => {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'management':
      return '/management'
    case 'contractor':
      return '/contractor'
    case 'nokia_engineer':
      return '/nokia'
    default:
      return '/login'
  }
}

// Main Routes Component
const AppRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Login />
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contractors"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Contractors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sites"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Sites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/map"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ghirbal"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Ghirbal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clear-tssr"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ClearTSSR />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/backups"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Backups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/import"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ImportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/spreadsheet"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SpreadsheetView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transform-import"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <TransformImport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/change-requests"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ChangeRequests />
          </ProtectedRoute>
        }
      />

      {/* Management Routes - Same as Admin but without Settings */}
      <Route
        path="/management"
        element={
          <ProtectedRoute allowedRoles={['management']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/contractors"
        element={
          <ProtectedRoute allowedRoles={['management']}>
            <Contractors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/sites"
        element={
          <ProtectedRoute allowedRoles={['management']}>
            <Sites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/map"
        element={
          <ProtectedRoute allowedRoles={['management']}>
            <MapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/reports"
        element={
          <ProtectedRoute allowedRoles={['management']}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/spreadsheet"
        element={
          <ProtectedRoute allowedRoles={['management']}>
            <SpreadsheetView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/transform-import"
        element={
          <ProtectedRoute allowedRoles={['management']}>
            <TransformImport />
          </ProtectedRoute>
        }
      />

      {/* Contractor Routes */}
      <Route
        path="/contractor"
        element={
          <ProtectedRoute allowedRoles={['contractor']}>
            <ContractorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contractor/sites"
        element={
          <ProtectedRoute allowedRoles={['contractor']}>
            <ContractorSites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contractor/map"
        element={
          <ProtectedRoute allowedRoles={['contractor']}>
            <MapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contractor/rejections"
        element={
          <ProtectedRoute allowedRoles={['contractor']}>
            <ContractorRejections />
          </ProtectedRoute>
        }
      />

      {/* Nokia Engineer Routes */}
      <Route
        path="/nokia"
        element={
          <ProtectedRoute allowedRoles={['nokia_engineer']}>
            <NokiaDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nokia/sites"
        element={
          <ProtectedRoute allowedRoles={['nokia_engineer']}>
            <NokiaSites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nokia/map"
        element={
          <ProtectedRoute allowedRoles={['nokia_engineer']}>
            <MapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nokia/reports"
        element={
          <ProtectedRoute allowedRoles={['nokia_engineer']}>
            <NokiaReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nokia/ghirbal"
        element={
          <ProtectedRoute allowedRoles={['nokia_engineer']}>
            <Ghirbal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nokia/clear-tssr"
        element={
          <ProtectedRoute allowedRoles={['nokia_engineer']}>
            <ClearTSSR />
          </ProtectedRoute>
        }
      />


      {/* Root redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={getDefaultRoute(user.role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 - Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  )
}

export default AppRoutes
