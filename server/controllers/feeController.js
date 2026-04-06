const User = require('../models/User');
const { FEE_STRUCTURE, calculateFeeDetails } = require('../utils/feeUtils');
const mongoose = require('mongoose');

/**
 * @desc    Get all students with their fee status
 * @route   GET /api/fees/students
 * @access  Private/Admin
 */
exports.getStudentsFeeStats = async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const filter = { role: 'student', isStudent: true };
    
    if (status === 'removed') {
      filter.isEnrolled = false;
    } else {
      filter.isEnrolled = true;
    }

    const students = await User.find(filter).sort({ createdAt: -1 });
    
    const studentsWithFees = students.map(student => {
      const feeDetails = calculateFeeDetails(student);
      return {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        mobile: student.mobile,
        studentClass: student.studentClass,
        feeType: student.feeType,
        ...feeDetails
      };
    });

    res.status(200).json({
      success: true,
      count: studentsWithFees.length,
      data: studentsWithFees
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update student fee settings (SAT, Plan, Type)
 * @route   PUT /api/fees/settings/:id
 * @access  Private/Admin
 */
exports.updateStudentFeeSettings = async (req, res) => {
  try {
    const { feeType, satPercentage, installmentPlan } = req.body;
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Validation
    if (satPercentage > 100 || satPercentage < 0) {
      return res.status(400).json({ success: false, message: 'SAT Percentage must be 0-100' });
    }
    if (installmentPlan > 6 || installmentPlan < 1) {
      return res.status(400).json({ success: false, message: 'Installments must be 1-6' });
    }

    // Auto-assign actualFee from structure
    let actualFee = 0;
    if (feeType !== 'None' && FEE_STRUCTURE[feeType]) {
      actualFee = FEE_STRUCTURE[feeType][student.studentClass] || 0;
    }

    // Audit Info
    const adminName = req.admin ? req.admin.email : 'Admin'; // Assuming req.admin from adminProtect

    // If student has existing payments, we should warn or keep track.
    // For now, we update the snapshot as requested.
    student.feeType = feeType;
    student.feeSnapshot = {
      actualFee,
      satPercentage,
      installmentPlan,
      updatedBy: adminName,
      updatedAt: Date.now()
    };

    await student.save();

    res.status(200).json({
      success: true,
      data: student,
      message: 'Fee settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Add a payment for a student
 * @route   POST /api/fees/payment/:id
 * @access  Private/Admin
 */
exports.addPayment = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    // Recalculate payable to check for overpayment
    const feeDetails = calculateFeeDetails(student);
    const totalAfterThis = feeDetails.paidAmount + amount;

    if (totalAfterThis > feeDetails.payableAmount) {
      return res.status(400).json({
        success: false, 
        message: `Amount exceeds payable fee. Max possible: ₹${feeDetails.payableAmount - feeDetails.paidAmount}`
      });
    }

    // Atomic update
    const updatedUser = await User.findByIdAndUpdate(req.params.id, {
      $push: {
        payments: {
          amount,
          method,
          date: Date.now()
        }
      }
    }, { new: true }).select('-password');
    
    // Add the calculated dynamic fields to the response object
    const finalStudentData = {
      ...updatedUser.toObject(),
      ...calculateFeeDetails(updatedUser)
    };

    res.status(200).json({
      success: true,
      message: 'Payment added successfully',
      data: finalStudentData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Edit a payment
 * @route   PUT /api/fees/payment/:id/:paymentId
 * @access  Private/Admin
 */
exports.editPayment = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const payment = student.payments.id(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment entry not found' });
    }

    const oldValue = { amount: payment.amount, method: payment.method };
    
    // Check for overpayment after edit
    const currentPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
    const newPaidTotal = currentPaid - payment.amount + amount;
    const feeDetails = calculateFeeDetails(student);

    if (newPaidTotal > feeDetails.payableAmount) {
      return res.status(400).json({ success: false, message: 'Edited amount exceeds payable fee' });
    }

    const adminName = req.admin ? req.admin.email : 'Admin';

    // Log the change
    student.paymentLogs.push({
      actionType: 'edit',
      paymentId: payment._id,
      oldValue,
      newValue: { amount, method },
      updatedBy: adminName,
      updatedAt: Date.now()
    });

    // Update the payment
    payment.amount = amount;
    payment.method = method;

    await student.save();

    const finalStudentData = {
      ...student.toObject(),
      ...calculateFeeDetails(student)
    };

    res.status(200).json({ success: true, message: 'Payment updated successfully', data: finalStudentData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete a payment
 * @route   DELETE /api/fees/payment/:id/:paymentId
 * @access  Private/Admin
 */
exports.deletePayment = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const payment = student.payments.id(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const adminName = req.admin ? req.admin.email : 'Admin';

    // Log deletion
    student.paymentLogs.push({
      actionType: 'delete',
      paymentId: payment._id,
      oldValue: { amount: payment.amount, method: payment.method },
      updatedBy: adminName,
      updatedAt: Date.now()
    });

    // Remove payment
    student.payments.pull(req.params.paymentId);
    await student.save();

    const finalStudentData = {
      ...student.toObject(),
      ...calculateFeeDetails(student)
    };

    res.status(200).json({ success: true, message: 'Payment deleted successfully', data: finalStudentData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get current student's fee details
 * @route   GET /api/fees/my-fee
 * @access  Private/Student
 */
exports.getMyFeeStats = async (req, res) => {
  try {
    // req.user is populated by protect middleware
    const student = await User.findById(req.user.id);
    const feeDetails = calculateFeeDetails(student);

    res.status(200).json({
      success: true,
      data: {
        name: student.name,
        studentClass: student.studentClass,
        ...feeDetails,
        payments: student.payments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
/**
 * @desc    Remove a student from Fee System (not delete)
 * @route   PATCH /api/fees/remove/:id
 * @access  Private/Admin
 */
exports.removeStudentFromFees = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!student.isStudent) {
      return res.status(400).json({ success: false, message: 'User is not a verified student' });
    }

    // Safety: Prevent admin self-removal or tampering if they are somehow a student
    if (student.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be removed from enrollment' });
    }

    const adminName = req.user ? req.user.email : 'Admin';

    student.isEnrolled = false;
    student.enrollmentLogs.push({
      status: 'removed',
      updatedBy: adminName,
      updatedAt: Date.now()
    });

    await student.save();

    res.status(200).json({ success: true, message: 'Student removed from Fee Management view' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Restore a student to Fee System
 * @route   PATCH /api/fees/restore/:id
 * @access  Private/Admin
 */
exports.restoreStudentToFees = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!student.isStudent) {
      return res.status(400).json({ success: false, message: 'User is not a verified student' });
    }

    const adminName = req.user ? req.user.email : 'Admin';

    student.isEnrolled = true;
    student.enrollmentLogs.push({
      status: 'enrolled',
      updatedBy: adminName,
      updatedAt: Date.now()
    });

    await student.save();

    res.status(200).json({ success: true, message: 'Student restored to Fee Management' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
