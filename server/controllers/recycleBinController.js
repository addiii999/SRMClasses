const mongoose = require('mongoose');
const { deleteFromCloudinary } = require('../utils/cloudinary');

/**
 * Dynamic Model Retrieval to avoid circular dependencies
 */
const getModel = (name) => {
  try {
    return mongoose.model(name);
  } catch (e) {
    // Fallback: require if not registered
    const modelPaths = {
      Student: '../models/User',
      Faculty: '../models/Faculty',
      Gallery: '../models/Gallery',
      Result: '../models/Result',
      Material: '../models/StudyMaterial',
      Announcement: '../models/Announcement',
      Booking: '../models/DemoBooking',
      Enquiry: '../models/Enquiry',
      Course: '../models/Course'
    };
    return require(modelPaths[name]);
  }
};

const MODEL_NAMES = [
  'Student', 'Faculty', 'Gallery', 'Result', 
  'Material', 'Announcement', 'Booking', 'Enquiry', 'Course'
];

/**
 * @desc    Get all deleted items from all categories
 * @route   GET /api/recycle-bin
 * @access  Private/Admin
 */
exports.getDeletedItems = async (req, res) => {
  try {
    const deletedItems = [];

    for (const type of MODEL_NAMES) {
      try {
        const Model = getModel(type);
        if (!Model) continue;

        // Bypass global filter to find deleted items
        const items = await Model.find({ isDeleted: true }).lean();
        
        items.forEach(item => {
          // Safety: Skip if deletedAt is missing to prevent NaN errors
          if (!item.deletedAt) return;

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
            remainingDays: isNaN(remainingDays) ? 30 : remainingDays,
            details: item
          });
        });
      } catch (innerError) {
        console.error(`RecycleBin fetch error for ${type}:`, innerError.message);
        // Continue to other models even if one fails
      }
    }

    // Sort by most recently deleted, safety for missing dates
    deletedItems.sort((a, b) => {
      const dateA = a.deletedAt ? new Date(a.deletedAt) : 0;
      const dateB = b.deletedAt ? new Date(b.deletedAt) : 0;
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      count: deletedItems.length,
      data: deletedItems
    });
  } catch (error) {
    console.error('RecycleBin Global Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recycle bin data' });
  }
};

/**
 * @desc    Restore a deleted item
 */
exports.restoreItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = getModel(type);

    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid entity type' });
    }

    const item = await Model.findOne({ _id: id, isDeleted: true });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in Recycle Bin' });
    }

    // Use admin email for log if available
    const adminEmail = req.admin ? req.admin.email : (req.user ? req.user.email : 'Admin');
    
    if (typeof item.restore === 'function') {
      await item.restore(adminEmail);
    } else {
      // Fallback if plugin method missing
      item.isDeleted = false;
      item.deletedAt = null;
      item.deletedBy = null;
      await item.save();
    }

    res.status(200).json({ success: true, message: `${type} restored successfully` });
  } catch (error) {
    console.error('Restore Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Permanently delete an item (DB + Storage)
 */
exports.permanentlyDeleteItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = getModel(type);

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
        const isRaw = item.fileUrl && (item.fileUrl.endsWith('.pdf') || item.fileUrl.includes('/raw/upload/'));
        await deleteFromCloudinary(item.cloudinaryId, isRaw ? 'raw' : 'image');
      }
    } catch (storageError) {
      console.error(`Storage cleanup failed for ${type} ${id}:`, storageError.message);
    }

    await Model.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: `${type} permanently deleted` });
  } catch (error) {
    console.error('Purge Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
