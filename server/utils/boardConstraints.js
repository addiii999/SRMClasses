// Centralized Configuration for Allowed Class-Board Combinations
// This acts as the single source of truth for validations across the entire platform.

const VALID_CLASS_BOARD_MAP = {
  'CBSE': ['5', '6', '7', '8', '9', '10', '11', '12'],
  'ICSE': ['6', '7', '8', '9', '10'],
  'JAC': ['11', '12']
};

/**
 * Validates if the given board and class combination is allowed.
 * @param {string} board - The requested board (e.g., 'CBSE', 'JAC')
 * @param {string} studentClass - The requested class (e.g., '6', '12')
 * @returns {boolean} True if the combination is valid, false otherwise.
 */
const isValidCombination = (board, studentClass) => {
  if (!VALID_CLASS_BOARD_MAP[board]) return false;
  return VALID_CLASS_BOARD_MAP[board].includes(String(studentClass));
};

module.exports = {
  VALID_CLASS_BOARD_MAP,
  isValidCombination
};
