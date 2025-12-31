import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import Card from '../../components/UI/Card';
import './Backups.css';

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [settings, setSettings] = useState({
    enabled: true,
    frequency: 'daily',
    keepDays: 30,
    lastBackup: null
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      let backupList = [];
      let backupSettings = settings;

      if (window.electron?.getBackups) {
        backupList = await window.electron.getBackups();
        backupSettings = await window.electron.getBackupSettings();
      } else {
        const res = await fetch('http://localhost:3001/api/backups');
        backupList = await res.json();
        const settingsRes = await fetch('http://localhost:3001/api/backup-settings');
        backupSettings = await settingsRes.json();
      }

      setBackups(Array.isArray(backupList) ? backupList : []);
      setSettings(backupSettings);
    } catch (error) {
      console.error('Error loading backups:', error);
      showMessage('Error loading backups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);

      let result;
      if (window.electron?.createBackup) {
        result = await window.electron.createBackup('Manual backup from UI');
      } else {
        const res = await fetch('http://localhost:3001/api/backups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'Manual backup from UI' })
        });
        result = await res.json();
      }

      if (result.success) {
        showMessage('Backup created successfully!');
        loadData();
      } else {
        showMessage(result.error || 'Failed to create backup', 'error');
      }
    } catch (error) {
      showMessage('Error creating backup', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backupName) => {
    if (!window.confirm(`Are you sure you want to restore "${backupName}"?\n\nThis will replace the current database. A backup of the current state will be created first.`)) {
      return;
    }

    try {
      let result;
      if (window.electron?.restoreBackup) {
        result = await window.electron.restoreBackup(backupName);
      } else {
        const res = await fetch(`http://localhost:3001/api/backups/restore/${backupName}`, {
          method: 'POST'
        });
        result = await res.json();
      }

      if (result.success) {
        showMessage('Backup restored! Please restart the application.');
        loadData();
      } else {
        showMessage(result.error || 'Failed to restore backup', 'error');
      }
    } catch (error) {
      showMessage('Error restoring backup', 'error');
    }
  };

  const handleDelete = async (backupName) => {
    if (!window.confirm(`Are you sure you want to delete "${backupName}"?`)) {
      return;
    }

    try {
      let result;
      if (window.electron?.deleteBackup) {
        result = await window.electron.deleteBackup(backupName);
      } else {
        const res = await fetch(`http://localhost:3001/api/backups/${backupName}`, {
          method: 'DELETE'
        });
        result = await res.json();
      }

      if (result.success) {
        showMessage('Backup deleted');
        loadData();
      } else {
        showMessage(result.error || 'Failed to delete backup', 'error');
      }
    } catch (error) {
      showMessage('Error deleting backup', 'error');
    }
  };

  const handleSettingsChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      if (window.electron?.updateBackupSettings) {
        await window.electron.updateBackupSettings(newSettings);
      } else {
        await fetch('http://localhost:3001/api/backup-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings)
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <MainLayout>
      <div className="backups-page">
        <div className="page-header">
          <h1>Backup Management</h1>
          <p>Manage database backups and restore points</p>
        </div>

        {message && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Backup Settings */}
        <Card title="Backup Settings" subtitle="Configure automatic backups">
          <div className="backup-settings">
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleSettingsChange('enabled', e.target.checked)}
                />
                Enable automatic backups
              </label>
            </div>

            <div className="setting-row">
              <label>Backup frequency:</label>
              <select
                value={settings.frequency}
                onChange={(e) => handleSettingsChange('frequency', e.target.value)}
                disabled={!settings.enabled}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="setting-row">
              <label>Keep backups for:</label>
              <select
                value={settings.keepDays}
                onChange={(e) => handleSettingsChange('keepDays', parseInt(e.target.value))}
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>

            {settings.lastBackup && (
              <div className="last-backup-info">
                Last backup: {formatDate(settings.lastBackup)}
              </div>
            )}
          </div>
        </Card>

        {/* Create Backup */}
        <Card title="Create Backup" subtitle="Create a new backup now">
          <button
            className="btn-create-backup"
            onClick={handleCreateBackup}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create Backup Now'}
          </button>
        </Card>

        {/* Backup List */}
        <Card title="Backup History" subtitle={`${backups.length} backups available`}>
          {loading ? (
            <div className="loading">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="no-backups">
              <p>No backups found</p>
              <p>Create your first backup using the button above</p>
            </div>
          ) : (
            <div className="backups-table-container">
              <table className="backups-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Size</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.name}>
                      <td className="backup-name">{backup.name}</td>
                      <td>{formatDate(backup.createdAt)}</td>
                      <td>{formatSize(backup.size)}</td>
                      <td>{backup.description}</td>
                      <td className="backup-actions">
                        <button
                          className="btn-restore"
                          onClick={() => handleRestore(backup.name)}
                          title="Restore this backup"
                        >
                          Restore
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(backup.name)}
                          title="Delete this backup"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

export default Backups;
