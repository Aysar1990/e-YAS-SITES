# TSSR Monitor - User Guide

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | TSSR Monitor User Guide |
| **Version** | 2.0 |
| **Audience** | All System Users |
| **Last Updated** | December 2025 |

---

## 1. Introduction

### 1.1 What is TSSR Monitor?

TSSR Monitor is a desktop application designed to streamline the management of Technical Site Survey Reports (TSSR) for Zain Jordan's telecommunications network. It enables teams to track, update, and collaborate on site surveys across multiple departments.

### 1.2 Who Should Use This Guide?

This guide is intended for:
- Nokia Engineers (NPO/GSD teams)
- Zain Management staff
- Subcontractors (Al-Lewan, SMART, etc.)
- TI, RF Planning, RF Optimization, Civil, and MW department staff

---

## 2. Getting Started

### 2.1 System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **Operating System** | Windows 10 | Windows 11 |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 500 MB | 1 GB |
| **Display** | 1366×768 | 1920×1080 |
| **Network** | Internet for sync | Stable broadband |

### 2.2 Installation

#### Step 1: Download the Installer
Download `TSSR-Monitor-Setup.exe` from the designated network share or distribution channel.

#### Step 2: Run the Installer
Double-click the installer and follow the on-screen instructions:

```
1. Accept License Agreement
2. Choose Installation Location (default: C:\Program Files\TSSR Monitor)
3. Select Start Menu Folder
4. Click Install
5. Launch Application
```

#### Step 3: Initial Configuration
On first launch, you will need to:
1. Enter your credentials (provided by your administrator)
2. Configure Excel file location
3. Verify Firebase connection

### 2.3 Login

```
┌─────────────────────────────────────┐
│         TSSR Monitor Login          │
├─────────────────────────────────────┤
│                                     │
│   Email:    [________________]      │
│                                     │
│   Password: [________________]      │
│                                     │
│   Role:     [Admin        ▼]        │
│                                     │
│        [ Login ]  [ Exit ]          │
│                                     │
└─────────────────────────────────────┘
```

---

## 3. User Interface Overview

### 3.1 Main Screen Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo]  TSSR Monitor              [Search] [Settings] [User] [⚙] │
├────────────────────────────────────────────────────────────────────┤
│ ┌────────┐ ┌──────────────────────────────────────────────────────┐│
│ │        │ │                                                      ││
│ │ MENU   │ │                    MAIN CONTENT                      ││
│ │        │ │                                                      ││
│ │Dashboard│ │  ┌──────────┐ ┌──────────┐ ┌──────────┐            ││
│ │Sites   │ │  │  Total   │ │ Approved │ │ Pending  │            ││
│ │Reports │ │  │  3,791   │ │  1,420   │ │   159    │            ││
│ │Settings│ │  └──────────┘ └──────────┘ └──────────┘            ││
│ │        │ │                                                      ││
│ │        │ │  ┌────────────────────────────────────────────────┐ ││
│ │        │ │  │                 SITE TABLE                     │ ││
│ │        │ │  │  ID    | Name          | Status    | Owner     │ ││
│ │        │ │  │  ZJ001 | Amman Central | Approved  | TASC      │ ││
│ │        │ │  │  ZJ002 | Irbid North   | Pending   | ZAIN      │ ││
│ │        │ │  └────────────────────────────────────────────────┘ ││
│ └────────┘ └──────────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────────────────────┤
│ Status: Connected │ Last Sync: 2 min ago │ Sites: 3,791 │ v2.0.0  │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 Navigation Menu

| Menu Item | Description |
|-----------|-------------|
| **Dashboard** | Overview of all statistics and KPIs |
| **Sites** | Browse and manage individual sites |
| **Reports** | Generate and view reports |
| **Weekly Plan** | View and manage weekly tasks |
| **Activity Log** | View system activity history |
| **Settings** | Configure application settings |

---

## 4. Dashboard

### 4.1 Key Performance Indicators (KPIs)

The dashboard displays real-time statistics:

