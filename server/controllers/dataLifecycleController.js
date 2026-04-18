/**
 * dataLifecycleController.js
 *
 * Production-grade Student Data Lifecycle Management
 * Handles: Archive → Download (Export) → Safe Soft-Delete → Cron Purge
 *
 * Permission Model:
 *   adminProtect  → can archive, view lists, export (BLOCKED: export restricted to SUPER_ADMIN)
 *   superAdminOnly → export, soft-delete, restore-from-delete
 */

const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const User = require('../models/User');
const ArchivedStudent = require('../models/ArchivedStudent');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const { deleteFromCloudinary } = require('../utils/cloudinary');

// ─── Helper: extract client IP ────────────────────────────────────────────────
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

// ─── Helper: create a SUPER_ADMIN system notification ─────────────────────────
const notifySuperAdmins = async (title, message, type = 'system_alert') => {
  try {
    const superAdmins = await Admin.find({ role: 'SUPER_ADMIN', isActive: true }).select('_id').lean();
    const notifications = superAdmins.map((sa) => ({
      title,
      message,
      type,
      targetAdmin: sa._id,
    }));
    // Use insertMany — if this fails we log but never throw (cron must not crash)
    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { ordered: false });
    }
  } catch (e) {
    console.error('[Lifecycle] Failed to notify super admins:', e.message);
  }
};

