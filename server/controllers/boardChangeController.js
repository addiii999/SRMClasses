const User = require('../models/User');
const BoardChangeRequest = require('../models/BoardChangeRequest');
const Notification = require('../models/Notification');
const Branch = require('../models/Branch'); // Required for nested populate/index registration
const Admin = require('../models/Admin');   // Required for resolvedBy populate

const COOLDOWN_HOURS = 24;

// ─── Helper: send student notification ───────────────────────────────────────
const sendStudentNotification = async ({ title, message, type, studentId, relatedId }) => {
  try {
    await Notification.create({ title, message, type, targetStudent: studentId, relatedId: relatedId || null });
  } catch (e) {
    console.error('[BoardChange Notification Error]', e.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/board-change/request  — Student submits a board change request
// ─────────────────────────────────────────────────────────────────────────────
exports.requestBoardChange = async (req, res) => {
  try {
    const { requestedBoard } = req.body;
    const student = req.user;

    if (!requestedBoard) {
      return res.status(400).json({ success: false, message: 'Requested board is required' });
    }

    const validBoards = ['CBSE', 'ICSE', 'JAC'];
    if (!validBoards.includes(requestedBoard)) {
      return res.status(400).json({ success: false, message: 'Invalid board selected' });
    }

    if (requestedBoard === student.board) {
      return res.status(400).json({ success: false, message: 'You are already on this board' });
    }

    // 🔒 Check board change limit
    if (student.boardChangeCount >= 3) {
      return res.status(403).json({
        success: false,
        message: 'Board change limit reached. Contact admin to reset.',
        code: 'BOARD_CHANGE_LIMIT_REACHED',
        boardChangeCount: student.boardChangeCount,
      });
    }

    // 🔒 Check for existing pending request
    const existingPending = await BoardChangeRequest.findOne({
      student: student._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending board change request. Please wait for admin response.',
        code: 'PENDING_REQUEST_EXISTS',
        existingRequest: existingPending,
      });
    }

    // 🔒 24-hour cooldown: check most recent request (any status)
    const lastRequest = await BoardChangeRequest.findOne({
      student: student._id,
    }).sort({ requestedAt: -1 });

    if (lastRequest) {
      const hoursSinceLast = (Date.now() - new Date(lastRequest.requestedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < COOLDOWN_HOURS) {
        const remainingMs = (COOLDOWN_HOURS * 60 * 60 * 1000) - (Date.now() - new Date(lastRequest.requestedAt).getTime());
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        return res.status(429).json({
          success: false,
          message: `Next board change request available after cooldown period.`,
          code: 'COOLDOWN_ACTIVE',
          cooldownRemainingMs: remainingMs,
          cooldownRemainingHours: remainingHours,
          cooldownRemainingMinutes: remainingMinutes,
          nextAvailableAt: new Date(new Date(lastRequest.requestedAt).getTime() + COOLDOWN_HOURS * 60 * 60 * 1000),
        });
      }
    }

    // ✅ Create the request
    const boardRequest = await BoardChangeRequest.create({
      student: student._id,
      currentBoard: student.board,
      requestedBoard,
      status: 'pending',
      requestedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Board change request submitted. Admin will review it shortly.',
      data: boardRequest,
      remainingChanges: 3 - student.boardChangeCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/board-change/my-requests  — Student views own requests
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyBoardRequests = async (req, res) => {
  try {
    const requests = await BoardChangeRequest.find({ student: req.user._id })
      .sort({ requestedAt: -1 })
      .lean();

    // Calculate cooldown info
    const lastRequest = requests[0] || null;
    let cooldownInfo = null;

    if (lastRequest) {
      const hoursSinceLast = (Date.now() - new Date(lastRequest.requestedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < COOLDOWN_HOURS) {
        const remainingMs = (COOLDOWN_HOURS * 60 * 60 * 1000) - (Date.now() - new Date(lastRequest.requestedAt).getTime());
        cooldownInfo = {
          active: true,
          remainingMs,
          nextAvailableAt: new Date(new Date(lastRequest.requestedAt).getTime() + COOLDOWN_HOURS * 60 * 60 * 1000),
        };
      }
    }

    res.json({
      success: true,
      data: requests,
      boardChangeCount: req.user.boardChangeCount,
      remainingChanges: Math.max(0, 3 - req.user.boardChangeCount),
      limitReached: req.user.boardChangeCount >= 3,
      cooldown: cooldownInfo,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/board-change-requests  — Admin lists all pending requests
// ─────────────────────────────────────────────────────────────────────────────
exports.getBoardChangeRequests = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await BoardChangeRequest.countDocuments({ status });
    const requests = await BoardChangeRequest.find({ status })
      .populate({
        path: 'student',
        select: 'name studentId studentClass branch board',
        populate: { path: 'branch', select: 'name' } // Populate branch name too
      })
      .populate('resolvedBy', 'name adminId')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: requests,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/board-change-requests/:id/approve
// ─────────────────────────────────────────────────────────────────────────────
exports.approveBoardChange = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const boardRequest = await BoardChangeRequest.findById(req.params.id).populate('student');

    if (!boardRequest) return res.status(404).json({ success: false, message: 'Request not found' });
    if (boardRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been resolved' });
    }

    const student = await User.findById(boardRequest.student._id || boardRequest.student);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const adminName = req.admin ? `${req.admin.name} (${req.admin.adminId})` : 'Admin';
    const oldBoard = student.board;

    // Update board
    student.board = boardRequest.requestedBoard;
    student.boardChangeCount = (student.boardChangeCount || 0) + 1;

    // If limit now reached, auto-clear pending requests
    if (student.boardChangeCount >= 3) {
      await BoardChangeRequest.updateMany(
        { student: student._id, status: 'pending' },
        { status: 'rejected', adminNote: 'Auto-rejected: board change limit reached', resolvedAt: new Date() }
      );
    }

    student.addProfileHistory({
      field: 'board',
      oldValue: oldBoard,
      newValue: boardRequest.requestedBoard,
      changedBy: 'admin',
      adminId: req.admin._id,
      changedAt: new Date(),
    });

    student.addAdminAuditLog({
      action: 'approve_board_change',
      field: 'board',
      oldValue: oldBoard,
      newValue: boardRequest.requestedBoard,
      adminId: req.admin._id,
      adminName,
      timestamp: new Date(),
    });

    await student.save();

    // Update the request
    boardRequest.status = 'approved';
    boardRequest.resolvedAt = new Date();
    boardRequest.resolvedBy = req.admin._id;
    boardRequest.adminNote = adminNote || null;
    boardRequest.notified = true;
    await boardRequest.save();

    // Notification
    const remaining = Math.max(0, 3 - student.boardChangeCount);
    await sendStudentNotification({
      title: 'Board Change Approved',
      message: `Your board change request from ${oldBoard} to ${boardRequest.requestedBoard} has been approved. ${remaining > 0 ? `You have ${remaining} change${remaining === 1 ? '' : 's'} remaining.` : 'You have reached the board change limit.'}`,
      type: 'board_change_approved',
      studentId: student._id,
      relatedId: boardRequest._id,
    });

    res.json({
      success: true,
      message: `Board changed from ${oldBoard} to ${boardRequest.requestedBoard}. BoardChangeCount: ${student.boardChangeCount}/3`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/board-change-requests/:id/reject
// ─────────────────────────────────────────────────────────────────────────────
exports.rejectBoardChange = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const boardRequest = await BoardChangeRequest.findById(req.params.id);

    if (!boardRequest) return res.status(404).json({ success: false, message: 'Request not found' });
    if (boardRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been resolved' });
    }

    boardRequest.status = 'rejected';
    boardRequest.resolvedAt = new Date();
    boardRequest.resolvedBy = req.admin._id;
    boardRequest.adminNote = adminNote || null;
    boardRequest.notified = true;
    await boardRequest.save();

    // Notification
    await sendStudentNotification({
      title: 'Board Change Request Rejected',
      message: adminNote
        ? `Your board change request was rejected. Reason: ${adminNote}`
        : 'Your board change request has been rejected. Contact admin for more information.',
      type: 'board_change_rejected',
      studentId: boardRequest.student,
      relatedId: boardRequest._id,
    });

    res.json({ success: true, message: 'Board change request rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
