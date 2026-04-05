const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Gallery = require('../models/Gallery');
const Result = require('../models/Result');
const StudyMaterial = require('../models/StudyMaterial');
const Announcement = require('../models/Announcement');
const DemoBooking = require('../models/DemoBooking');
const Enquiry = require('../models/Enquiry');
const Course = require('../models/Course');
const { deleteFromCloudinary } = require('../utils/cloudinary');

const MODEL_MAP = {
  Student: User,
  Faculty: Faculty,
  Gallery: Gallery,
  Result: Result,
  Material: StudyMaterial,
  Announcement: Announcement,
  Booking: DemoBooking,
  Enquiry: Enquiry,
  Course: Course
};

/**
 * @desc    Get all deleted items from all categories
 * @route   GET /api/recycle-bin
 * @access  Private/Admin
 */
exports.getDeletedItems = async (req, res) => {
  try {
    const deletedItems = [];

    for (const [type, Model] of Object.entries(MODEL_MAP)) {
      // We pass { isDeleted: true } to bypass the global filter middleware
      const items = await Model.find({ isDeleted: true }).lean();
      
      items.forEach(item => {
        // Calculate remaining days (30 days retention)
        const deletedAt = new Date(item.deletedAt);
        const now = new Date();
        const diffTime = Math.abs(now - deletedAt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const remainingDays = Math.max(0, 30 - diffDays);

        deletedItems.push({
          _id: item._id,
          name: item.name || item.title || item.studentName || item.className || 'Unnamed Item',
          type,
          deletedAt: item.deletedAt,
          deletedBy: item.deletedBy || 'Admin',
          remainingDays,
          details: item
        });
      });
    }

    // Sort by most recently deleted
    deletedItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    res.status(200).json({
      success: true,
      count: deletedItems.length,
      data: deletedItems
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Restore a deleted item
 * @route   PATCH /api/recycle-bin/restore/:type/:id
 * @access  Private/Admin
 */
exports.restoreItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = MODEL_MAP[type];

    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid entity type' });
    }

    // Find including deleted
    const item = await Model.findOne({ _id: id, isDeleted: true });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in Recycle Bin' });
    }

    await item.restore();

    res.status(200).json({ success: true, message: `${type} restored successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Permanently delete an item (DB + Storage)
 * @route   DELETE /api/recycle-bin/permanent/:type/:id
 * @access  Private/Admin
 */
exports.permanentlyDeleteItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = MODEL_MAP[type];

    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid entity type' });
    }

    const item = await Model.findOne({ _id: id, isDeleted: true });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found or already purged' });
    }

    // Storage Cleanup
    try {
      if (item.cloudinaryId) {
        // Check resource type (image or raw for PDFs)
        const isRaw = item.fileUrl && item.fileUrl.endsWith('.pdf');
        await deleteFromCloudinary(item.cloudinaryId, isRaw ? 'raw' : 'image');
      } else if (item.imageUrl && item.imageUrl.includes('cloudinary')) {
          // Fallback if cloudinaryId is missing but URL is cloudinary
          const parts = item.imageUrl.split('/');
          const lastPart = parts[parts.length - 1];
          const publicId = lastPart.split('.')[0];
          await deleteFromCloudinary(publicId);
      }
    } catch (storageError) {
      console.error(`Storage cleanup failed for ${type} ${id}:`, storageError.message);
      // We continue with DB deletion even if storage fails to avoid zombie records in Bin
    }

    await Model.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: `${type} permanently deleted from database and storage` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
