# TSSR Monitor - Deployment Guide

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Deployment & Installation Guide |
| **Version** | 2.0 |
| **Last Updated** | December 2025 |

---

## 1. Pre-Deployment Checklist

### 1.1 System Requirements

#### Server/Host Machine

| Requirement | Specification |
|-------------|---------------|
| **OS** | Windows 10/11 Pro or Server 2019+ |
| **CPU** | Intel i5 or equivalent (4+ cores) |
| **RAM** | 8 GB minimum, 16 GB recommended |
| **Storage** | 10 GB free space |
| **Network** | Static IP address for external access |
| **Internet** | Stable broadband (10+ Mbps) |

#### Client Machines

| Requirement | Specification |
|-------------|---------------|
| **OS** | Windows 10/11 |
| **RAM** | 4 GB minimum |
| **Storage** | 500 MB free space |
| **Display** | 1366×768 minimum |

### 1.2 Prerequisites

```
[ ] Node.js 18 LTS installed
[ ] npm 9+ installed
[ ] Git installed (for development)
[ ] Firebase project created
[ ] Firebase service account key obtained
[ ] Excel file accessible on network share
[ ] Static IP configured (for external access)
```

---

## 2. Development Environment Setup

### 2.1 Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/tssr-monitor.git

# Navigate to project
cd tssr-monitor/tssr-app

# Verify structure
ls -la
```

### 2.2 Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### 2.3 Configure Environment

#### Create .env file

```env
# .env (root directory)

# Application
NODE_ENV=development
APP_NAME=TSSR Monitor
APP_VERSION=2.0.0

# Excel Configuration
EXCEL_FILE_PATH=C:\Data\TSSR Tracker Zain Jo 5.xlsm
EXCEL_WATCH_INTERVAL=5000

# Firebase Configuration
FIREBASE_PROJECT_ID=playstation-way
FIREBASE_PRIVATE_KEY_PATH=./config/firebase-service-account.json

