const User = require('../models/User');

/**
 * Generate a professional Student ID: SRM-YYYY-BC-CC-SEQ
 * @param {string} sessionYear - e.g. 2024
 * @param {string} studentClass - e.g. 10
 * @param {Object} branchDoc - The branch document from DB
 * @returns {string} The generated Student ID
 */
const generateStudentId = async (sessionYear, studentClass, branchDoc) => {
  try {
    // BC = Branch Code (e.g. RAVI), CC = Class
    const yearPart = sessionYear;
    const codeRaw = branchDoc.branchCode.replace(/[0-9]/g, '').toUpperCase();
    const branchPart = codeRaw.charAt(0) + codeRaw.charAt(codeRaw.length - 1); // First and Last letter (e.g. RI, MR)
    const classPart = studentClass.toString().padStart(2, '0');
    
    // Find how many students already exist for this Year, Branch and Class to determine sequence
    const pattern = new RegExp(`^SRM-${yearPart}-${branchPart}-${classPart}-`);
    const count = await User.countDocuments({ studentId: { $regex: pattern } });
    const sequence = (count + 1).toString().padStart(3, '0');
    
    return `SRM-${yearPart}-${branchPart}-${classPart}-${sequence}`;
  } catch (error) {
    throw error;
  }
};

module.exports = { generateStudentId };
