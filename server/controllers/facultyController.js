const Faculty = require('../models/Faculty');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

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
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB);
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
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB);
    });

    res.json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add new faculty
exports.addFaculty = async (req, res) => {
  try {
    const data = { ...req.body };
    
    if (req.file) {
      const publicId = `faculty_${Date.now()}`;
      const uploadResult = await uploadToCloudinary(
        req.file.buffer, 
        'faculty', 
        publicId, 
        'image',
        {
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
          ]
        }
      );
      data.photo = {
        url: uploadResult.url,
        public_id: uploadResult.publicId
      };
    }

    const faculty = await Faculty.create(data);
    res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Update faculty
exports.updateFaculty = async (req, res) => {
  try {
    const data = { ...req.body };
    const facultyId = req.params.id;

    // Find existing to check for photo
    const existingFaculty = await Faculty.findById(facultyId);
    if (!existingFaculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (req.file) {
      // 1. Delete old photo if exists
      if (existingFaculty.photo && existingFaculty.photo.public_id) {
        await deleteFromCloudinary(existingFaculty.photo.public_id);
      }

      // 2. Upload new photo
      const publicId = `faculty_${Date.now()}`;
      const uploadResult = await uploadToCloudinary(
        req.file.buffer, 
        'faculty', 
        publicId, 
        'image',
        {
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
          ]
        }
      );
      data.photo = {
        url: uploadResult.url,
        public_id: uploadResult.publicId
      };
    }

    const faculty = await Faculty.findByIdAndUpdate(facultyId, data, {
      new: true,
      runValidators: true,
    });

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
