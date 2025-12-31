/**
 * Import Service
 * Handles Excel file parsing and data import via Electron IPC.
 * UPDATED: Now uses IPC handlers to properly import to Supabase/SQLite
 */

import * as XLSX from 'xlsx';

/**
 * Expected columns and their mapping to database fields
 * Based on 'TSSR Tracker Zain Jo 5.xlsm' analysis
 */
const COLUMN_MAPPING = {
    'Site ID': 'siteId',
    'Final Site Name': 'finalSiteName',
    'Site Code': 'siteCode',
    'Site Type': 'siteType',
    'Key Number': 'keyNumber',
    'long': 'longitude',
    'lat': 'latitude',
    'Governorate': 'governorate',
    'Structure': 'structure',
    'Structure Type': 'structureType',
    'Part of': 'partOf',
    'Part Of': 'partOf',
    'part of': 'partOf',
    'Hieght (m)': 'heightM',
    'Height (m)': 'heightM',
    'Site Owner': 'siteOwner',
    'Phase Name': 'phaseName',
    'Priority': 'priority',
    'Cluster': 'cluster',
    'Area': 'area',
    'Weekly Plan': 'weeklyPlan',
    
    // TSSR Fields
    'TSS SMP': 'tssSmp',
    'TSSR Subcon': 'tssrSubcon',
    'TSSR PO#': 'tssrPo',
    'TS Survey (Ac)': 'tsSurveyAc',
    'TSSR Overall Status': 'tssrOverallStatus',
    'TSSR status Date': 'tssrStatusDate',
    'TSSR Remark': 'tssrRemark',
    'Action Age': 'actionAge',

    // 5G & Technical
    '5G sectors Names': 'fiveGSectorsNames',
    '5G solution': 'fiveGSolution',
    'Site Sectors #': 'siteSectors',
    'IBS Sector': 'ibsSector',
    'TDD Site': 'tddSite',
    'Version': 'version',
    'REC. Cab. Swap': 'recCabSwap',

    // Department Statuses & Owners
    'TI Status': 'tiStatus',
    'TI Comment': 'tiComment',
    'Cluster Owner (TI)': 'clusterOwnerTi',

    'RF Plan. Status': 'rfPlanStatus',
    'RF Plan Comment': 'rfPlanComment',
    'Cluster Owner (Planing)': 'clusterOwnerPlanning',
    'Cluster Owner (Planning)': 'clusterOwnerPlanning',

    'RF Optim Status': 'rfOptStatus',
    'RF Opt. comment': 'rfOptComment',
    'Cluster Owner (Optimization)': 'clusterOwnerOptimization',

    'Civil Status': 'civilStatus',
    'Civil Comment': 'civilComment',
    'Cluster Owner (Civil)': 'clusterOwnerCivil',

    'MW Status': 'mwStatus',
    'MW Comment': 'mwComment',
    'Cluster Owner (MW)': 'clusterOwnerMw',

    'NoKia NPO status': 'nokiaNpoStatus',
    'Nokia NPO Comment': 'nokiaNpoComment',
    'Nokia Site Owner': 'nokiaSiteOwner',

    'RFI Status': 'rfiStatus',
    'Gap Analysis': 'gapAnalysis',
    'Approved': 'approved',
    'TSSR Ready': 'tssrReady'
};

/**
 * Parse Excel file from File object
 * @param {File} file - The file from drag & drop
 * @returns {Promise<Object>} Analysis result { sites, stats, phases }
 */