| KPI | Description |
|-----|-------------|
| **Total Sites** | Total number of tracked sites (3,791) |
| **Approved** | Sites with approved TSSR status |
| **Under Review** | Sites pending validation |
| **Rejected** | Sites requiring rework |
| **Need Access** | Sites awaiting access permission |

### 4.2 Status Distribution Chart

The pie chart shows TSSR status distribution:
- **Approved** (Green): 1,420 sites
- **Site Not Surveyed** (Yellow): 159 sites
- **Under Validation** (Blue): Various stages
- **Rejected** (Red): Requires attention

### 4.3 Department Status

| Department | View Includes |
|------------|---------------|
| **TI Status** | Technical Integration approvals |
| **RF Planning** | RF Planning department status |
| **RF Optimization** | RF Optimization reviews |
| **Civil** | Civil engineering status |
| **MW** | Microwave department status |

---

## 5. Site Management

### 5.1 Viewing Sites

#### Filter Options

```
┌─────────────────────────────────────────────────────────────┐
│ Filters:                                                    │
│ ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐│
│ │ Governorate ▼│ │ Status     ▼│ │ Phase              ▼  ││
│ │ All          │ │ All         │ │ All                   ││
│ └──────────────┘ └──────────────┘ └────────────────────────┘│
│                                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐│
│ │ Owner      ▼│ │ Subcon     ▼│ │ Search: [___________] ││
│ │ All          │ │ All         │ │                        ││
│ └──────────────┘ └──────────────┘ └────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### Available Filters

| Filter | Options |
|--------|---------|
| **Governorate** | Amman, Irbid, Zarqa, etc. (16 total) |
| **Status** | Approved, Pending, Rejected, Not Surveyed |
| **Phase** | P.O.2, Phase-2, PO3, RO4, RO2, RO3, Phase-1 |
| **Owner** | TASC (78.9%), ZAIN (15.4%), ZAIN/M (5.7%) |
| **Subcontractor** | Al-Lewan, SMART, Al-Tawseaa, etc. |

### 5.2 Site Card View

Each site is displayed as an interactive card:

```
┌─────────────────────────────────────────────────┐
│ ┌─────┐  ZJ-001                    [Approved]   │
│ │     │  Amman Central Tower                    │
│ │ 🗼  │  ─────────────────────────────────────  │
│ │     │  Governorate: Amman                     │
│ └─────┘  Phase: RO4  │  Owner: TASC             │
│          ─────────────────────────────────────  │
│          TI: ✅  RF-P: ✅  RF-O: ⏳  Civil: ✅   │
│          ─────────────────────────────────────  │
│          Last Updated: 2025-12-15               │
│          [ View Details ]  [ Edit Status ]      │
└─────────────────────────────────────────────────┘
```

### 5.3 Site Details

Click "View Details" to see comprehensive information:

| Section | Information |
|---------|-------------|
| **Basic Info** | Site ID, Name, Code, Type |
| **Location** | Coordinates, Governorate, Address |
| **Structure** | Type, Height, Part of |
| **Ownership** | Owner, Contact Details |
| **Project** | Phase, Priority, Cluster |
| **5G Config** | Sectors, Solution, TDD |
| **Status History** | All status changes with timestamps |
| **Comments** | Department comments and notes |

### 5.4 Updating Site Status

#### For Nokia Engineers

1. Navigate to the site card
2. Click "Edit Status"
3. Update your department's status
4. Add comment (optional)
5. Click "Save Changes"

```
┌─────────────────────────────────────────────────┐
│ Update Status - ZJ-001                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Department: [Nokia NPO        ▼]                │
│                                                 │
│ New Status: [Approved         ▼]                │
│                                                 │
│ Comment:                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ All technical requirements met.             │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [ Cancel ]                    [ Save Changes ]  │
└─────────────────────────────────────────────────┘
```

#### Status Options

| Status | Description |
|--------|-------------|
| **Approved** | All requirements met |
| **Pending** | Awaiting review/action |
| **Rejected** | Requires rework |
| **Under Review** | Currently being reviewed |
| **Released** | Released for next phase |

---

## 6. Reports

### 6.1 Available Reports

| Report | Description |
|--------|-------------|
| **Customer Report** | Summary for stakeholders |
| **Weekly Progress** | Weekly task completion |
| **Department Status** | Per-department analysis |
| **Governorate Summary** | Geographic breakdown |
| **Subcontractor Performance** | Contractor metrics |

### 6.2 Generating Reports

1. Navigate to **Reports** from the menu
2. Select report type
3. Choose date range
4. Apply filters (optional)
5. Click **Generate**
6. Export as Excel or PDF

---

## 7. Weekly Plan

### 7.1 Viewing Weekly Tasks

The Weekly Plan shows scheduled activities:

```
┌─────────────────────────────────────────────────────────────┐
│ Weekly Plan - Week 51 (Dec 16-22, 2025)                     │
├─────────────────────────────────────────────────────────────┤
│ Site ID  │ Priority │ Plan      │ Subcon  │ Nokia Owner    │
│──────────│──────────│───────────│─────────│────────────────│
│ ZJ-150   │ High     │ Survey    │ SMART   │ Ahmed          │
│ ZJ-151   │ Medium   │ Review    │ Al-Lewan│ Mohammad       │
│ ZJ-152   │ Low      │ Approval  │ SMART   │ Sara           │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Settings