// ─── Helper: build common filter query ────────────────────────────────────────
const buildFilter = (query, collection = 'active') => {
  const { studentClass, board, batch, year, search } = query;
  const filter = {};

  if (collection === 'active') {
    filter.role = 'student';
    filter.isArchived = { $ne: true };
    filter.isDeleted = { $ne: true };
  } else if (collection === 'archived') {
    filter.isArchived = true;
    filter.isDeleted = { $ne: true };
  } else if (collection === 'deleted') {
    filter.isArchived = true;
    filter.isDeleted = true;
  }

  if (studentClass) filter.studentClass = studentClass;
  if (board) filter.board = board;
  if (batch) filter.batch = batch;
  if (year) {
    const y = parseInt(year, 10);
    if (!isNaN(y)) {
      filter.originalCreatedAt = filter.originalCreatedAt || {};
      filter.originalCreatedAt.$gte = new Date(y, 0, 1);
      filter.originalCreatedAt.$lt = new Date(y + 1, 0, 1);
    }
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lifecycle/archive/preview
// Returns count + sample rows for the archive filters (no side effects)
// ─────────────────────────────────────────────────────────────────────────────
exports.getArchivePreview = async (req, res) => {
  try {
    const filter = buildFilter(req.query, 'active');
    const total = await User.countDocuments(filter);
    const sample = await User.find(filter)
      .select('name studentId studentClass board batch academicYear createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.json({ success: true, data: { total, sample } });
  } catch (error) {
    console.error('[Lifecycle] getArchivePreview error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lifecycle/archive
// Bulk move active students → ArchivedStudent collection (atomic with rollback)
// Body: { studentIds: [...], reason: "...", filters: {...} }
// ─────────────────────────────────────────────────────────────────────────────
exports.archiveStudents = async (req, res) => {
  const { studentIds, reason, filters } = req.body;
  const adminEmail = req.admin.email;
  const adminRole = req.admin.role;
  const ip = getClientIP(req);

  // ── Validate reason ──────────────────────────────────────────────────────
  if (!reason || reason.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Archive reason is required and must be at least 10 characters.',
    });
  }

  // ── Resolve IDs to archive ───────────────────────────────────────────────
  let idsToArchive = [];
  if (studentIds && studentIds.length > 0) {
    idsToArchive = studentIds;
  } else if (filters) {
    const filterQuery = buildFilter(filters, 'active');
    const students = await User.find(filterQuery).select('_id').lean();
    idsToArchive = students.map((s) => s._id.toString());
  }

  if (idsToArchive.length === 0) {
    return res.status(400).json({ success: false, message: 'No students selected for archiving.' });
  }

  // ── Fetch full student documents ─────────────────────────────────────────
  const students = await User.find({
    _id: { $in: idsToArchive },
    isArchived: { $ne: true },
    isDeleted: { $ne: true },
  }).lean();

  if (students.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No eligible students found. They may already be archived.',
    });
  }

  const alreadyArchived = idsToArchive.length - students.length;
  const now = new Date();

  // ── Build ArchivedStudent documents ─────────────────────────────────────
  const archiveDocs = students.map((s) => ({
    originalUserId: s._id,
    name: s.name,
    email: s.email,
    mobile: s.mobile,
    mobileVerified: s.mobileVerified,
    parentName: s.parentName,
    parentContact: s.parentContact,
    schoolName: s.schoolName,
    address: s.address,
    studentClass: s.studentClass,
    branch: s.branch,
    board: s.board,
    batch: s.batch,
    boardChangeCount: s.boardChangeCount,
    role: s.role,
    studentId: s.studentId,
    shouldChangePassword: s.shouldChangePassword,
    createdByAdmin: s.createdByAdmin,
    registrationStatus: s.registrationStatus,
    isApproved: s.isApproved,
    isActive: s.isActive,
    isStudent: s.isStudent,
    isEnrolled: s.isEnrolled,
    verificationStatus: s.verificationStatus,
    rejectedAt: s.rejectedAt,
    enrollmentLogs: s.enrollmentLogs,
    academicYear: s.academicYear,
    classHistory: s.classHistory,
    feeType: s.feeType,
    registrationFeeApplicable: s.registrationFeeApplicable,
    feeSnapshot: s.feeSnapshot,
    payments: s.payments,
    paymentLogs: s.paymentLogs,
    profileHistory: s.profileHistory,
    adminAuditLog: s.adminAuditLog,
    photo: s.photo || { url: null, public_id: null },
    originalCreatedAt: s.createdAt,
    originalUpdatedAt: s.updatedAt,
    // Lifecycle fields
    isArchived: true,
    archivedAt: now,
    archivedBy: adminEmail,
    archiveReason: reason.trim(),
    isDeleted: false,
    lifecycleLog: [{
      action: 'archived',
      performedBy: adminEmail,
      performedByRole: adminRole,
      performedAt: now,
      note: reason.trim(),
      ipAddress: ip,
    }],
  }));

  // ── ATOMIC ARCHIVE with manual rollback ───────────────────────────────────
  // Phase 1: Insert into ArchivedStudent
  let insertedIds = [];
  const failedStudents = [];
  const succeededStudents = [];

  for (const doc of archiveDocs) {
    try {
      const inserted = await ArchivedStudent.create(doc);
      insertedIds.push(inserted._id);
      succeededStudents.push({ name: doc.name, studentId: doc.studentId });
    } catch (insertErr) {
      // E11000 = duplicate (already archived from a previous partial run)
      failedStudents.push({
        name: doc.name,
        studentId: doc.studentId,
        originalUserId: doc.originalUserId,
        reason: insertErr.code === 11000 ? 'Duplicate archive entry' : insertErr.message,
      });
    }
  }

  // Phase 2: If ANY inserts failed, rollback ALL successful inserts
  if (failedStudents.length > 0) {
    try {
      await ArchivedStudent.deleteMany({ _id: { $in: insertedIds } });
    } catch (rollbackErr) {
      console.error('[Lifecycle] CRITICAL: Rollback failed after partial archive:', rollbackErr.message);
    }

    return res.status(207).json({
      success: false,
      message: `Archive failed for ${failedStudents.length} student(s). All changes rolled back.`,
      data: {
        succeeded: [],
        failed: failedStudents,
        rolledBack: true,
      },
    });
  }

  // Phase 3: All inserts succeeded → delete from active User collection
  const archivedUserIds = students.map((s) => s._id);
  await User.deleteMany({ _id: { $in: archivedUserIds } });

  return res.status(200).json({
    success: true,
    message: `Successfully archived ${succeededStudents.length} student(s)${alreadyArchived > 0 ? ` (${alreadyArchived} were already archived and skipped)` : ''}.`,
    data: {
      archivedCount: succeededStudents.length,
      skippedCount: alreadyArchived,
      archived: succeededStudents,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lifecycle/archive
// List archived students with filters + pagination
// ─────────────────────────────────────────────────────────────────────────────
exports.getArchivedStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = buildFilter(req.query, 'archived');
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [total, students] = await Promise.all([
      ArchivedStudent.countDocuments(filter),
      ArchivedStudent.find(filter)
        .select('-parentContact -adminAuditLog -profileHistory -password')
        .populate('branch', 'name')
        .sort({ archivedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
    ]);

    return res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[Lifecycle] getArchivedStudents error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lifecycle/archive/restore
// Restore one or many archived students back to active User collection.
// Body: { archivedIds: [...] }
// ─────────────────────────────────────────────────────────────────────────────
exports.restoreFromArchive = async (req, res) => {
  const { archivedIds } = req.body;
  const adminEmail = req.admin.email;
  const adminRole = req.admin.role;
  const ip = getClientIP(req);

  if (!archivedIds || archivedIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No archived IDs provided.' });
  }

  const records = await ArchivedStudent.find({
    _id: { $in: archivedIds },
    isArchived: true,
    isDeleted: { $ne: true },
  }).lean();

  if (records.length === 0) {
    return res.status(404).json({ success: false, message: 'No eligible archived records found.' });
  }

  const failedRestores = [];
  const restoredStudents = [];

  for (const record of records) {
    // ── DUPLICATE MOBILE CHECK ────────────────────────────────────────────
    const existingActive = await User.findOne({ mobile: record.mobile });
    if (existingActive) {
      failedRestores.push({
        name: record.name,
        studentId: record.studentId,
        reason: 'Active account with same mobile already exists.',
      });
      continue;
    }

    // ── Rebuild User document ─────────────────────────────────────────────
    try {
      const {
        _id, originalUserId, isArchived, archivedAt, archivedBy, archiveReason,
        isDeleted, deletedAt, deletedBy, lifecycleLog,
        originalCreatedAt, originalUpdatedAt,
        createdAt, updatedAt, // ArchivedStudent's own timestamps
        photo,
        ...userFields
      } = record;

      await User.create({
        ...userFields,
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        // password is not in ArchivedStudent — set a placeholder
        // (student will need to reset via OTP; this is acceptable)
        password: '$2b$12$PLACEHOLDER_RESET_REQUIRED',
        shouldChangePassword: true,
      });

      // Append to lifecycleLog on archived record before deleting it
      await ArchivedStudent.updateOne(
        { _id: record._id },
        {
          $push: {
            lifecycleLog: {
              action: 'restore_from_archive',
              performedBy: adminEmail,
              performedByRole: adminRole,
              performedAt: new Date(),
              note: 'Restored to active student collection',
              ipAddress: ip,
            },
          },
        }
      );

      // Remove from archive
      await ArchivedStudent.deleteOne({ _id: record._id });

      restoredStudents.push({ name: record.name, studentId: record.studentId });
    } catch (err) {
      failedRestores.push({
        name: record.name,
        studentId: record.studentId,
        reason: err.message,
      });
    }
  }

  return res.json({
    success: failedRestores.length === 0,
    message: `Restored ${restoredStudents.length} student(s). ${failedRestores.length > 0 ? `${failedRestores.length} failed.` : ''}`,
    data: { restored: restoredStudents, failed: failedRestores },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lifecycle/export
// Export active OR archived student data as Excel. SUPER_ADMIN ONLY.
// Body: { collection: 'active'|'archived', filters: {...} }
// ─────────────────────────────────────────────────────────────────────────────
exports.exportStudents = async (req, res) => {
  const { collection = 'active', filters = {} } = req.body;
  const adminEmail = req.admin.email;
  const adminRole = req.admin.role;
  const ip = getClientIP(req);

  // ── SUPER_ADMIN gate (enforced in route too, but double-check) ────────────
  if (adminRole !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Export is restricted to SUPER_ADMIN only.',
    });
  }

  const filter = buildFilter({ ...filters }, collection);
  const Model = collection === 'active' ? User : ArchivedStudent;

  // ── Pagination / streaming for large datasets ─────────────────────────────
  const PAGE_SIZE = 500;
  let page = 0;
  let total = 0;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SRM Classes Admin';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Students');
  sheet.columns = [
    { header: 'Student Name', key: 'name', width: 25 },
    { header: 'Student Mobile', key: 'mobile', width: 18 },
    { header: 'Parent Name', key: 'parentName', width: 25 },
    { header: 'Parent Contact', key: 'parentContact', width: 18 },
    { header: 'Address', key: 'address', width: 35 },
    { header: 'Class', key: 'studentClass', width: 10 },
    { header: 'Board', key: 'board', width: 10 },
    { header: 'Batch', key: 'batch', width: 15 },
    { header: 'Academic Year', key: 'academicYear', width: 15 },
    { header: 'Student ID', key: 'studentId', width: 18 },
    { header: 'School Name', key: 'schoolName', width: 30 },
    { header: 'Registration Status', key: 'registrationStatus', width: 20 },
    { header: 'Admission Date', key: 'createdAt', width: 20 },
  ];

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF9787F3' },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Stream pages
  while (true) {
    const batch = await Model.find(filter)
      .select('name mobile parentName parentContact address studentClass board batch academicYear studentId schoolName registrationStatus createdAt originalCreatedAt')
      .skip(page * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    if (batch.length === 0) break;
    total += batch.length;

    batch.forEach((s) => {
      sheet.addRow({
        name: s.name || '',
        mobile: s.mobile || '',
        parentName: s.parentName || '',
        parentContact: s.parentContact || '',
        address: s.address || '',
        studentClass: s.studentClass ? `Class ${s.studentClass}` : '',
        board: s.board || '',
        batch: s.batch || '',
        academicYear: s.academicYear || '',
        studentId: s.studentId || '',
        schoolName: s.schoolName || '',
        registrationStatus: s.registrationStatus || '',
        createdAt: new Date(s.originalCreatedAt || s.createdAt).toLocaleDateString('en-IN'),
      });
    });

    page++;
  }

  // ── Log export to lifecycle audit (system notification) ──────────────────
  const exportNote = `Exported ${total} ${collection} students by ${adminEmail} from ${ip}`;
  console.log('[Lifecycle Export]', exportNote);

  await notifySuperAdmins(
    '📊 Data Export Performed',
    exportNote,
    'lifecycle_export'
  );

  // ── Build filename ────────────────────────────────────────────────────────
  const classStr = filters.studentClass ? `Class${filters.studentClass}` : 'AllClasses';
  const boardStr = filters.board || 'AllBoards';
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `students_export_${classStr}_${boardStr}_${dateStr}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lifecycle/delete
// Soft-delete archived students (30-day recovery window). SUPER_ADMIN ONLY.
// Body: { archivedIds: [...], confirmText: "DELETE 5" }
// ─────────────────────────────────────────────────────────────────────────────
exports.softDeleteArchived = async (req, res) => {
  const { archivedIds, confirmText } = req.body;
  const adminEmail = req.admin.email;
  const adminRole = req.admin.role;
  const ip = getClientIP(req);

  if (!archivedIds || archivedIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No student IDs provided.' });
  }

  // ── 3-Step confirmation: must type "DELETE <count>" exactly ──────────────
  const expectedText = `DELETE ${archivedIds.length}`;
  if (!confirmText || confirmText.trim() !== expectedText) {
    return res.status(400).json({
      success: false,
      message: `Confirmation text mismatch. Expected: "${expectedText}". Got: "${confirmText}".`,
    });
  }

  const records = await ArchivedStudent.find({
    _id: { $in: archivedIds },
    isArchived: true,
    isDeleted: { $ne: true },
  });

  if (records.length === 0) {
    return res.status(404).json({ success: false, message: 'No eligible archived records found.' });
  }

  const now = new Date();
  for (const record of records) {
    record.isDeleted = true;
    record.deletedAt = now;
    record.deletedBy = adminEmail;
    record.lifecycleLog.push({
      action: 'soft_deleted',
      performedBy: adminEmail,
      performedByRole: adminRole,
      performedAt: now,
      note: `Marked for permanent deletion. 30-day recovery window starts now.`,
      ipAddress: ip,
    });
    await record.save();
  }

  return res.json({
    success: true,
    message: `${records.length} student(s) moved to 30-day deletion window. Permanent deletion will occur after 30 days.`,
    data: { markedCount: records.length, purgeDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lifecycle/deleted
// List soft-deleted archived students still in recovery window
// ─────────────────────────────────────────────────────────────────────────────
exports.getDeletedArchivedStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = buildFilter(req.query, 'deleted');
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const now = new Date();

    const [total, records] = await Promise.all([
      ArchivedStudent.countDocuments(filter),
      ArchivedStudent.find(filter)
        .select('-parentContact -adminAuditLog -profileHistory -password')
        .populate('branch', 'name')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
    ]);

    // Annotate with remaining days
    const enriched = records.map((r) => {
      const deletedAt = new Date(r.deletedAt);
      const diffMs = now - deletedAt;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, 30 - diffDays);
      return { ...r, remainingDays };
    });

    return res.json({
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
    console.error('[Lifecycle] getDeletedArchivedStudents error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lifecycle/deleted/restore
// Restore soft-deleted records back to archived state. SUPER_ADMIN ONLY.
// Body: { archivedIds: [...] }
// ─────────────────────────────────────────────────────────────────────────────
exports.restoreDeletedArchived = async (req, res) => {
  const { archivedIds } = req.body;
  const adminEmail = req.admin.email;
  const adminRole = req.admin.role;
  const ip = getClientIP(req);

  if (!archivedIds || archivedIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No IDs provided.' });
  }

  const records = await ArchivedStudent.find({
    _id: { $in: archivedIds },
    isDeleted: true,
  });

  if (records.length === 0) {
    return res.status(404).json({ success: false, message: 'No deleted records found.' });
  }

  for (const record of records) {
    record.isDeleted = false;
    record.deletedAt = null;
    record.deletedBy = null;
    record.lifecycleLog.push({
      action: 'restored_from_delete',
      performedBy: adminEmail,
      performedByRole: adminRole,
      performedAt: new Date(),
      note: 'Restored from 30-day deletion window back to archive.',
      ipAddress: ip,
    });
    await record.save();
  }

  return res.json({
    success: true,
    message: `${records.length} student(s) restored from deletion window.`,
    data: { restoredCount: records.length },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lifecycle/logs
// Lifecycle audit log — recent archive/delete actions. SUPER_ADMIN preferred.
// ─────────────────────────────────────────────────────────────────────────────
exports.getLifecycleLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregate lifecycleLog entries from BOTH archived (active) and deleted records
    const pipeline = [
      {
        $match: {
          $or: [{ isArchived: true }, { isDeleted: true }],
        },
      },
      { $unwind: '$lifecycleLog' },
      {
        $project: {
          name: 1,
          studentId: 1,
          studentClass: 1,
          board: 1,
          action: '$lifecycleLog.action',
          performedBy: '$lifecycleLog.performedBy',
          performedByRole: '$lifecycleLog.performedByRole',
          performedAt: '$lifecycleLog.performedAt',
          note: '$lifecycleLog.note',
          ipAddress: '$lifecycleLog.ipAddress',
        },
      },
      { $sort: { performedAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ];

    const logs = await ArchivedStudent.aggregate(pipeline);
    const total = await ArchivedStudent.aggregate([
      { $match: { $or: [{ isArchived: true }, { isDeleted: true }] } },
      { $unwind: '$lifecycleLog' },
      { $count: 'total' },
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        total: total[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((total[0]?.total || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[Lifecycle] getLifecycleLogs error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CRON FUNCTION (not a route) — called by cronJobs.js
// Permanently purge ArchivedStudents with isDeleted=true older than 30 days
// ─────────────────────────────────────────────────────────────────────────────
exports.purgeDeletedStudents = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  console.log('[Lifecycle Cron] Starting ArchivedStudent purge...');

  try {
    const toPurge = await ArchivedStudent.find({
      isDeleted: true,
      deletedAt: { $lt: cutoff },
    }).lean();

    if (toPurge.length === 0) {
      console.log('[Lifecycle Cron] No records eligible for purge.');
      return;
    }

    console.log(`[Lifecycle Cron] Purging ${toPurge.length} permanently deleted archived student(s)...`);

    for (const record of toPurge) {
      // ── Cloudinary cleanup — only if photo.public_id is set ──────────────
      if (record.photo && record.photo.public_id) {
        try {
          await deleteFromCloudinary(record.photo.public_id, 'image');
          console.log(`[Lifecycle Cron] Deleted Cloudinary asset: ${record.photo.public_id}`);
        } catch (cloudErr) {
          // Skip silently — do not block purge
          console.warn(`[Lifecycle Cron] Cloudinary delete skipped for ${record.photo.public_id}:`, cloudErr.message);
        }
      }
    }

    const purgeIds = toPurge.map((r) => r._id);
    await ArchivedStudent.deleteMany({ _id: { $in: purgeIds } });

    console.log(`[Lifecycle Cron] ✅ Purged ${toPurge.length} archived student record(s).`);
  } catch (cronError) {
    const errMsg = `ArchivedStudent purge cron failed: ${cronError.message}`;
    console.error('[Lifecycle Cron] ❌', errMsg);

    // Notify SUPER_ADMIN via in-app notification
    await notifySuperAdmins(
      '🚨 Cron Job Failure: Student Purge',
      `The scheduled 30-day student purge job encountered an error. Please investigate immediately.\n\nError: ${cronError.message}`,
      'system_alert'
    );
  }
};
