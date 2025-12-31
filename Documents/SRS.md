# TSSR Monitor - Software Requirements Specification (SRS)

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Software Requirements Specification |
| **Version** | 2.0 |
| **Status** | Approved |
| **Last Updated** | December 2025 |

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for TSSR Monitor, a desktop application designed to manage Technical Site Survey Reports for Zain Jordan's telecommunications network infrastructure.

### 1.2 Scope

TSSR Monitor will provide:
- Real-time tracking of 3,791+ telecommunication sites across Jordan
- Multi-department workflow management
- Role-based access control
- Excel and Firebase data synchronization
- Reporting and analytics capabilities

### 1.3 Stakeholders

| Stakeholder | Role | Interest |
|-------------|------|----------|
| Zain Jordan | Client | Network rollout tracking |
| Nokia | Vendor | Technical validation |
| Subcontractors | Surveyors | Site survey submission |
| TI/RF/Civil Departments | Reviewers | Department-specific approvals |

---

## 2. Functional Requirements

### 2.1 User Management (FR-100)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-101 | System shall support user authentication via email/password | High |
| FR-102 | System shall support 4 user roles: Admin, Management, Contractor, Nokia Engineer | High |
| FR-103 | Admin users shall be able to create, modify, and deactivate user accounts | High |
| FR-104 | System shall enforce role-based access control for all features | High |
| FR-105 | System shall log all user login/logout activities | Medium |
| FR-106 | System shall support password reset functionality | Medium |

### 2.2 Site Management (FR-200)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-201 | System shall display all sites from the Master Sheet (3,791 sites) | High |
| FR-202 | System shall support filtering sites by governorate (16 options) | High |
| FR-203 | System shall support filtering sites by TSSR status | High |
| FR-204 | System shall support filtering sites by project phase | High |
| FR-205 | System shall support filtering sites by owner (TASC/ZAIN/ZAIN/M) | High |
| FR-206 | System shall support text search across site fields | High |
| FR-207 | System shall display site details including all 68 columns | High |
| FR-208 | System shall show site location on map (optional) | Low |

### 2.3 Status Management (FR-300)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-301 | Authorized users shall be able to update department status | High |
| FR-302 | System shall record timestamp for each status change | High |
| FR-303 | System shall require comment for status changes | Medium |
| FR-304 | System shall maintain full status change history | High |
| FR-305 | System shall calculate action age (days since last update) | Medium |
| FR-306 | System shall support batch status updates | Medium |

### 2.4 Data Synchronization (FR-400)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-401 | System shall read data from Excel file (.xlsm format) | High |
| FR-402 | System shall handle 17 worksheets with 68 columns | High |
| FR-403 | System shall sync data to Firebase Firestore | High |
| FR-404 | System shall support automatic sync at configurable intervals | High |
| FR-405 | System shall detect Excel file changes and trigger sync | High |
| FR-406 | System shall handle sync conflicts gracefully | Medium |
| FR-407 | System shall log all sync operations | Medium |

### 2.5 Reporting (FR-500)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-501 | System shall generate Customer Report summary | High |
| FR-502 | System shall generate Weekly Progress report | High |
| FR-503 | System shall generate Department Status report | High |
| FR-504 | System shall support date range filtering for reports | Medium |
| FR-505 | System shall export reports to Excel format | High |
| FR-506 | System shall export reports to PDF format | Medium |

### 2.6 Dashboard (FR-600)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-601 | System shall display total site count | High |
| FR-602 | System shall display TSSR status distribution | High |
| FR-603 | System shall display department approval statistics | High |
| FR-604 | System shall display governorate distribution | Medium |
| FR-605 | System shall display recent activity log | Medium |
| FR-606 | System shall refresh dashboard data automatically | High |

---

## 3. Non-Functional Requirements

### 3.1 Performance (NFR-100)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-101 | Application startup time | < 5 seconds |
| NFR-102 | Excel file load time (3,791 records) | < 10 seconds |
| NFR-103 | Search response time | < 1 second |
| NFR-104 | Page navigation time | < 500ms |
| NFR-105 | Firebase sync time (full) | < 60 seconds |

### 3.2 Scalability (NFR-200)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-201 | Support concurrent users | 10 external users |
| NFR-202 | Handle total sites | 5,000+ sites |
| NFR-203 | Handle activity log entries | 100,000+ entries |

### 3.3 Reliability (NFR-300)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-301 | System uptime | 99% |
| NFR-302 | Data integrity | 100% |
| NFR-303 | Offline functionality | Full read access |
| NFR-304 | Error recovery | Automatic retry |

### 3.4 Security (NFR-400)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-401 | All data transmission encrypted | TLS 1.3 |
| NFR-402 | Password storage | Hashed (bcrypt) |
| NFR-403 | Session timeout | 30 minutes |
| NFR-404 | Audit logging | All changes logged |
| NFR-405 | Role-based access | Enforced at all levels |

