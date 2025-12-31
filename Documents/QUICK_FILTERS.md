# Quick Filters Configuration

## TSSR Status Quick Filters

This document outlines the Quick Filters configuration that matches the actual TSSR status values in the system.

---

## Filter Options

### 1. Approved 🟢
- **Color:** Green (#22c55e)
- **Status:** `Approved`
- **Description:** Sites with approved TSSR status
- **Icon:** 🟢

### 2. Zain Validation 🟣
- **Color:** Purple (#a855f7)
- **Status:** `TSSR Under Zain validation`
- **Description:** Sites under Zain team validation
- **Icon:** 🟣

### 3. ROM Review 🔵
- **Color:** Light Blue (#7dd3fc)
- **Status:** `TSSR Under ROM Review`
- **Description:** Sites under ROM team review
- **Icon:** 🔵

### 4. Nokia NPO 🔵
- **Color:** Dark Navy (#1e3a8a)
- **Status:** `TSSR Under Nokia NPO Validation`
- **Description:** Sites under Nokia NPO validation
- **Icon:** 🔵

### 5. Nokia ROM 🟡
- **Color:** Yellow (#eab308)
- **Status:** `TSSR Under Nokia ROM Validation`
- **Description:** Sites under Nokia ROM validation
- **Icon:** 🟡

### 6. Nokia GSD 🟠
- **Color:** Orange (#f97316)
- **Status:** `TSSR Under Nokia GSD Validation`
- **Description:** Sites under Nokia GSD validation
- **Icon:** 🟠

### 7. Subcon Validation 🔵
- **Color:** Turquoise (#8FD9D9 - YAS Brand Color)
- **Status:** `TSSR Under Subcon validation`
- **Description:** Sites under subcontractor validation
- **Icon:** 🔵

### 8. Not Surveyed ⚫
- **Color:** Gray (#64748b)
- **Status:** `Site not Surveyed`
- **Description:** Sites that haven't been surveyed yet
- **Icon:** ⚫

### 9. Need Access 🔴
- **Color:** Red (#ef4444)
- **Status:** `Need Access`
- **Description:** Sites requiring access permission
- **Icon:** 🔴

---

## Status Distribution (Based on Analysis)

From the 3,791 total sites:

| Status | Count | Percentage |
|--------|-------|------------|
| Approved | 1,420 | 37.5% |
| Site not surveyed | 159 | 4.2% |
| TSSR Under ROM Review | 34 | 0.9% |
| TSSR Under Subcon validation | 2 | 0.1% |
| TSSR Under Zain validation | 1 | <0.1% |
| TSSR Under Nokia NPO Validation | 1 | <0.1% |
| TSSR Under Nokia GSD Validation | 0 | 0% |
| Need Access | 0 | 0% |

---

## Files Modified

1. **QuickFilters.jsx** - Updated filter options
2. **useAdvancedSearch.js** - Updated state and logic
3. **QUICK_FILTERS.md** - Documentation (this file)

---

**Last Updated:** December 27, 2025  
**Version:** 1.0
