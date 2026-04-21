const Announcement = require('../models/Announcement');
const mongoose = require('mongoose');
const GENERIC_SERVER_ERROR = 'Something went wrong. Please try again.';

const getAnnouncements = async (req, res) => {
  try {
    const { studentClass } = req.query;
    if (studentClass && typeof studentClass !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid student class' });
    }
    let query = { isActive: true };
    if (studentClass && typeof studentClass === 'string') {
      query.$or = [{ targetClass: studentClass }, { targetClass: 'all' }];
    }
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .select('title body createdAt priority targetClass')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json({ 
      success: true, 
      data: announcements,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, body, targetClass, priority, isActive } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }
    const announcement = await Announcement.create({ title, body, targetClass, priority, isActive });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    
    const adminEmail = req.admin ? req.admin.email : 'Admin';
    await announcement.softDelete(adminEmail);
    res.json({ success: true, message: 'Announcement moved to Recycle Bin' });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
