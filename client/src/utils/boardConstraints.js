import api from '../lib/api';

let cachedMap = null;

/**
 * Fetches the global allowed Class-Board Map from the backend.
 * Caches the response in memory to avoid redundant API calls.
 * 
 * @returns {Promise<Object>} The mapping object (e.g. { 'CBSE': ['6', '7'...], 'JAC': ... })
 */
export const fetchBoardClassMap = async () => {
  if (cachedMap) return cachedMap;
  
  try {
    const { data } = await api.get('/config/board-constraints');
    if (data && data.success && data.data) {
      cachedMap = data.data;
      return cachedMap;
    }
  } catch (error) {
    console.error('Failed to fetch board constraints:', error);
  }
  
  // Minimal fallback in case API fails
  return {
    'CBSE': [],
    'ICSE': [],
    'JAC': []
  };
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
