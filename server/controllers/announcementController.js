const Announcement = require('../models/Announcement');

const getAnnouncements = async (req, res) => {
  try {
    const { studentClass } = req.query;
    if (studentClass && typeof studentClass !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid student class' });
    }
    let query = { isActive: true };
    if (studentClass) {
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
    const announcement = await Announcement.create(req.body);
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