# Server (for external access)
SERVER_PORT=3000
SERVER_HOST=0.0.0.0
```

#### Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `config/firebase-service-account.json`

```json
{
  "type": "service_account",
  "project_id": "playstation-way",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@playstation-way.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### 2.4 Run Development Server

```bash
# Start development server
npm run dev

# Expected output:
# > tssr-monitor@2.0.0 dev
# > vite & electron .
# 
# VITE v5.x.x ready in xxx ms
# Electron app started
```

---

## 3. Production Build

### 3.1 Build Application

#### Windows Build

```bash
# Build for Windows
npm run build:win

# Output: dist/TSSR-Monitor-Setup-2.0.0.exe
```

#### Build Configuration (electron-builder.yml)

```yaml
appId: com.nokia.tssr-monitor
productName: TSSR Monitor
copyright: Copyright © 2025 Nokia

directories:
  output: dist
  buildResources: build

files:
  - "**/*"
  - "!**/*.{md,txt}"
  - "!docs/**"

win:
  target:
    - target: nsis
      arch: x64
  icon: build/icon.ico

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: build/icon.ico
  uninstallerIcon: build/icon.ico
  installerHeaderIcon: build/icon.ico
  createDesktopShortcut: true
  createStartMenuShortcut: true
```

### 3.2 Build Output

```
dist/
├── TSSR-Monitor-Setup-2.0.0.exe     # Installer (75 MB)
├── TSSR-Monitor-2.0.0.exe           # Portable version
├── latest.yml                        # Update manifest
└── builder-debug.yml                 # Build debug info
```

---

## 4. Installation

### 4.1 Fresh Installation

#### Step 1: Run Installer

```
1. Double-click TSSR-Monitor-Setup-2.0.0.exe
2. Accept UAC prompt if shown
3. Read and accept License Agreement
4. Choose installation directory
   Default: C:\Program Files\TSSR Monitor
5. Click Install
6. Wait for installation to complete
7. Launch application
```

#### Step 2: Initial Configuration

```
1. Launch TSSR Monitor
2. First-run wizard appears
3. Configure:
   - Excel file path
   - Firebase credentials (auto-detected if file exists)
   - Admin user credentials
4. Test connections
5. Complete setup
```

### 4.2 Upgrade Installation

```bash
# Backup current settings
copy "C:\Users\%USERNAME%\AppData\Roaming\TSSR Monitor\settings.json" backup\

# Run new installer (will upgrade in place)
TSSR-Monitor-Setup-2.0.0.exe

# Settings are preserved automatically
```

### 4.3 Silent Installation

For enterprise deployment:

```bash
# Silent install with default options
TSSR-Monitor-Setup-2.0.0.exe /S

# Silent install to custom directory
TSSR-Monitor-Setup-2.0.0.exe /S /D=D:\Apps\TSSRMonitor
```

---

## 5. Configuration Files

### 5.1 Application Settings

Location: `%APPDATA%\TSSR Monitor\settings.json`

```json
{
  "excelPath": "C:\\Data\\TSSR Tracker Zain Jo 5.xlsm",
  "syncInterval": 300000,
  "autoSync": true,
  "fileWatch": true,
  "theme": "light",
  "language": "en",
  "notifications": {
    "enabled": true,
    "sound": true,
    "statusChanges": true
  },
  "firebase": {
    "projectId": "playstation-way",
    "enabled": true
  },
  "server": {
    "enabled": false,
    "port": 3000
  }
}
```

### 5.2 Firebase Configuration

Location: `%APPDATA%\TSSR Monitor\firebase-config.json`

```json
{
  "projectId": "playstation-way",
  "storageBucket": "playstation-way.appspot.com",
  "serviceAccountPath": "./firebase-service-account.json"
}
```

---

## 6. Network Configuration

### 6.1 Firewall Rules

```powershell
# Allow TSSR Monitor through firewall
netsh advfirewall firewall add rule name="TSSR Monitor" dir=in action=allow program="C:\Program Files\TSSR Monitor\TSSR Monitor.exe" enable=yes

# Allow server port for external access
netsh advfirewall firewall add rule name="TSSR Monitor Server" dir=in action=allow protocol=tcp localport=3000 enable=yes
```

### 6.2 Static IP Configuration

For external user access:

```
1. Configure static IP on host machine
2. Configure port forwarding on router:
   External Port: 3000 → Internal IP:3000
3. Update DNS or share IP with external users
4. Configure SSL certificate (recommended)
```

### 6.3 Proxy Configuration

If behind corporate proxy:

```json
// settings.json
{
  "proxy": {
    "enabled": true,
    "host": "proxy.company.com",
    "port": 8080,
    "auth": {
      "username": "user",
      "password": "encrypted_password"
    }
  }
}
```

---

## 7. Database Setup

### 7.1 Firebase Firestore

#### Create Collections

```javascript
// Required collections (auto-created on first sync)
- sites        // Site data
- activityLog  // Activity history
- users        // User accounts
- settings     // App settings
```

#### IAM Roles Required

| Role | Purpose |
|------|---------|
| Firebase Admin SDK Administrator | Full admin access |
| Cloud Datastore User | Firestore read/write |
| Firebase Authentication Admin | User management |

### 7.2 Initialize Database

```bash
# Run initialization script
npm run init-db

# This will:
# 1. Create collections
# 2. Set up indexes
# 3. Configure security rules
# 4. Create admin user
```

---

## 8. Verification

### 8.1 Health Check

```bash
# Run health check
npm run health-check

# Expected output:
# ✓ Excel file accessible
# ✓ Firebase connected
# ✓ Database collections exist
# ✓ User authentication working
# ✓ File watcher active
# All systems operational
```

### 8.2 Test Checklist

```
[ ] Application launches without errors
[ ] Login with admin credentials works
[ ] Excel data loads correctly (3,791 sites)
[ ] Firebase sync completes successfully
[ ] Status updates save correctly
[ ] Reports generate properly
[ ] File changes trigger auto-sync
[ ] External access works (if configured)
```

---

## 9. Backup & Recovery

### 9.1 Backup Strategy

| Data | Location | Frequency |
|------|----------|-----------|
| Excel File | Network share | Automatic (Excel) |
| Firebase Data | Cloud | Real-time |
| App Settings | %APPDATA% | Before updates |
| Logs | %APPDATA%\logs | Weekly |

### 9.2 Backup Script

```powershell
# backup.ps1
$backupDir = "D:\Backups\TSSRMonitor\$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Force -Path $backupDir

# Backup settings
Copy-Item "$env:APPDATA\TSSR Monitor\*" $backupDir -Recurse

# Backup Excel (if local)
Copy-Item "C:\Data\TSSR Tracker Zain Jo 5.xlsm" $backupDir

Write-Host "Backup completed to $backupDir"
```

### 9.3 Recovery Procedure

```
1. Stop TSSR Monitor application
2. Restore settings from backup
3. Verify Excel file integrity
4. Re-run Firebase sync if needed
5. Restart application
6. Verify data integrity
```

---

## 10. Monitoring

### 10.1 Log Files

Location: `%APPDATA%\TSSR Monitor\logs\`

| Log File | Content |
|----------|---------|
| `app.log` | Application events |
| `sync.log` | Sync operations |
| `error.log` | Error messages |
| `access.log` | User access |

### 10.2 Log Rotation

```json
// logging config in settings.json
{
  "logging": {
    "level": "info",
    "maxSize": "10m",
    "maxFiles": 5,
    "compress": true
  }
}
```

---

## 11. Troubleshooting

### 11.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| App won't start | Missing dependencies | Reinstall application |
| Excel not loading | File path incorrect | Update settings |
| Firebase timeout | Network issues | Check internet connection |
| Sync failures | Quota exceeded | Monitor Firebase usage |
| Slow performance | Large dataset | Enable pagination |

### 11.2 Diagnostic Commands

```bash
# Check application logs
type "%APPDATA%\TSSR Monitor\logs\app.log"

# Check Firebase connectivity
curl -I https://firestore.googleapis.com

# Check Excel file accessibility
dir "C:\Data\TSSR Tracker Zain Jo 5.xlsm"

# Clear application cache
rmdir /s /q "%APPDATA%\TSSR Monitor\cache"
```

---

## 12. Uninstallation

### 12.1 Standard Uninstall

```
1. Open Control Panel → Programs → Programs and Features
2. Find "TSSR Monitor"
3. Click Uninstall
4. Follow prompts
```

### 12.2 Complete Removal

```powershell
# Remove application
& "C:\Program Files\TSSR Monitor\Uninstall TSSR Monitor.exe" /S

# Remove user data (optional)
Remove-Item "$env:APPDATA\TSSR Monitor" -Recurse -Force

# Remove firewall rules
netsh advfirewall firewall delete rule name="TSSR Monitor"
netsh advfirewall firewall delete rule name="TSSR Monitor Server"
```

---

*Deployment Guide Version: 2.0 | Last Updated: December 2025*
