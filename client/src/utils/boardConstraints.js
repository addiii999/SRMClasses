import api from '../lib/api';

let cachedMap = null;
let configVersion = null;

// The latest known "safe" configuration for the entire platform.
const FALLBACK_MAP = {
  'CBSE': ['5', '6', '7', '8', '9', '10', '11', '12'],
  'ICSE': ['6', '7', '8', '9', '10'],
  'JAC': ['11', '12']
};

/**
 * Fetches the global allowed Class-Board Map from the backend.
 * Caches the response in memory and localStorage for version tracking.
 */
export const fetchBoardClassMap = async () => {
  // Check memory cache first
  if (cachedMap) return cachedMap;
  
  try {
    const { data } = await api.get('/config/board-constraints');
    if (data && data.success && data.data) {
      cachedMap = data.data;
      configVersion = data.version || '1.0.0';
      // Sync to localStorage for persistent safety cross-reloads
      localStorage.setItem('srmBoardConfig', JSON.stringify({ map: cachedMap, version: configVersion, syncAt: Date.now() }));
      return cachedMap;
    }
  } catch (error) {
    console.warn('[Safety] Failed to fetch board constraints, attempting local recovery...', error);
  }
  
  // Attempt recovery from localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('srmBoardConfig'));
    if (saved && saved.map) {
      console.log('[Safety] Recovered board config from localStorage v' + saved.version);
      cachedMap = saved.map;
      return cachedMap;
    }
  } catch (e) {}

  // Total fail? Use the hardcoded safety fallback.
  console.log('[Safety] Using hardcoded FALLBACK_MAP');
  cachedMap = FALLBACK_MAP;
  return cachedMap;
};

/**
 * Helper to get the allowed boards for a specific class.
 * @param {Object} map - The validation map fetched via fetchBoardClassMap()
 * @param {string} studentClass - The current class selected/assigned
 * @returns {Array<string>} List of allowed board names
 */
export const getAllowedBoardsForClass = (map, studentClass) => {
  if (!map || !studentClass) return [];
  return Object.keys(map).filter(board => map[board].includes(String(studentClass)));
};
