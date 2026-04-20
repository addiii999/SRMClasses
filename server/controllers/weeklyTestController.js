const WeeklyTest = require('../models/WeeklyTest');
const TestResult = require('../models/TestResult');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const GENERIC_SERVER_ERROR = 'Something went wrong. Please try again.';

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Create a new weekly test
// @route   POST /api/weekly-tests
const createTest = async (req, res) => {
  try {
    const { testName, subject, date, totalMarks, batch, board, branch, isAllBranches } = req.body;

    if (!testName || !subject || !date || !totalMarks || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!branch && !isAllBranches) {
      return res.status(400).json({ success: false, message: 'Branch selection is required (or select All Branches)' });
    }

    // NEW: Validation logic for Board-Class Relationship
    const validBoardClass = {
      'CBSE': ['5', '6', '7', '8', '9', '10', '11', '12'],
      'ICSE': ['6', '7', '8', '9', '10'],
      'JAC': ['11', '12'],
      'ALL': ['5', '6', '7', '8', '9', '10', '11', '12']
    };

    if (board && board !== 'ALL' && !validBoardClass[board].includes(batch)) {
      return res.status(400).json({
        success: false,
        message: `Board ${board} is only allowed for classes: ${validBoardClass[board].join(', ')}`,
      });
    }

    // Validation logic for Class 11-12 (Commerce only)
    if (['11', '12'].includes(batch)) {
      const allowedCommerceSubjects = ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English', 'Computer Science'];
      if (!allowedCommerceSubjects.includes(subject)) {
        return res.status(400).json({
          success: false,
          message: `For Class ${batch}, only Commerce subjects are allowed: ${allowedCommerceSubjects.join(', ')}`,
        });
      }
    }

    const test = await WeeklyTest.create({
      testName,
      subject,
      date,
      totalMarks: Number(totalMarks),
      batch,
      board: board || 'ALL',
      branch: isAllBranches ? undefined : branch,
      isAllBranches: !!isAllBranches,
    });
    res.status(201).json({ success: true, data: test, message: 'Test created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc    Get all tests with optional filters
// @route   GET /api/weekly-tests?batch=X&subject=Y&board=Z&branch=W
const getAllTests = async (req, res) => {
  try {
    const { batch, subject, board, branch } = req.query;
    const query = {};
    if (batch) query.batch = batch;
    
    if (branch === 'ALL') {
      // No branch filter needed, or filter for isAllBranches?
      // Usually, 'ALL' means see everything in the admin view
    } else if (branch) {
      query.$or = [{ branch }, { isAllBranches: true }];
    }

    if (board && board !== 'ALL') query.board = board;
    if (board === 'ALL') query.board = 'ALL';
    if (subject) query.subject = { $regex: subject, $options: 'i' };

    // Pagination logic
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const tests = await WeeklyTest.find(query)
      .select('testName subject date totalMarks batch board isPublished branch isAllBranches isLocked')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach result counts efficiently
    const testsWithCounts = await Promise.all(
      tests.map(async (test) => {
        const resultCount = await TestResult.countDocuments({ testId: test._id });
        return { ...test, resultCount };
      })
    );

    res.json({ success: true, data: testsWithCounts, page, limit });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc    Get single test with all student results
// @route   GET /api/weekly-tests/:id
const getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid test ID' });
    }

    const test = await WeeklyTest.findById(id).lean();
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const results = await TestResult.find({ testId: id })
      .select('studentId marksObtained createdAt')
      .populate('studentId', 'name studentId studentClass email branch board')
      .sort({ 'studentId.name': 1 })
      .lean();

    // Compute percentage for each result
    const resultsWithPercentage = results.map((r) => {
      const obj = r.toObject();
      if (obj.marksObtained === 'AB' || obj.marksObtained === 'ab') {
        obj.percentage = null;
        obj.isAbsent = true;
      } else {
        obj.percentage = test.totalMarks > 0
          ? Math.round((obj.marksObtained / test.totalMarks) * 100 * 100) / 100
          : 0;
        obj.isAbsent = false;
      }
      return obj;
    });

    // Get all verified/enrolled students of this batch who DON'T have results yet
    const studentsWithResults = results.map((r) => r.studentId?._id?.toString());
    const studentQuery = {
      studentClass: test.batch,
      role: 'student',
      isStudent: true, // This covers 'Verified' (approved) students
      _id: { $nin: studentsWithResults },
    };

    if (!test.isAllBranches && test.branch) {
      studentQuery.branch = test.branch;
    }

    if (test.board !== 'ALL') {
      studentQuery.board = test.board;
    }

    const eligibleStudents = await User.find(studentQuery)
      .select('name studentId studentClass email board branch')
      .limit(200) // Safety limit for extreme batch sizes
      .lean();

    res.json({
      success: true,
      data: {
        test,
        results: resultsWithPercentage,
        eligibleStudents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc    Toggle lock/unlock a test
// @route   PATCH /api/weekly-tests/:id/lock
const toggleLock = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid test ID' });
    }

    const test = await WeeklyTest.findById(id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    test.isLocked = !test.isLocked;
    await test.save();

    res.json({
      success: true,
      data: test,
      message: test.isLocked ? 'Test locked successfully' : 'Test unlocked successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc    Delete (soft) a test
// @route   DELETE /api/weekly-tests/:id
const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid test ID' });
    }

    const test = await WeeklyTest.findById(id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const adminEmail = req.admin ? req.admin.email : 'Admin';
    await test.softDelete(adminEmail);

    res.json({ success: true, message: 'Test moved to Recycle Bin' });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc    Enter marks for a single student
// @route   POST /api/weekly-tests/:id/marks
const enterMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, marksObtained } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid test ID' });
    }

    const test = await WeeklyTest.findById(id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    if (test.isLocked) {
      return res.status(403).json({ success: false, message: 'Test is locked — cannot edit marks' });
    }

    // Validate student and test constraints
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!student.isStudent) return res.status(400).json({ success: false, message: 'Student is not verified' });
    if (student.studentClass !== test.batch) return res.status(400).json({ success: false, message: `Student class (${student.studentClass}) does not match test batch (${test.batch})` });
    if (!test.isAllBranches && test.branch && student.branch?.toString() !== test.branch.toString()) {
      return res.status(400).json({ success: false, message: 'Student branch does not match test branch' });
    }
    if (test.board !== 'ALL' && student.board !== test.board) {
      return res.status(400).json({ success: false, message: `Student board (${student.board}) does not match test board (${test.board})` });
    }

    // Validate marks
    const marks = String(marksObtained).trim().toUpperCase();
    let finalMarks;
    if (marks === 'AB') {
      finalMarks = 'AB';
    } else {
      const numMarks = Number(marks);
      if (isNaN(numMarks) || numMarks < 0) {
        return res.status(400).json({ success: false, message: 'Marks must be a non-negative number or "AB"' });
      }
      if (numMarks > test.totalMarks) {
        return res.status(400).json({ success: false, message: `Marks cannot exceed total marks (${test.totalMarks})` });
      }
      finalMarks = numMarks;
    }

    // Upsert the result
    const result = await TestResult.findOneAndUpdate(
      { testId: id, studentId },
      { marksObtained: finalMarks },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: result, message: 'Marks saved successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate entry for this student' });
    }
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc    Bulk import marks from Excel
// @route   POST /api/weekly-tests/:id/import
const bulkImportMarks = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid test ID' });
    }

    const test = await WeeklyTest.findById(id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    if (test.isLocked) {
      return res.status(403).json({ success: false, message: 'Test is locked — cannot import marks' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
    }

    // Parse Excel from memory buffer (no disk I/O — production safe)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      return res.status(400).json({ success: false, message: 'Excel file has no worksheets' });
    }

    const successful = [];
    const failed = [];

    // Iterate rows (skip header row 1)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const studentIdVal = row.getCell(1).value?.toString().trim();
      const studentName = row.getCell(2).value?.toString().trim();
      const marksVal = row.getCell(3).value?.toString().trim().toUpperCase();

      if (!studentIdVal) {
        failed.push({ row: rowNumber, studentId: studentIdVal, name: studentName, reason: 'StudentID is empty' });
        return;
      }

      if (!marksVal && marksVal !== '0') {
        failed.push({ row: rowNumber, studentId: studentIdVal, name: studentName, reason: 'MarksObtained is empty' });
        return;
      }

      // Queue for processing
      successful.push({ rowNumber, studentIdVal, studentName, marksVal });
    });

    // Process valid rows
    const finalSuccess = [];
    const finalFailed = [...failed];

    for (const item of successful) {
      try {
        // Find student by studentId field (e.g. RI-10001)
        const student = await User.findOne({ studentId: item.studentIdVal });
        if (!student) {
          finalFailed.push({
            row: item.rowNumber,
            studentId: item.studentIdVal,
            name: item.studentName,
            reason: 'Student ID not found in database',
          });
          continue;
        }

        if (!student.isStudent) {
          finalFailed.push({
            row: item.rowNumber,
            studentId: item.studentIdVal,
            name: item.studentName,
            reason: 'Student is not verified',
          });
          continue;
        }

        if (student.studentClass !== test.batch) {
          finalFailed.push({
            row: item.rowNumber,
            studentId: item.studentIdVal,
            name: item.studentName,
            reason: `Student class (${student.studentClass}) does not match test batch`,
          });
          continue;
        }

        if (!test.isAllBranches && test.branch && student.branch?.toString() !== test.branch.toString()) {
          finalFailed.push({
            row: item.rowNumber,
            studentId: item.studentIdVal,
            name: item.studentName,
            reason: 'Student branch does not match test branch',
          });
          continue;
        }

        if (test.board !== 'ALL' && student.board !== test.board) {
          finalFailed.push({
            row: item.rowNumber,
            studentId: item.studentIdVal,
            name: item.studentName,
            reason: `Student board (${student.board}) does not match test board`,
          });
          continue;
        }

        // Parse marks
        let finalMarks;
        if (item.marksVal === 'AB') {
          finalMarks = 'AB';
        } else {
          const num = Number(item.marksVal);
          if (isNaN(num) || num < 0) {
            finalFailed.push({
              row: item.rowNumber,
              studentId: item.studentIdVal,
              name: item.studentName,
              reason: 'Invalid marks format — must be a number or "AB"',
            });
            continue;
          }
          if (num > test.totalMarks) {
            finalFailed.push({
              row: item.rowNumber,
              studentId: item.studentIdVal,
              name: item.studentName,
              reason: `Marks (${num}) exceed total marks (${test.totalMarks})`,
            });
            continue;
          }
          finalMarks = num;
        }

        // Upsert result
        await TestResult.findOneAndUpdate(
          { testId: id, studentId: student._id },
          { marksObtained: finalMarks },
          { upsert: true, new: true, runValidators: true }
        );

        finalSuccess.push({
          row: item.rowNumber,
          studentId: item.studentIdVal,
          name: item.studentName,
          marks: finalMarks,
        });
      } catch (err) {
        finalFailed.push({
          row: item.rowNumber,
          studentId: item.studentIdVal,
          name: item.studentName,
          reason: err.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Import complete: ${finalSuccess.length} successful, ${finalFailed.length} failed`,
      data: {
        successCount: finalSuccess.length,
        failedCount: finalFailed.length,
        successful: finalSuccess,
        failed: finalFailed,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc    Download pre-formatted Excel template for a test's batch
// @route   GET /api/weekly-tests/:id/template
const downloadTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid test ID' });
    }

    const test = await WeeklyTest.findById(id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    // Get eligible students of this batch
    const studentQuery = {
      studentClass: test.batch,
      role: 'student',
      isStudent: true,
    };
    if (!test.isAllBranches && test.branch) {
      studentQuery.branch = test.branch;
    }
    if (test.board !== 'ALL') {
      studentQuery.board = test.board;
    }

    const students = await User.find(studentQuery).select('name studentId').sort({ name: 1 });

    // Build Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SRM Classes';
    const worksheet = workbook.addWorksheet('Marks Entry');

    // Header row
    worksheet.columns = [
      { header: 'StudentID', key: 'studentId', width: 20 },
      { header: 'StudentName', key: 'studentName', width: 30 },
      { header: 'MarksObtained', key: 'marksObtained', width: 18 },
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9787F3' },
    };
    headerRow.alignment = { horizontal: 'center' };

    // Add student rows
    students.forEach((s) => {
      worksheet.addRow({
        studentId: s.studentId || '',
        studentName: s.name,
        marksObtained: '',
      });
    });

    // Add instruction row
    worksheet.addRow({});
    const noteRow = worksheet.addRow({
      studentId: 'NOTE:',
      studentName: `Enter marks (0-${test.totalMarks}) or "AB" for absent`,
      marksObtained: '',
    });
    noteRow.font = { italic: true, color: { argb: 'FF666666' } };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=marks_template_class${test.batch}_${test.subject}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc    Publish results — create notification for batch
// @route   POST /api/weekly-tests/:id/publish
const publishResults = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid test ID' });
    }

    const test = await WeeklyTest.findById(id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    // Mark test as published
    test.isPublished = true;
    await test.save();

    // Create notification
    await Notification.create({
      title: 'Test Results Published',
      message: `Your ${test.subject} test "${test.testName}" results are now available!`,
      targetBatch: test.batch,
      type: 'test_result',
      relatedId: test._id,
    });

    res.json({ success: true, message: 'Results published and students notified!' });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Get all test results for the logged-in student
// @route   GET /api/weekly-tests/my-results
const getMyResults = async (req, res) => {
  try {
    // Student identity from JWT ONLY — never from URL params
    const studentId = req.user._id;
    const studentBoard = req.user.board || 'CBSE';
    const studentBranch = req.user.branch;

    const results = await TestResult.find({ studentId })
      .select('testId marksObtained createdAt')
      .populate({
        path: 'testId',
        match: {
          isPublished: true,
          board: { $in: [studentBoard, 'ALL'] },
          $or: [{ branch: studentBranch }, { isAllBranches: true }],
        },
        select: 'testName subject date totalMarks batch board isPublished branch isAllBranches',
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out results where testId (populated) is null (unpublished or deleted)
    const validResults = results
      .filter((r) => r.testId !== null)
      .map((r) => {
        const obj = r.toObject();
        if (obj.marksObtained === 'AB' || obj.marksObtained === 'ab') {
          obj.percentage = null;
          obj.isAbsent = true;
        } else {
          obj.percentage = obj.testId.totalMarks > 0
            ? Math.round((obj.marksObtained / obj.testId.totalMarks) * 100 * 100) / 100
            : 0;
          obj.isAbsent = false;
        }
        return obj;
      });

    res.json({ success: true, data: validResults });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc    Get notifications for student's batch
// @route   GET /api/weekly-tests/my-notifications
const getMyNotifications = async (req, res) => {
  try {
    const studentId = req.user._id;
    const studentClass = req.user.studentClass;
    const studentBoard = req.user.board || 'CBSE';
    const studentBranch = req.user.branch;

    // Fetch IDs of tests visible to this student (branch + board matching)
    const visibleTestIds = await WeeklyTest.find({
      board: { $in: [studentBoard, 'ALL'] },
      $or: [{ branch: studentBranch }, { isAllBranches: true }]
    }).distinct('_id');

    const notifications = await Notification.find({
      $and: [
        { $or: [{ targetBatch: studentClass }, { targetBatch: 'all' }] },
        {
          $or: [
            { type: { $ne: 'test_result' } }, // Non-test notifications shown to all
            { relatedId: { $in: visibleTestIds } }
          ]
        }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Add isRead flag per notification
    const withReadStatus = notifications.map((n) => ({
      ...n,
      isRead: n.readBy.some((rid) => rid.toString() === studentId.toString()),
    }));

    // Remove readBy array from response (privacy — don't expose other student IDs)
    const sanitized = withReadStatus.map(({ readBy, ...rest }) => rest);

    const unreadCount = sanitized.filter((n) => !n.isRead).length;

    res.json({ success: true, data: sanitized, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/weekly-tests/notifications/:nid/read
const markNotificationRead = async (req, res) => {
  try {
    const { nid } = req.params;
    const studentId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(nid)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await Notification.findOne({
      _id: nid,
      $and: [
        { $or: [{ targetBatch: req.user.studentClass }, { targetBatch: 'all' }] },
        {
          $or: [
            { type: { $ne: 'test_result' } },
            {
              relatedId: {
                $in: await WeeklyTest.find({
                  board: { $in: [req.user.board || 'CBSE', 'ALL'] },
                  $or: [{ branch: req.user.branch }, { isAllBranches: true }],
                }).distinct('_id'),
              },
            },
          ],
        },
      ],
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.readBy.addToSet(studentId);
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

module.exports = {
  createTest,
  getAllTests,
  getTestById,
  toggleLock,
  deleteTest,
  enterMarks,
  bulkImportMarks,
  downloadTemplate,
  publishResults,
  getMyResults,
  getMyNotifications,
  markNotificationRead,
};
