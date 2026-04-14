const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ─── Class Progression Map ────────────────────────────────────────────────────
const CLASS_PROGRESSION = {
  '5': '6', '6': '7', '7': '8', '8': '9', '9': '10',
  '10': '11', '11': '12', '12': 'Graduated'
};

// ─── Auto-generate next academic year ─────────────────────────────────────────
const getNextAcademicYear = (currentYear) => {
  // e.g. "2025-26" → "2026-27"
  if (currentYear && /^\d{4}-\d{2}$/.test(currentYear)) {
    const [start] = currentYear.split('-');
    const nextStart = parseInt(start) + 1;
    const nextEnd = String(nextStart + 1).slice(-2);
    return `${nextStart}-${nextEnd}`;
  }
  // Fallback: generate from current calendar year
  const now = new Date();
  const year = now.getFullYear();
  return `${year}-${String(year + 1).slice(-2)}`;
};

// ─── Core single-student promotion logic (reusable) ────────────────────────────
const performPromotion = async (student, { targetAcademicYear, feeAction, adminName, adminId, session }) => {
  const fromClass = student.studentClass;
  const toClass = CLASS_PROGRESSION[fromClass];

  if (!toClass) {
    throw new Error(`Invalid class for promotion: ${fromClass}`);
  }

  // 1. Archive current class state into classHistory
  student.classHistory.push({
    class: fromClass,
    board: student.board,
    batch: student.batch || null,
    academicYear: student.academicYear || null,
    promotedAt: new Date(),
  });

  if (toClass === 'Graduated') {
    // ── Graduate the student ──────────────────────────────────────────────
    student.registrationStatus = 'Graduated';
    student.isEnrolled = false;
    student.batch = null;

    student.enrollmentLogs.push({
      status: 'graduated',
      updatedBy: adminName,
      updatedAt: new Date(),
    });

    student.addAdminAuditLog({
      action: 'promote',
      field: 'studentClass',
      oldValue: `Class ${fromClass} (${student.academicYear || 'N/A'})`,
      newValue: `Graduated`,
      adminId,
      adminName,
      timestamp: new Date(),
    });

  } else {
    // ── Promote to next class ─────────────────────────────────────────────
    student.studentClass = toClass;
    student.academicYear = targetAcademicYear;

    // Class 11/12 → always Commerce, no choice
    if (['11', '12'].includes(toClass)) {
      student.feeType = 'Commerce Advance';
    } else if (feeAction === 'reset') {
      student.feeType = 'None';
      student.feeSnapshot = { actualFee: 0, satPercentage: 0, installmentPlan: 1 };
      // Archive payments but DO NOT delete — add a log entry instead
      student.paymentLogs.push({
        actionType: 'edit',
        paymentId: new mongoose.Types.ObjectId(),
        oldValue: { reason: 'Promotion Reset', previousClass: fromClass, previousFee: student.feeSnapshot?.actualFee || 0 },
        newValue: { feeType: 'None' },
        updatedBy: adminName,
        updatedAt: new Date(),
      });
    }
    // If feeAction === 'keep' → do nothing to fee

    // registrationFeeApplicable = false (already paid before)
    student.registrationFeeApplicable = false;

    // Reset batch → must be re-assigned by admin
    student.batch = null;

    student.addAdminAuditLog({
      action: 'promote',
      field: 'studentClass',
      oldValue: `Class ${fromClass} (${student.academicYear ? getNextAcademicYear(targetAcademicYear) : 'N/A'})`,
      newValue: `Class ${toClass} (${targetAcademicYear})`,
      adminId,
      adminName,
      timestamp: new Date(),
    });

    // Send in-app notification
    try {
      await Notification.create([{
        title: 'Class Promotion Successful 🎉',
        message: `Congratulations! You have been promoted from Class ${fromClass} to Class ${toClass} for academic year ${targetAcademicYear}.`,
        type: 'info',
        targetStudent: student._id,
        relatedId: null,
      }], session ? { session } : {});
    } catch (e) {
      console.error('[Promotion Notification Error]', e.message);
    }
  }

  await student.save(session ? { session } : {});
  return { fromClass, toClass, studentId: student.studentId, name: student.name };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/promotion-preview
// Returns list of students who will be affected before bulk promote
// ─────────────────────────────────────────────────────────────────────────────
exports.getPromotionPreview = async (req, res) => {
  try {
    const { fromClass, branch } = req.query;
    if (!fromClass) {
      return res.status(400).json({ success: false, message: 'fromClass is required' });
    }

    const query = {
      role: 'student',
      registrationStatus: 'Active',
      studentClass: fromClass,
    };
    if (branch) query.branch = branch;

    const students = await User.find(query)
      .select('name studentId studentClass academicYear batch')
      .sort({ name: 1 });

    const toClass = CLASS_PROGRESSION[fromClass];
    const targetAcademicYear = getNextAcademicYear(
      students[0]?.academicYear || null
    );

    res.json({
      success: true,
      data: {
        count: students.length,
        fromClass,
        toClass: toClass || 'Graduated',
        targetAcademicYear,
        students: students.map(s => ({
          _id: s._id,
          name: s.name,
          studentId: s.studentId,
          currentClass: s.studentClass,
          academicYear: s.academicYear,
          batch: s.batch,
        })),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/students/:id/promote
// Promote a single student individually
// ─────────────────────────────────────────────────────────────────────────────
exports.promoteSingleStudent = async (req, res) => {
  try {
    const { targetAcademicYear, feeAction = 'reset' } = req.body;
    const adminName = req.admin?.email || 'Admin';
    const adminId = req.admin?._id;

    if (!targetAcademicYear) {
      return res.status(400).json({ success: false, message: 'targetAcademicYear is required' });
    }

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    if (student.registrationStatus === 'Graduated') {
      return res.status(400).json({ success: false, message: 'Student has already graduated' });
    }
    if (student.registrationStatus !== 'Active') {
      return res.status(400).json({ success: false, message: 'Only Active students can be promoted' });
    }

    const result = await performPromotion(student, {
      targetAcademicYear,
      feeAction,
      adminName,
      adminId,
    });

    res.json({
      success: true,
      message: `Promoted ${result.name} from Class ${result.fromClass} → ${result.toClass}`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/students/promote-bulk
// Bulk promote all students of a class with MongoDB transactions (rollback on error)
// ─────────────────────────────────────────────────────────────────────────────
exports.promoteBulkStudents = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fromClass, branch, targetAcademicYear, feeAction = 'reset' } = req.body;
    const adminName = req.admin?.email || 'Admin';
    const adminId = req.admin?._id;

    if (!fromClass || !targetAcademicYear) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'fromClass and targetAcademicYear are required' });
    }

    const query = {
      role: 'student',
      registrationStatus: 'Active',
      studentClass: fromClass,
    };
    if (branch) query.branch = branch;

    const students = await User.find(query).session(session);

    if (students.length === 0) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: `No active students found in Class ${fromClass}` });
    }

    const results = [];
    // Promote each student — any error aborts all (transaction)
    for (const student of students) {
      const result = await performPromotion(student, {
        targetAcademicYear,
        feeAction,
        adminName,
        adminId,
        session,
      });
      results.push(result);
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `Successfully promoted ${results.length} students from Class ${fromClass} → ${CLASS_PROGRESSION[fromClass]}`,
      data: {
        promoted: results.length,
        students: results,
      },
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: `Bulk promotion failed and was rolled back. Reason: ${error.message}`,
    });
  }
};
