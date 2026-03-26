const Enquiry = require('../models/Enquiry');

// @desc    Submit enquiry (public)
// @route   POST /api/enquiries
const submitEnquiry = async (req, res) => {
  try {
    const { name, email, mobile, studentClass, message } = req.body;
    const enquiry = await Enquiry.create({ name, email, mobile, studentClass, message });
    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all enquiries (admin)
// @route   GET /api/enquiries
const getEnquiries = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { mobile: { $regex: safeSearch, $options: 'i' } },
      ];
    }
    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: enquiries.length, data: enquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update enquiry status (admin)
// @route   PATCH /api/enquiries/:id
const updateEnquiry = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const ALLOWED_STATUSES = ['New', 'Contacted', 'Converted'];

    // Validate status if provided
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}` 
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete enquiry (admin)
// @route   DELETE /api/enquiries/:id
const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitEnquiry, getEnquiries, updateEnquiry, deleteEnquiry };