### 8.1 Application Settings

| Setting | Description |
|---------|-------------|
| **Excel File Path** | Location of TSSR Tracker file |
| **Sync Interval** | Auto-sync frequency (default: 5 min) |
| **Theme** | Light/Dark mode |
| **Language** | Interface language |
| **Notifications** | Enable/disable alerts |

### 8.2 Excel File Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ Excel File Settings                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ File Path:                                                  │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ C:\Data\TSSR Tracker Zain Jo 5.xlsm                 │ [📁]│
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ [✓] Monitor file for changes                                │
│ [✓] Auto-sync on file save                                  │
│ [ ] Backup before sync                                      │
│                                                             │
│ Last Sync: 2025-12-15 14:30:22                             │
│ Records: 3,791 sites                                        │
│                                                             │
│ [ Test Connection ]           [ Save Settings ]             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Solution |
|-------|----------|
| **Cannot load Excel file** | Ensure file is not open in Excel |
| **Sync failed** | Check internet connection |
| **Login failed** | Verify credentials with admin |
| **Missing sites** | Check Excel Auto Filters are off |
| **Slow performance** | Clear cache from Settings |

### 9.2 Error Messages

| Error Code | Meaning | Action |
|------------|---------|--------|
| ERR_EXCEL_001 | Excel read error | Close Excel, retry |
| ERR_FB_001 | Firebase connection error | Check internet |
| ERR_FB_002 | Firebase quota exceeded | Contact admin |
| ERR_AUTH_001 | Authentication failed | Re-login |

### 9.3 Getting Help

For technical support:
- **Email**: support@tssr-monitor.local
- **Phone**: Internal extension
- **Documentation**: See `/docs` folder

---

## 10. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + F` | Search sites |
| `Ctrl + R` | Refresh data |
| `Ctrl + S` | Save changes |
| `Ctrl + E` | Export current view |
| `Ctrl + ,` | Open settings |
| `F5` | Manual sync |
| `Esc` | Close dialog |

---

## 11. Best Practices

### 11.1 For Efficient Workflow

1. **Regular Sync**: Ensure data is synced before starting work
2. **Add Comments**: Always add comments when changing status
3. **Use Filters**: Filter by your assigned cluster or area
4. **Check Activity Log**: Review recent changes before updates
5. **Report Issues**: Use feedback system for bugs

### 11.2 Data Quality

1. **Verify Before Approve**: Double-check all details
2. **Complete Fields**: Fill all required fields
3. **Consistent Format**: Use standard naming conventions
4. **Timely Updates**: Update status within 24 hours of action

---

*User Guide Version: 2.0 | Last Updated: December 2025*
