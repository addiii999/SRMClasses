require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const Course = require('./models/Course');

// Connect to MongoDB
connectDB();

const initCronJobs = require('./utils/cronJobs');
initCronJobs();

// Seeding Logic
const seedData = async () => {
  try {
    // Seed Admin
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'srmclasses01@gmail.com' });
    if (!adminExists) {
      await Admin.create({
        email: process.env.ADMIN_EMAIL || 'srmclasses01@gmail.com',
        password: process.env.ADMIN_PASSWORD || 'SRMAdmin@2026',
      });
      console.log('✅ Admin account seeded');
    }

    // Seed Courses
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      const courses = [
        { className: '6', subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'], duration: '1 Year', batchTimings: ['7:00 AM - 8:30 AM', '4:00 PM - 5:30 PM'] },
        { className: '7', subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'], duration: '1 Year', batchTimings: ['8:30 AM - 10:00 AM', '5:30 PM - 7:00 PM'] },
        { className: '8', subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'], duration: '1 Year', batchTimings: ['8:30 AM - 10:00 AM', '5:30 PM - 7:00 PM'] },
        { className: '9', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi'], duration: '1 Year', batchTimings: ['6:00 AM - 8:00 AM', '3:00 PM - 5:00 PM'] },
        { className: '10', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi'], duration: '1 Year', batchTimings: ['6:00 AM - 8:00 AM', '3:00 PM - 5:00 PM'] },
        { className: '11', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'English'], duration: '1 Year', batchTimings: ['6:00 AM - 8:30 AM', '5:00 PM - 7:30 PM'] },
        { className: '12', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'English'], duration: '1 Year', batchTimings: ['6:00 AM - 8:30 AM', '5:00 PM - 7:30 PM'] },
      ];
      await Course.insertMany(courses);
      console.log('✅ Courses seeded');
    }
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  }
};

seedData();

const app = express();

// Trust proxy for Render/cloud deployments (fixes rate limiter using correct client IP)
app.set('trust proxy', 1);

// Root path friendly message
app.get('/', (req, res) => {
  res.send('<h1>SRM Classes API is Running! 🚀🚀🚀</h1><p>The backend is fully live and connected to MongoDB Atlas.</p>');
});

// Health check
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const uri = process.env.MONGO_URI || 'NOT SET';
  res.json({
    status: 'OK',
    message: 'SRM Classes API is running',
    dbState: mongoose.connection.readyState,
    mongoUriSet: uri !== 'NOT SET',
    mongoUriStart: uri.substring(0, 30) + '...',
    nodeEnv: process.env.NODE_ENV || 'not set'
  });
});

// Rate limiting to prevent brute force and satisfy CodeQL
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1' // Skip local dev
});

// Apply limiter to all routes
app.use(limiter);

// Middleware - Allow specific origins (CORS fix)
const allowedOrigins = [
  'https://srmclasses.in',
  'https://www.srmclasses.in',
  'https://srmclasses-frontend.vercel.app',
  'https://srm-classes.vercel.app',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && process.env.NODE_ENV === 'production') {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin/auth', require('./routes/adminAuthRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/demo', require('./routes/demoRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/recycle-bin', require('./routes/recycleBinRoutes'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SRM Classes Server running on port ${PORT}`);
});
