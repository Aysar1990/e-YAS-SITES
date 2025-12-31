/**
 * Settings Page V2.1 - Compact Layout
 * Grid-based organized settings cards
 */

import { MainLayout } from '../../../components/Layout'
import useSettings from './hooks/useSettings'
import { useSettingsHandlers } from './hooks/useSettingsHandlers'
import { useSettingsEffects } from './hooks/useSettingsEffects'
import GeneralSettings from './components/GeneralSettings'
import ServerModeSettings from './components/ServerModeSettings'
import DatabaseSettings from './components/DatabaseSettings'
import UserManagement from './components/UserManagement'
import RolePermissions from './components/RolePermissions'
import NotificationSettings from './components/NotificationSettings'
import SettingsFooter from './components/SettingsFooter'
import '../Settings.css'

const Settings = () => {
  const settings = useSettings()
  const {
    t, phases, canImport, message, showMessage, setMessage,
    formData, setFormData, saving, setSaving, updateSettings,
    serverMode, setServerMode, serverIP, setServerIP,
    connectedClients, setConnectedClients, serverLoading, setServerLoading,
    users, setUsers, contractorsList, setContractorsList,
    newUser, setNewUser, userLoading, setUserLoading, fetchUsers,
    permissions, setPermissions, permissionsSaving, setPermissionsSaving,
    notificationSettings, setNotificationSettings, notificationSaving, setNotificationSaving,
    firebaseConfig, setFirebaseConfig, firebaseStatus, setFirebaseStatus,
    firebaseSyncing, setFirebaseSyncing, firebaseSaving, setFirebaseSaving,
    firebaseSites, firebaseConnected, updateFirebaseSite, addFirebaseSite,
    fileInputRef, importStep, setImportStep, importFile, setImportFile,
    importComparison, setImportComparison, importProgress, setImportProgress,
    importError, setImportError, parseExcelFile, compareData
  } = settings

  // Initialize effects
  useSettingsEffects({
    setServerMode, setServerIP, setConnectedClients,
    setContractorsList, setPermissions, setNotificationSettings,
    setFirebaseConfig, setFirebaseStatus, fetchUsers
  })

  // Initialize handlers
  const handlers = useSettingsHandlers({
    formData, setFormData, setSaving, setMessage, showMessage, updateSettings, t,
    serverMode, setServerMode, setServerIP, setConnectedClients, setServerLoading,
    users, setUsers, newUser, setNewUser, setUserLoading, fetchUsers,
    permissions, setPermissions, setPermissionsSaving,
    notificationSettings, setNotificationSettings, setNotificationSaving,
    firebaseConfig, setFirebaseConfig, setFirebaseStatus,
    setFirebaseSyncing, setFirebaseSaving, firebaseSites,
    updateFirebaseSite, addFirebaseSite,
    fileInputRef, importComparison, setImportStep, setImportFile,
    setImportComparison, setImportProgress, setImportError,
    parseExcelFile, compareData, canImport
  })

  return (
    <MainLayout>
      <div className="settings-page">
        <h1 className="page-title">{t('settings.title')}</h1>

        {/* Row 1: General & Server */}
        <GeneralSettings
          t={t}
          formData={formData}
          setFormData={setFormData}
          phases={phases}
          saving={saving}
          message={message}
          onSave={handlers.handleSave}
          onSelectFile={handlers.handleSelectFile}
        />

        <ServerModeSettings
          t={t}
          serverMode={serverMode}
          serverIP={serverIP}
          connectedClients={connectedClients}
          serverLoading={serverLoading}
          onToggleServer={handlers.handleToggleServer}
          onCopyIP={() => handlers.copyIP(serverIP)}
        />

        {/* Row 2: Database & Users */}
        <DatabaseSettings onShowMessage={showMessage} />

        <UserManagement
          users={users}
          contractorsList={contractorsList}
          newUser={newUser}
          setNewUser={setNewUser}
          userLoading={userLoading}
          onCreateUser={handlers.handleCreateUser}
          onDeleteUser={handlers.handleDeleteUser}
        />

        {/* Row 3: Permissions & Notifications */}
        <RolePermissions
          permissions={permissions}
          permissionsSaving={permissionsSaving}
          onTogglePermission={handlers.handleTogglePermission}
          onSavePermissions={handlers.handleSavePermissions}
        />

        <NotificationSettings
          notificationSettings={notificationSettings}
          notificationSaving={notificationSaving}
          onToggleNotification={handlers.handleToggleNotification}
          onSaveSettings={handlers.handleSaveNotificationSettings}
          onTestNotification={handlers.handleTestNotification}
        />

        {/* Footer spans full width */}
        <SettingsFooter />
      </div>
    </MainLayout>
  )
}

export default Settings
