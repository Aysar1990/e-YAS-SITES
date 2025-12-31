import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './MainLayout.css'

const MainLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className={`main-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Header />
      <div className="layout-body">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
