const User = require('../models/User');

/**
 * @desc    Get all pending student registrations (unverified)
 * @route   GET /api/admin/students/pending
 * @access  Private/Admin
 */
exports.getPendingStudents = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const students = await User.find({ role: 'student', verificationStatus: status }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Approve a student and generate a professional Student ID
 * @route   PUT /api/admin/students/approve/:id
 * @access  Private/Admin
 */
exports.approveStudent = async (req, res) => {
  try {
    const { sessionYear, studentClass } = req.body;
    
    if (!sessionYear || !studentClass) {
      return res.status(400).json({ success: false, message: 'Session Year and Class are required for approval' });
    }

    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (student.verificationStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'User is already an approved student' });
    }

    // Generate Student ID: SRM-YYYY-CC-SEQ (Gen-Z Style)
    // Example: SRM-2026-10-001
    const yearPart = sessionYear;
    const classPart = studentClass.toString().padStart(2, '0');
    
    // Find how many students already exist for this Year and Class to determine sequence
    const pattern = new RegExp(`^SRM-${yearPart}-${classPart}-`);
    const count = await User.countDocuments({ studentId: { $regex: pattern } });
    const sequence = (count + 1).toString().padStart(3, '0');
    
    const newStudentId = `SRM-${yearPart}-${classPart}-${sequence}`;

    const adminName = req.user ? req.user.email : 'Admin';

    student.isStudent = true;
    student.isEnrolled = true;
    student.studentId = newStudentId;
    student.studentClass = studentClass;
    student.verificationStatus = 'approved';
    student.enrollmentLogs.push({
      status: 'enrolled',
      updatedBy: adminName,
      updatedAt: Date.now()
    });
    
    await student.save();

    res.status(200).json({ 
      success: true, 
      message: 'Student approved successfully', 
      data: { studentId: newStudentId } 
    });
  } catch (error) {
    // Handle duplicate key error if sequence logic fails
    if (error.code === 11000) {
        return res.status(500).json({ success: false, message: 'ID Generation Conflict. Please try again.' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Reject/Delete a registration
 * @route   DELETE /api/admin/students/reject/:id
 * @access  Private/Admin
 */
exports.rejectStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (student.verificationStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'Cannot reject an already approved student' });
    }

    student.verificationStatus = 'rejected';
    student.isStudent = false; 
    await student.save();

    res.status(200).json({ success: true, message: 'Registration rejected. User will remain as a normal user.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

