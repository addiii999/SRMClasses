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
    
    // Find the highest sequence number already used for this pattern (handling both formats for compatibility during transition)
    const pattern = new RegExp(`^(${branchPart}${yearPart.toString().slice(-2)}${classPart}|SRM-${yearPart}-${branchPart}-${classPart}-)`);
    const lastStudent = await User.findOne({ studentId: { $regex: pattern } })
      .sort({ studentId: -1 })
      .select('studentId')
      .lean();

    let sequence = '001';
    if (lastStudent && lastStudent.studentId) {
      // Extract last 3 digits
      const lastIdStr = lastStudent.studentId.toString();
      const lastSeq = lastIdStr.slice(-3);
      if (!isNaN(lastSeq)) {
        sequence = (parseInt(lastSeq) + 1).toString().padStart(3, '0');
      }
    }
    
    // Build COMPRESSED ID: RI2605001 (BranchPrefix + ShortYear + Class + Seq)
    const shortYear = yearPart.toString().slice(-2);
    return `${branchPart}${shortYear}${classPart}${sequence}`;
  } catch (error) {
    throw error;
  }
};

module.exports = { generateStudentId };
