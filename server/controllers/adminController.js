const User = require('../models/User');
const Admin = require('../models/Admin');
const Branch = require('../models/Branch');
const Notification = require('../models/Notification');
const { generateStudentId } = require('../utils/studentIdGenerator');
const { validateBatchAssignment, BATCH_NAMES } = require('../utils/batchConstants');

// ─── Field Permission Table ────────────────────────────────────────────────────
// Fields admin can edit on a student record
const ADMIN_EDITABLE_FIELDS = [
  'name', 'studentClass', 'board', 'branch',
  'parentName', 'parentContact', 'schoolName', 'address',
];

const { isValidCombination } = require('../utils/boardConstraints');

// Helper: create a student-specific notification
const sendStudentNotification = async ({ title, message, type, studentId, relatedId }) => {
  try {
    await Notification.create({
      title,
      message,
      type,
      targetStudent: studentId,
      relatedId: relatedId || null,
    });
  } catch (e) {
    console.error('[Notification Error]', e.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/students  — Full list with filters, tabs, search, pagination
// ─────────────────────────────────────────────────────────────────────────────
exports.getStudentList = async (req, res) => {
  try {
    const {
      status = 'Pending',
      branch, board, studentClass,
      search, page = 1, limit = 20,
    } = req.query;

    const query = { role: 'student', registrationStatus: status };
    if (branch) query.branch = branch;
    if (board) query.board = board;
    if (studentClass) query.studentClass = studentClass;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    // STRICT: parentContact NEVER in list response
    const students = await User.find(query)
      .select('-parentContact -password -resetOTP -resetOTPExpiry -profileHistory -adminAuditLog')
      .populate('branch', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Check pending board requests for badge
    const BoardChangeRequest = require('../models/BoardChangeRequest');
    const studentIds = students.map(s => s._id);
    const pendingRequests = await BoardChangeRequest.find({
      student: { $in: studentIds },
      status: 'pending',
    }).select('student').lean();
    const pendingRequestStudentIds = new Set(pendingRequests.map(r => r.student.toString()));

    const enriched = students.map(s => ({
      ...s,
      hasPendingBoardRequest: pendingRequestStudentIds.has(s._id.toString()),
      isUnassignedBatch: !s.batch && s.registrationStatus === 'Active',
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/students/:id  — Full detail (includes parentContact)
// ─────────────────────────────────────────────────────────────────────────────
exports.getStudentDetail = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('-password -resetOTP -resetOTPExpiry')
      .populate('branch', 'name')
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const BoardChangeRequest = require('../models/BoardChangeRequest');
    const boardRequests = await BoardChangeRequest.find({ student: student._id })
      .sort({ requestedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { ...student, boardChangeRequests: boardRequests },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/students/pending  — Legacy support
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingStudents = async (req, res) => {
  req.query.status = req.query.status || 'Pending';
  return exports.getStudentList(req, res);
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/students/approve/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.approveStudent = async (req, res) => {
  try {
    const { sessionYear, studentClass, branchId, board, overrideReason } = req.body;

    if (!sessionYear || !studentClass || !branchId) {
      return res.status(400).json({ success: false, message: 'Session Year, Class, and Branch are required for approval' });
    }

    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'User not found' });

    if (student.registrationStatus === 'Active') {
      return res.status(400).json({ success: false, message: 'Student is already approved' });
    }

    const studentBoard = board || student.board || 'CBSE';

    if (!isValidCombination(studentBoard, studentClass)) {
      if (req.body.overrideBoardClassValidation !== true) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_BOARD_CLASS_COMBINATION',
          message: `Board (${studentBoard}) is not valid for Class ${studentClass}`,
        });
      }
      
      // Log the override
      const adminName = req.admin ? `${req.admin.name} (${req.admin.adminId})` : 'Admin';
      student.addAdminAuditLog({
        action: 'validate_override',
        field: 'board_class_combo',
        oldValue: 'Rejected',
        newValue: 'Overridden',
        adminId: req.admin._id,
        adminName,
        timestamp: new Date(),
        overrideReason: overrideReason || 'No reason provided',
      });
    }

    const branchDoc = await Branch.findById(branchId);
    if (!branchDoc) return res.status(404).json({ success: false, message: 'Branch not found' });

    const newStudentId = await generateStudentId(sessionYear, studentClass, branchDoc);
    const adminName = req.admin ? `${req.admin.name} (${req.admin.adminId})` : 'Admin';

    // Update student
    student.isStudent = true;
    student.isEnrolled = true;
    student.studentId = newStudentId;
    student.studentClass = studentClass;
    student.board = studentBoard;
    student.branch = branchDoc._id;
    student.registrationStatus = 'Active';
    student.isApproved = true;
    student.verificationStatus = 'approved';

    student.enrollmentLogs.push({ status: 'enrolled', updatedBy: adminName, updatedAt: Date.now() });

    // Audit log
    student.addAdminAuditLog({
      action: 'approve',
      field: null,
      oldValue: 'Pending',
      newValue: 'Active',
      adminId: req.admin._id,
      adminName,
      timestamp: new Date(),
    });

    await student.save();

    // In-app notification
    await sendStudentNotification({
      title: 'Registration Approved!',
      message: `Congratulations! Your registration has been approved. Your Student ID is ${newStudentId}. You can now login to your dashboard.`,
      type: 'registration_approved',
      studentId: student._id,
    });

    res.json({ success: true, message: 'Student approved successfully', data: { studentId: newStudentId } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(500).json({ success: false, message: 'ID Generation Conflict. Please try again.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/students/reject/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.rejectStudent = async (req, res) => {
  try {
    const { reason } = req.body;
    const student = await User.findById(req.params.id);

    if (!student) return res.status(404).json({ success: false, message: 'User not found' });

    if (student.registrationStatus === 'Active') {
      return res.status(400).json({ success: false, message: 'Cannot reject an already approved student' });
    }

    const adminName = req.admin ? `${req.admin.name} (${req.admin.adminId})` : 'Admin';

    student.registrationStatus = 'Rejected';
    student.isApproved = false;
    student.isStudent = false;
    student.verificationStatus = 'rejected';
    student.rejectedAt = new Date();

    student.addAdminAuditLog({
      action: 'reject',
      field: null,
      oldValue: student.registrationStatus,
      newValue: 'Rejected',
      adminId: req.admin._id,
      adminName,
      timestamp: new Date(),
    });

    await student.save();

    // In-app notification with rejection reason
    await sendStudentNotification({
      title: 'Registration Update',
      message: reason
        ? `Your registration has been rejected. Reason: ${reason}`
        : 'Your registration has been rejected. Please contact admin for more information.',
      type: 'registration_rejected',
      studentId: student._id,
    });

    res.json({ success: true, message: 'Registration rejected successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/students/:id  — Admin updates student fields
// ─────────────────────────────────────────────────────────────────────────────
exports.updateStudentByAdmin = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const adminName = req.admin ? `${req.admin.name} (${req.admin.adminId})` : 'Admin';
    const historyUpdates = [];
    const auditUpdates = [];

    for (const field of ADMIN_EDITABLE_FIELDS) {
      if (req.body[field] === undefined) continue;

      let newValue = req.body[field];
      const oldValue = student[field];

      // Special validation for board+class combination
      if (field === 'board' || field === 'studentClass') {
        const checkBoard = field === 'board' ? newValue : (req.body.board || student.board);
        const checkClass = field === 'studentClass' ? newValue : (req.body.studentClass || student.studentClass);
        
        if (!isValidCombination(checkBoard, checkClass)) {
          if (req.body.overrideBoardClassValidation !== true) {
            return res.status(400).json({
              success: false,
              code: 'INVALID_BOARD_CLASS_COMBINATION',
              message: `Board (${checkBoard}) is not valid for Class ${checkClass}`,
            });
          }
          
          if (!student.overrideLogged) { // prevent double logging in the loop
            auditUpdates.push({
              field: 'board_class_combo',
              oldValue: 'Rejected',
              newValue: 'Overridden',
              action: 'validate_override',
              adminId: req.admin._id,
              adminName,
              timestamp: new Date(),
              overrideReason: req.body.overrideReason || 'No reason provided',
            });
            student.overrideLogged = true;
          }
        }
      }

      if (field === 'branch') {
        const branchDoc = await Branch.findById(newValue);
        if (!branchDoc) return res.status(400).json({ success: false, message: 'Invalid branch' });
        newValue = branchDoc._id;
      }

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        // 1. MAIN USER DATA must update FIRST
        student[field] = newValue;

        const entry = {
          field,
          oldValue: oldValue?.toString ? oldValue.toString() : oldValue,
          newValue: newValue?.toString ? newValue.toString() : newValue,
          changedBy: 'admin',
          adminId: req.admin._id,
          adminName,
          timestamp: new Date(),
        };

        historyUpdates.push(entry);
        auditUpdates.push({ ...entry, action: 'update_field' });
      }
    }

    if (historyUpdates.length > 0) {
      // 2. Then profileHistory must log the change
      historyUpdates.forEach(e => {
        student.addProfileHistory({
          field: e.field,
          oldValue: e.oldValue,
          newValue: e.newValue,
          changedBy: e.changedBy,
          adminId: e.adminId,
          changedAt: e.timestamp
        });
      });
      auditUpdates.forEach(e => student.addAdminAuditLog(e));
      
      // Save user document
      await student.save();
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      updatedFields: historyUpdates.map(e => e.field),
      updatedUser: student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/students/:id/assign-batch
// ─────────────────────────────────────────────────────────────────────────────
exports.assignBatch = async (req, res) => {
  try {
    const { batch } = req.body;

    if (!batch) return res.status(400).json({ success: false, message: 'Batch name is required' });

    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (student.registrationStatus !== 'Active') {
      return res.status(400).json({ success: false, message: 'Batch can only be assigned to active students' });
    }

    // Validate batch against student's board and class
    const validation = validateBatchAssignment(batch, student.board, student.studentClass);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const oldBatch = student.batch;
    const adminName = req.admin ? `${req.admin.name} (${req.admin.adminId})` : 'Admin';

    student.batch = batch;

    student.addProfileHistory({
      field: 'batch',
      oldValue: oldBatch,
      newValue: batch,
      changedBy: 'admin',
      adminId: req.admin._id,
      changedAt: new Date(),
    });

    student.addAdminAuditLog({
      action: 'assign_batch',
      field: 'batch',
      oldValue: oldBatch,
      newValue: batch,
      adminId: req.admin._id,
      adminName,
      timestamp: new Date(),
    });

    await student.save();

    // In-app notification
    await sendStudentNotification({
      title: 'Batch Assigned',
      message: `You have been assigned to ${batch}. Login to your dashboard to view your batch details.`,
      type: 'batch_assigned',
      studentId: student._id,
    });

    res.json({ success: true, message: `Student assigned to ${batch} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/students/:id/reset-board-count  — SUPER_ADMIN only
// ─────────────────────────────────────────────────────────────────────────────
exports.resetBoardChangeCount = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const oldCount = student.boardChangeCount;
    const adminName = req.admin ? `${req.admin.name} (${req.admin.adminId})` : 'Admin';

    student.boardChangeCount = 0;

    student.addAdminAuditLog({
      action: 'reset_board_count',
      field: 'boardChangeCount',
      oldValue: oldCount,
      newValue: 0,
      adminId: req.admin._id,
      adminName,
      timestamp: new Date(),
    });

    await student.save();

    res.json({ success: true, message: `Board change count reset from ${oldCount} to 0` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/audit-logs
// SUPER_ADMIN: all students' logs | ADMIN: only their own actions
// ─────────────────────────────────────────────────────────────────────────────
exports.getAdminAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let matchFilter = {};
    if (req.admin.role !== 'SUPER_ADMIN') {
      // ADMIN: only see logs where they took action
      matchFilter = { 'adminAuditLog.adminId': req.admin._id };
    }

    const students = await User.find(matchFilter)
      .select('name studentId adminAuditLog')
      .lean();

    // Flatten all audit logs with student context
    let allLogs = [];
    for (const student of students) {
      if (!student.adminAuditLog || student.adminAuditLog.length === 0) continue;

      let logs = student.adminAuditLog;

      // Filter for ADMIN to only show their own
      if (req.admin.role !== 'SUPER_ADMIN') {
        logs = logs.filter(log => log.adminId?.toString() === req.admin._id.toString());
      }

      logs.forEach(log => {
        allLogs.push({
          ...log,
          studentName: student.name,
          studentId: student.studentId || 'N/A',
          studentDocId: student._id,
        });
      });
    }

    // Sort by timestamp desc
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = allLogs.length;
    const paginated = allLogs.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/create-admin  — SUPER_ADMIN only
// ─────────────────────────────────────────────────────────────────────────────
exports.createAdminAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An admin with this email already exists' });
    }

    const newAdmin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'ADMIN', // UI can only create ADMIN, not SUPER_ADMIN
      createdBy: req.admin._id,
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        adminId: newAdmin.adminId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/admins  — SUPER_ADMIN only
// ─────────────────────────────────────────────────────────────────────────────
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select('-password -otp -otpExpiry')
      .lean();
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/admins/:id/deactivate  — SUPER_ADMIN only
// Cannot deactivate another SUPER_ADMIN
// ─────────────────────────────────────────────────────────────────────────────
exports.deactivateAdmin = async (req, res) => {
  try {
    const target = await Admin.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (target.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate a SUPER_ADMIN account' });
    }

    target.isActive = !target.isActive;
    await target.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Admin ${target.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: target.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/admins/:id  — SUPER_ADMIN only
// Enforces: cannot delete last SUPER_ADMIN; cannot delete other SUPER_ADMINs
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteAdmin = async (req, res) => {
  try {
    const target = await Admin.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Admin not found' });

    // Cannot delete SUPER_ADMIN accounts through UI
    if (target.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete a SUPER_ADMIN account.',
      });
    }

    // Additional protection: if trying to delete yourself
    if (target._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Admin account permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/users/create  — Manual Student Creation by Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const { name, email, mobile, studentClass, password, branch, board, parentName, parentContact, schoolName, address, overrideReason } = req.body;

    if (!name || !email || !mobile || !studentClass || !password || !branch) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    const studentBoard = board || 'CBSE';
    if (!isValidCombination(studentBoard, studentClass)) {
      if (req.body.overrideBoardClassValidation !== true) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_BOARD_CLASS_COMBINATION',
          message: `Board ${studentBoard} is not valid for Class ${studentClass}`,
        });
      }
      // Assuming we log this via event since user isn't created yet, 
      // but in manual creation we can add the audit log after creation.
      req.overrideBoardClass = true; // flag to save in audit later
    }

    if (parentContact && mobile === parentContact) {
      return res.status(400).json({
        success: false,
        message: 'Student mobile number and parent contact cannot be the same',
      });
    }

    const branchDoc = await Branch.findById(branch);
    if (!branchDoc) return res.status(404).json({ success: false, message: 'Branch not found' });

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { mobile }] });
    if (existing) return res.status(400).json({ success: false, message: 'Email or Mobile already registered' });

    const sessionYear = new Date().getFullYear().toString();
    const studentId = await generateStudentId(sessionYear, studentClass, branchDoc);

    const adminName = req.admin ? `${req.admin.name} (${req.admin.adminId})` : 'Admin';

    const user = await User.create({
      name, email: email.toLowerCase(), mobile, studentClass,
      password, branch, board: studentBoard, studentId,
      parentName: parentName || null,
      parentContact: parentContact || null,
      schoolName: schoolName || null,
      address: address || null,
      isStudent: true, isEnrolled: true,
      registrationStatus: 'Active',
      isApproved: true,
      verificationStatus: 'approved',
      mobileVerified: true,
      shouldChangePassword: true,
      createdByAdmin: true,
      enrollmentLogs: [{ status: 'enrolled', updatedBy: adminName, updatedAt: Date.now() }],
    });

    // Log admin action
    user.addAdminAuditLog({
      action: 'manual_create',
      field: null,
      oldValue: null,
      newValue: 'Created by admin',
      adminId: req.admin._id,
      adminName,
      timestamp: new Date(),
    });

    if (req.overrideBoardClass) {
      user.addAdminAuditLog({
        action: 'validate_override',
        field: 'board_class_combo',
        oldValue: 'Rejected',
        newValue: 'Overridden',
        adminId: req.admin._id,
        adminName,
        timestamp: new Date(),
        overrideReason: overrideReason || 'Manual creation override',
      });
    }

    await user.save({ validateBeforeSave: false });

    res.status(201).json({ success: true, data: { studentId: user.studentId, name: user.name }, message: 'Student created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/student-stats
// ─────────────────────────────────────────────────────────────────────────────
exports.getStudentStats = async (req, res) => {
  try {
    const { branch } = req.query;
    let baseQuery = { isStudent: true };
    if (branch) baseQuery.branch = branch;

    const [totalStudents, activeStudents, pendingStudents, unassignedBatch] = await Promise.all([
      User.countDocuments(baseQuery),
      User.countDocuments({ ...baseQuery, registrationStatus: 'Active' }),
      User.countDocuments({ ...baseQuery, registrationStatus: 'Pending' }),
      User.countDocuments({ ...baseQuery, registrationStatus: 'Active', batch: null }),
    ]);

    // Count pending board change requests
    const BoardChangeRequest = require('../models/BoardChangeRequest');
    const pendingBoardRequests = await BoardChangeRequest.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: { totalStudents, activeStudents, pendingStudents, unassignedBatch, pendingBoardRequests },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/audit-logs
// ─────────────────────────────────────────────────────────────────────────────
exports.getAdminAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, showDeleted } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Filter Logic:
    // 1. Role Check: ADMIN sees only their own logs. SUPER_ADMIN sees all.
    // 2. Soft-Delete Check: Hide deleted logs unless showDeleted is true (SUPER_ADMIN only)
    
    let matchFilter = {};
    const isSuperAdmin = req.admin.role === 'SUPER_ADMIN';
    
    if (isSuperAdmin) {
      if (showDeleted !== 'true') {
        matchFilter['adminAuditLog.isDeleted'] = { $ne: true };
      }
    } else {
      // Regular ADMIN: only own logs AND never see deleted logs
      matchFilter['adminAuditLog.adminId'] = req.admin._id;
      matchFilter['adminAuditLog.isDeleted'] = { $ne: true };
    }

    const pipeline = [
      { $unwind: '$adminAuditLog' },
      { $match: matchFilter },
      { $sort: { 'adminAuditLog.timestamp': -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      { $project: {
          studentName: '$name',
          studentId: '$studentId',
          studentDocId: '$_id',
          log: '$adminAuditLog'
        }
      }
    ];

    const logs = await User.aggregate(pipeline);

    const countPipeline = [
      { $unwind: '$adminAuditLog' },
      { $match: matchFilter },
      { $count: 'total' }
    ];
    const totalResult = await User.aggregate(countPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      success: true,
      data: logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/audit-logs/:studentId/:logId  — SUPER_ADMIN only
// ─────────────────────────────────────────────────────────────────────────────
exports.softDeleteAuditLog = async (req, res) => {
  try {
    const { studentId, logId } = req.params;
    const { reason } = req.body;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student document not found' });

    const logIndex = student.adminAuditLog.findIndex(l => l._id.toString() === logId);
    if (logIndex === -1) return res.status(404).json({ success: false, message: 'Audit log entry not found' });

    const logToHide = student.adminAuditLog[logIndex];
    if (logToHide.isDeleted) return res.status(400).json({ success: false, message: 'Log is already deleted' });

    // Mark as deleted
    logToHide.isDeleted = true;
    logToHide.deletedAt = new Date();
    logToHide.deletedBy = req.admin._id;

    // MANDATORY AUDIT OF AUDIT: Create a NEW log entry
    const adminName = req.admin ? `${req.admin.name} (${req.admin.adminId})` : 'Admin';
    student.addAdminAuditLog({
      action: 'AUDIT_LOG_DELETED',
      field: 'adminAuditLog',
      oldValue: `Action: ${logToHide.action}`,
      newValue: reason || 'Audit log soft-deleted by Super Admin',
      adminId: req.admin._id,
      adminName,
      timestamp: new Date(),
    });

    await student.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Audit log soft-deleted successfully and recorded.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/admins (Super Admin only - managed via routes middleware)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').lean();
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/create-admin (Super Admin only)
// ─────────────────────────────────────────────────────────────────────────────
exports.createAdminAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already taken by another admin' });
    }

    // Generate unique adminId
    const count = await Admin.countDocuments();
    const adminId = `ADM-${String(count + 1).padStart(3, '0')}`;

    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password, // Pre-save hook hashes it
      role: 'ADMIN', // Cannot create SUPER_ADMIN via UI
      adminId,
      createdBy: req.admin._id,
    });

    res.status(201).json({ success: true, message: 'Admin account created successfully', data: { name: admin.name, adminId: admin.adminId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/admins/:id/toggle-active (Super Admin only)
// ─────────────────────────────────────────────────────────────────────────────
exports.deactivateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    
    if (admin.role === 'SUPER_ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot deactivate a SUPER_ADMIN' });
    }

    admin.isActive = !admin.isActive;
    await admin.save();
    
    res.json({ success: true, message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`, isActive: admin.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/admins/:id (Super Admin only)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    
    if (admin.role === 'SUPER_ADMIN') {
      // Check if there are other super admins
      const superAdminCount = await Admin.countDocuments({ role: 'SUPER_ADMIN' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last SUPER_ADMIN. Create another SUPER_ADMIN first.' });
      }
    }

    await admin.deleteOne();
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