### 3.5 Usability (NFR-500)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-501 | User interface language | English, Arabic (future) |
| NFR-502 | Accessibility compliance | WCAG 2.0 AA |
| NFR-503 | Learning curve | < 1 hour training |
| NFR-504 | Error messages | Clear, actionable |

### 3.6 Compatibility (NFR-600)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-601 | Operating System | Windows 10/11 |
| NFR-602 | Excel file format | .xlsm (macro-enabled) |
| NFR-603 | Screen resolution | 1366×768 minimum |
| NFR-604 | Memory usage | < 500 MB |

---

## 4. Use Cases

### 4.1 UC-001: Login to System

| Field | Description |
|-------|-------------|
| **Actor** | All Users |
| **Precondition** | User has valid credentials |
| **Main Flow** | 1. User opens application 2. User enters email and password 3. System validates credentials 4. System loads user dashboard |
| **Postcondition** | User is authenticated and sees role-specific dashboard |
| **Alternative** | Invalid credentials: Show error, allow retry |

### 4.2 UC-002: Update Site Status

| Field | Description |
|-------|-------------|
| **Actor** | Nokia Engineer, Admin |
| **Precondition** | User is logged in with update permission |
| **Main Flow** | 1. User navigates to site 2. User clicks "Edit Status" 3. User selects new status 4. User adds comment 5. User saves changes |
| **Postcondition** | Status updated, activity logged, sync triggered |
| **Alternative** | Validation error: Show message, allow correction |

### 4.3 UC-003: Generate Report

| Field | Description |
|-------|-------------|
| **Actor** | Management, Admin |
| **Precondition** | User is logged in with report permission |
| **Main Flow** | 1. User navigates to Reports 2. User selects report type 3. User sets date range 4. User clicks Generate 5. System creates report |
| **Postcondition** | Report displayed with export options |
| **Alternative** | No data: Show appropriate message |

### 4.4 UC-004: Sync Excel Data

| Field | Description |
|-------|-------------|
| **Actor** | System (automatic) or Admin |
| **Precondition** | Excel file is accessible |
| **Main Flow** | 1. System detects file change (or admin triggers) 2. System reads Excel data 3. System validates data 4. System uploads to Firebase 5. System logs sync completion |
| **Postcondition** | Firebase data matches Excel data |
| **Alternative** | Sync error: Log error, notify admin |

---

## 5. Data Requirements

### 5.1 Data Sources

| Source | Format | Records | Update Frequency |
|--------|--------|---------|------------------|
| Master Sheet | Excel (.xlsm) | 3,791 | Daily |
| Dashboard | Excel | N/A | Real-time calc |
| Activity Log | Excel/Firebase | 2,821+ | Per action |

### 5.2 Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| Site Data | Indefinite |
| Activity Logs | 2 years |
| Sync Logs | 6 months |
| User Sessions | 30 days |

---

## 6. External Interfaces

### 6.1 User Interface

- Desktop application (Electron)
- React-based frontend
- YAS branding (Turquoise #8FD9D9, Orange #FF8566)
- Responsive design for different screen sizes

### 6.2 Hardware Interfaces

- Standard Windows PC
- Network connectivity (LAN/WAN)
- Display (1366×768 minimum)

### 6.3 Software Interfaces

| System | Interface | Purpose |
|--------|-----------|---------|
| Excel | XLSX library | Read/write .xlsm files |
| Firebase | Admin SDK | Cloud data storage |
| Windows | Electron | Desktop integration |

---

## 7. Acceptance Criteria

### 7.1 Functional Acceptance

| Test | Criteria | Pass/Fail |
|------|----------|-----------|
| User Login | All roles can login successfully | |
| Site Display | 3,791 sites displayed correctly | |
| Status Update | Status changes saved and synced | |
| Report Generation | Reports match expected data | |
| Data Sync | Excel to Firebase sync completes | |

### 7.2 Performance Acceptance

| Test | Criteria | Pass/Fail |
|------|----------|-----------|
| Startup | < 5 seconds | |
| Search | < 1 second response | |
| Full Sync | < 60 seconds | |

---

## 8. Appendices

### 8.1 Glossary

| Term | Definition |
|------|------------|
| TSSR | Technical Site Survey Report |
| NPO | Network Planning & Optimization |
| GSD | Global Service Delivery |
| TI | Technical Integration |
| RF | Radio Frequency |
| MW | Microwave |
| IBS | Indoor Building System |

### 8.2 References

- Zain Jordan Network Requirements Document
- Nokia Technical Standards
- Firebase Documentation
- Electron API Reference

---

*SRS Version: 2.0 | Last Updated: December 2025*
