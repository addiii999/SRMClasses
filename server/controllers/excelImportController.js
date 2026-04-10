const ExcelJS = require('exceljs');
const ExcelImportLog = require('../models/ExcelImportLog');
const WeeklyTest = require('../models/WeeklyTest');
const User = require('../models/User');
const TestResult = require('../models/TestResult');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/import/excel
// Excel marks import — strictly for weekly test marks only
// Supports dryRun=true for preview without DB writes
// ─────────────────────────────────────────────────────────────────────────────
exports.importMarksExcel = async (req, res) => {
  try {
    const isDryRun = req.query.dryRun === 'true';
    const { weeklyTestId } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
    }

    if (!weeklyTestId) {
      return res.status(400).json({ success: false, message: 'weeklyTestId is required to import marks' });
    }

    // Validate test exists
    const test = await WeeklyTest.findById(weeklyTestId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Weekly test not found' });
    }

    const adminName = req.admin ? `${req.admin.name} (${req.admin.adminId})` : 'Admin';
    const filename = req.file.originalname;

    // Parse Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).json({ success: false, message: 'No worksheet found in Excel file' });
    }

    const results = [];
    const errors = [];
    let rowNumber = 1;

    // Expected columns: studentId | marksObtained | maxMarks (optional)
    // Header row is row 1
    worksheet.eachRow({ includeEmpty: false }, (row, index) => {
      if (index === 1) return; // skip header
      rowNumber = index;

      const studentId = row.getCell(1).value?.toString().trim();
      const marksObtained = parseFloat(row.getCell(2).value);
      const maxMarks = row.getCell(3).value ? parseFloat(row.getCell(3).value) : null;

      results.push({ rowNumber: index, studentId, marksObtained, maxMarks });
    });

    const totalRows = results.length;
    let successCount = 0;
    let failedCount = 0;
    const errorDetails = [];
    const previewData = [];

    for (const entry of results) {
      const { rowNumber, studentId, marksObtained, maxMarks } = entry;

      // Validate studentId
      if (!studentId) {
        failedCount++;
        errorDetails.push({ row: rowNumber, studentId: null, studentName: null, reason: 'Missing student ID' });
        continue;
      }

      // Find student
      const student = await User.findOne({ studentId }).select('name registrationStatus').lean();
      if (!student) {
        failedCount++;
        errorDetails.push({ row: rowNumber, studentId, studentName: null, reason: `Student with ID '${studentId}' not found` });
        continue;
      }

      if (student.registrationStatus !== 'Active') {
        failedCount++;
        errorDetails.push({ row: rowNumber, studentId, studentName: student.name, reason: 'Student is not active' });
        continue;
      }

      // Validate marks
      if (isNaN(marksObtained) || marksObtained < 0) {
        failedCount++;
        errorDetails.push({ row: rowNumber, studentId, studentName: student.name, reason: 'Invalid marks value' });
        continue;
      }

      if (maxMarks !== null && (isNaN(maxMarks) || maxMarks <= 0)) {
        failedCount++;
        errorDetails.push({ row: rowNumber, studentId, studentName: student.name, reason: 'Invalid max marks value' });
        continue;
      }

      if (maxMarks !== null && marksObtained > maxMarks) {
        failedCount++;
        errorDetails.push({ row: rowNumber, studentId, studentName: student.name, reason: `Marks (${marksObtained}) cannot exceed max marks (${maxMarks})` });
        continue;
      }

      // Check for duplicate in this test
      const existingResult = await TestResult.findOne({ weeklyTest: weeklyTestId, student: student._id !== undefined ? student._id : null });

      previewData.push({
        row: rowNumber,
        studentId,
        studentName: student.name,
        marksObtained,
        maxMarks: maxMarks || test.maxMarks,
        action: existingResult ? 'update' : 'create',
      });

      if (!isDryRun) {
        // Apply the marks
        if (existingResult) {
          existingResult.marksObtained = marksObtained;
          if (maxMarks) existingResult.maxMarks = maxMarks;
          await existingResult.save();
        } else {
          // Find student full doc for _id
          const studentDoc = await User.findOne({ studentId }).select('_id');
          await TestResult.create({
            weeklyTest: weeklyTestId,
            student: studentDoc._id,
            marksObtained,
            maxMarks: maxMarks || test.maxMarks,
          });
        }
      }

      successCount++;
    }

    // Log the import (always, even dry runs)
    const importLog = await ExcelImportLog.create({
      filename,
      adminId: req.admin._id,
      adminName,
      timestamp: new Date(),
      isDryRun,
      totalRows,
      successCount,
      failedCount,
      errors: errorDetails,
      weeklyTestId,
    });

    res.json({
      success: true,
      message: isDryRun
        ? `Dry run complete. ${successCount} rows valid, ${failedCount} rows would fail.`
        : `Import complete. ${successCount} rows imported, ${failedCount} rows failed.`,
      isDryRun,
      totalRows,
      successCount,
      failedCount,
      errors: errorDetails,
      preview: isDryRun ? previewData : undefined,
      logId: importLog._id,
    });
  } catch (error) {
    console.error('[EXCEL IMPORT]', error);
    res.status(500).json({ success: false, message: 'Import failed: ' + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/import/logs  — Excel import history
// ─────────────────────────────────────────────────────────────────────────────
exports.getImportLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await ExcelImportLog.countDocuments();
    const logs = await ExcelImportLog.find()
      .populate('weeklyTestId', 'testName')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
