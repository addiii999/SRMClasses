/**
 * Predefined Batch System Constants
 * These are the ONLY allowed batches — enforced on backend.
 */

const BATCH_DEFINITIONS = {
  'Foundation Batch': {
    allowedBoards: ['CBSE'],
    allowedClasses: ['5', '6', '7', '8', '9', '10'],
    description: 'CBSE only — Class 5 to 10',
  },
  'Advance Batch': {
    allowedBoards: ['ICSE'],
    allowedClasses: ['6', '7', '8', '9', '10'],
    description: 'ICSE only — Class 6 to 10',
  },
  'Core Batch': {
    allowedBoards: ['CBSE', 'ICSE'],
    allowedClasses: ['9', '10'],
    description: 'CBSE and ICSE — Class 9 and 10 only (Math/Science)',
  },
  'Commerce Batch': {
    allowedBoards: ['CBSE', 'ICSE'],
    allowedClasses: ['11', '12'],
    description: 'CBSE and ICSE — Class 11 and 12 only (Commerce)',
  },
};

const BATCH_NAMES = Object.keys(BATCH_DEFINITIONS);

/**
 * Validates if the given batch is compatible with student's board and class.
 * @returns {object} { valid: Boolean, message: String }
 */
const validateBatchAssignment = (batchName, board, studentClass) => {
  if (!BATCH_DEFINITIONS[batchName]) {
    return { valid: false, message: `Invalid batch name. Allowed: ${BATCH_NAMES.join(', ')}` };
  }

  const def = BATCH_DEFINITIONS[batchName];

  if (!def.allowedBoards.includes(board)) {
    return {
      valid: false,
      message: `${batchName} is only for ${def.allowedBoards.join(' or ')} students. This student is ${board}.`,
    };
  }

  if (!def.allowedClasses.includes(studentClass)) {
    return {
      valid: false,
      message: `${batchName} is only for Class ${def.allowedClasses.join(', ')}. This student is in Class ${studentClass}.`,
    };
  }

  return { valid: true, message: 'Batch assignment is valid' };
};

module.exports = { BATCH_DEFINITIONS, BATCH_NAMES, validateBatchAssignment };