export const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Find "Master" or "Data" sheet
                const sheetNames = workbook.SheetNames;
                let targetSheetName = sheetNames.find(n => 
                    n.toLowerCase() === 'master' || 
                    n.toLowerCase() === 'data' || 
                    n.toLowerCase() === 'export'
                ) || sheetNames[0];

                const worksheet = workbook.Sheets[targetSheetName];
                
                // Parse to JSON (Array of Arrays to find header)
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (rawData.length < 2) {
                    return reject(new Error('File is empty or invalid'));
                }

                // Find Header Row (Look for "Site ID")
                let headerRowIndex = 0;
                for (let i = 0; i < Math.min(20, rawData.length); i++) {
                    const row = rawData[i];
                    if (row && row.some(cell => String(cell).trim().toLowerCase() === 'site id')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                // Get Headers
                const headers = rawData[headerRowIndex];
                
                // Extract Data Rows
                const sites = [];
                const phases = {};
                
                for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                    const row = rawData[i];
                    if (!row || row.length === 0) continue;

                    const siteObj = {};
                    let hasId = false;

                    // Map columns
                    headers.forEach((header, colIndex) => {
                        if (!header) return;
                        const cleanHeader = String(header).trim();
                        const fieldKey = COLUMN_MAPPING[cleanHeader] || COLUMN_MAPPING[Object.keys(COLUMN_MAPPING).find(k => k.toLowerCase() === cleanHeader.toLowerCase())];
                        
                        if (fieldKey) {
                            let value = row[colIndex];
                            // Clean value
                            if (value === undefined || value === null) value = '';
                            if (typeof value === 'string') value = value.trim();
                            
                            siteObj[fieldKey] = value;

                            if (fieldKey === 'siteId' && value) hasId = true;
                        }
                    });

                    if (hasId) {
                        // Ensure numeric fields are numbers
                        if (siteObj.priority) siteObj.priority = Number(siteObj.priority) || 0;
                        if (siteObj.longitude) siteObj.longitude = Number(siteObj.longitude) || null;
                        if (siteObj.latitude) siteObj.latitude = Number(siteObj.latitude) || null;

                        // Count phases
                        const phase = siteObj.phaseName || 'Unknown';
                        phases[phase] = (phases[phase] || 0) + 1;

                        sites.push(siteObj);
                    }
                }

                // Save file to temp location for backend processing
                const arrayBuffer = e.target.result;
                const blob = new Blob([arrayBuffer], { type: file.type });
                const tempFile = new File([blob], file.name, { type: file.type });
                
                // Store temp file for later upload
                window.__tempImportFile = tempFile;

                resolve({
                    totalSites: sites.length,
                    columns: headers.length,
                    phases,
                    preview: sites.slice(0, 5),
                    data: sites // Full data for import
                });

            } catch (error) {
                console.error('Excel parse error:', error);
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Upload sites to database via Electron IPC (imports to Supabase/SQLite)
 * @param {Array} sites - Array of parsed site objects
 * @param {Function} onProgress - Callback(percentage)
 */
export const uploadSites = async (sites, onProgress) => {
    try {
        // Check if running in Electron
        if (!window.electron) {
            throw new Error('Import requires Electron environment');
        }

        // Get the temp file
        const tempFile = window.__tempImportFile;
        if (!tempFile) {
            throw new Error('No file available for upload');
        }

        // Create a temporary file path using FileSystem API
        const arrayBuffer = await tempFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Convert to base64 for transfer
        const base64 = btoa(
            uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Call IPC handler to import file (uses direct method)
        const result = await window.electron.importExcelFromBase64({
            fileName: tempFile.name,
            base64Data: base64
        });

        if (!result.success) {
            throw new Error(result.error || 'Import failed');
        }

        // Clean up temp file
        delete window.__tempImportFile;

        return result.result?.inserted || sites.length;

    } catch (error) {
        console.error('❌ Upload error:', error);
        throw error;
    }
};

/**
 * Compare new data with existing data
 * @param {Array} newSites 
 * @param {Array} existingSites 
 */
export const compareData = (newSites, existingSites) => {
    // Placeholder implementation for compatibility
    return {
        added: [],
        modified: [],
        removed: [],
        unchanged: []
    };
};

/**
 * Upload sites directly to Supabase (bypasses SQLite)
 * Use this when DATABASE_TYPE=supabase
 * @param {Array} sites - Array of parsed site objects
 * @param {Function} onProgress - Callback(percentage)
 */
export const uploadSitesToSupabase = async (sites, onProgress) => {
    try {
        if (!window.electron) {
            throw new Error('Import requires Electron environment');
        }

        // Get the temp file
        const tempFile = window.__tempImportFile;
        if (!tempFile) {
            throw new Error('No file available for upload');
        }

        // Create base64 from file
        const arrayBuffer = await tempFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const base64 = btoa(
            uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Listen to progress events
        if (onProgress) {
            window.electron.onSupabaseProgress((data) => {
                if (data.percentage !== undefined) {
                    onProgress(data.percentage);
                }
            });
        }

        // Call Supabase direct import
        const result = await window.electron.supabaseImportExcel({
            fileName: tempFile.name,
            base64Data: base64
        });

        // Clean up listeners
        if (window.electron.removeSupabaseProgressListener) {
            window.electron.removeSupabaseProgressListener();
        }

        if (!result.success) {
            throw new Error(result.error || 'Supabase import failed');
        }

        // Clean up temp file
        delete window.__tempImportFile;

        return result.data?.summary || { total: sites.length, updated: sites.length };

    } catch (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
    }
};

/**
 * Check if Supabase is available and connected
 * @returns {Promise<{available: boolean, message: string}>}
 */
export const checkSupabaseConnection = async () => {
    try {
        if (!window.electron?.supabaseTestConnection) {
            return { available: false, message: 'Supabase not configured in preload' };
        }

        const result = await window.electron.supabaseTestConnection();
        return {
            available: result.success,
            message: result.success ? result.data?.message : result.error,
            latency: result.data?.latency
        };
    } catch (error) {
        return { available: false, message: error.message };
    }
};

/**
 * Service export (for backward compatibility)
 */
export const importService = {
    parseExcelFile,
    uploadSites,
    uploadSitesToSupabase,
    checkSupabaseConnection,
    compareData
};
