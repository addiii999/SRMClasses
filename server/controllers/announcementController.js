const Announcement = require('../models/Announcement');
const mongoose = require('mongoose');

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
    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { content, targetClass, isImportant, isActive } = req.body;
    const announcement = await Announcement.create({ content, targetClass, isImportant, isActive });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
