const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class BackupService {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.backupDir = path.join(app.getPath('userData'), 'backups');
    this.settings = {
      enabled: true,
      frequency: 'daily', // daily, weekly
      keepDays: 30,
      lastBackup: null
    };

    this.ensureBackupDir();
    this.loadSettings();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  loadSettings() {
    const settingsPath = path.join(this.backupDir, 'backup-settings.json');
    if (fs.existsSync(settingsPath)) {
      try {
        this.settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      } catch (error) {
        console.error('Error loading backup settings:', error);
      }
    }
  }

  saveSettings() {
    const settingsPath = path.join(this.backupDir, 'backup-settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(this.settings, null, 2));
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    return this.settings;
  }

  getSettings() {
    return this.settings;
  }

  createBackup(description = 'Manual backup') {
    try {
      // Check if source database exists
      if (!fs.existsSync(this.dbPath)) {
        console.log(`Backup skipped: Database not found at ${this.dbPath}`);
        return { success: false, error: 'Database file not found' };
      }

      // Ensure backup directory exists
      this.ensureBackupDir();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupName);

      // Copy database file
      fs.copyFileSync(this.dbPath, backupPath);

      // Update last backup time
      this.settings.lastBackup = new Date().toISOString();
      this.saveSettings();

      // Create metadata file
      const metadata = {
        name: backupName,
        description,
        createdAt: new Date().toISOString(),
        size: fs.statSync(backupPath).size,
        dbPath: this.dbPath
      };
      fs.writeFileSync(
        backupPath.replace('.db', '.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`Backup created: ${backupPath}`);

      return {
        success: true,
        backup: {
          name: backupName,
          path: backupPath,
          size: metadata.size,
          createdAt: metadata.createdAt,
          description
        }
      };
    } catch (error) {
      console.error('Error creating backup:', error);
      return { success: false, error: error.message };
    }
  }

  getBackups() {
    try {
      this.ensureBackupDir();

      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.endsWith('.db'));

      const backups = files.map(file => {
        const filePath = path.join(this.backupDir, file);
        const metaPath = filePath.replace('.db', '.json');
        const stats = fs.statSync(filePath);

        let metadata = {};
        if (fs.existsSync(metaPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          } catch (e) {}
        }

        return {
          name: file,
          path: filePath,
          size: stats.size,
          createdAt: metadata.createdAt || stats.mtime.toISOString(),
          description: metadata.description || 'No description'
        };
      });

      return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }

  restoreBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);

      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup not found' };
      }

      // Create a backup of current database before restoring
      this.createBackup('Auto-backup before restore');

      // Restore the backup
      fs.copyFileSync(backupPath, this.dbPath);

      console.log(`Backup restored: ${backupName}`);

      return { success: true, message: 'Backup restored successfully' };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return { success: false, error: error.message };
    }
  }

  deleteBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      const metaPath = backupPath.replace('.db', '.json');

      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
      if (fs.existsSync(metaPath)) {
        fs.unlinkSync(metaPath);
      }

      console.log(`Backup deleted: ${backupName}`);

      return { success: true };
    } catch (error) {
      console.error('Error deleting backup:', error);
      return { success: false, error: error.message };
    }
  }

  cleanOldBackups() {
    try {
      const backups = this.getBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.settings.keepDays);

      let deletedCount = 0;
      backups.forEach(backup => {
        if (new Date(backup.createdAt) < cutoffDate) {
          this.deleteBackup(backup.name);
          deletedCount++;
        }
      });

      console.log(`Cleaned ${deletedCount} old backups`);

      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error cleaning old backups:', error);
      return { success: false, error: error.message };
    }
  }

  shouldRunScheduledBackup() {
    if (!this.settings.enabled) return false;
    if (!this.settings.lastBackup) return true;

    const lastBackup = new Date(this.settings.lastBackup);
    const now = new Date();
    const hoursDiff = (now - lastBackup) / (1000 * 60 * 60);

    if (this.settings.frequency === 'daily' && hoursDiff >= 24) return true;
    if (this.settings.frequency === 'weekly' && hoursDiff >= 168) return true;

    return false;
  }

  runScheduledBackup() {
    if (this.shouldRunScheduledBackup()) {
      console.log('Running scheduled backup...');
      const result = this.createBackup('Scheduled automatic backup');
      if (result.success) {
        this.cleanOldBackups();
      } else {
        console.log('Scheduled backup skipped:', result.error);
      }
    }
  }
}

module.exports = BackupService;
