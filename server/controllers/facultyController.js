const Faculty = require('../models/Faculty');

// @desc Get all active faculty (Public)
exports.getPublicFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({ isActive: true });
    
    // Sort logic
    faculty.sort((a, b) => {
      // Step 1: Active first
      if (a.isActive !== b.isActive) {
        return b.isActive - a.isActive;
      }

      // Step 2: Priority faculty
      if (a.priorityOrder && b.priorityOrder) {
        return a.priorityOrder - b.priorityOrder;
      }
      if (a.priorityOrder) return -1;
      if (b.priorityOrder) return 1;

      // Step 3: Alphabetical order
      return a.name.localeCompare(b.name);
    });

    res.json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all faculty (Admin)
exports.getAdminFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({});
    
    // Sort logic: Active Top, Inactive Bottom
    faculty.sort((a, b) => {
      // Step 1: Active first
      if (a.isActive !== b.isActive) {
        return b.isActive - a.isActive;
      }

      // Step 2: Priority faculty
      if (a.priorityOrder && b.priorityOrder) {
        return a.priorityOrder - b.priorityOrder;
      }
      if (a.priorityOrder) return -1;
      if (b.priorityOrder) return 1;

      // Step 3: Alphabetical order
      return a.name.localeCompare(b.name);
    });

    res.json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add new faculty
exports.addFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Update faculty
exports.updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    res.json({ success: true, data: faculty });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Soft delete faculty
exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    // Protection for Top 3
    const coreFaculty = ['Mr. Ranjan Kumar Soni', 'Mr. Raghuwendra Kumar Soni', 'Mr. Yuvraj Kumar'];
    if (coreFaculty.includes(faculty.name)) {
      return res.status(403).json({ success: false, message: 'Core faculty members cannot be deactivated' });
    }

    const adminEmail = req.admin ? req.admin.email : 'Admin';
    await faculty.softDelete(adminEmail);
    
    res.json({ success: true, message: 'Faculty moved to Recycle Bin' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
