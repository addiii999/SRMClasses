require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const Course = require('./models/Course');
const logger = require('./utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

// ─── Startup env-var validation (fail fast) ───────────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'RESEND_API_KEY'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  logger.error('Server cannot start without all required configuration. Exiting.');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

const initCronJobs = require('./utils/cronJobs');
initCronJobs();

const startKeepAlive = require('./utils/keepAlive');
startKeepAlive();

// Seeding Logic — Admin is seeded via scripts/seedSuperAdmin.js (not inline)
const seedData = async () => {
  try {
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

// ─── Security Headers (helmet) ────────────────────────────────────────────────
app.use(helmet());

app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((entry) => {
      const [rawKey, ...rawVal] = entry.trim().split('=');
      if (!rawKey) return;
      cookies[rawKey] = decodeURIComponent(rawVal.join('=') || '');
    });
  }
  req.cookies = cookies;
  next();
});

// Root path friendly message
app.get('/', (req, res) => {
  res.send('<h1>SRM Classes API is Running! 🚀🚀🚀</h1><p>The backend is fully live and connected to MongoDB Atlas.</p>');
});

// Health check — minimal info only
app.get('/api/health', (req, res) => {
  const dbReady = connectDB && require('mongoose').connection?.readyState === 1;
  res.status(dbReady ? 200 : 503).json({ status: dbReady ? 'ok' : 'degraded' });
});

// ─── Global Rate Limiting ─────────────────────────────────────────────────────
// Reduced to 200/15min. Localhost bypass only applies in development.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  skip: (req) =>
    !isProduction &&
    (req.ip === '::1' || req.ip === '127.0.0.1'),
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const productionOrigins = [
  'https://srmclasses.in',
  'https://www.srmclasses.in',
  'https://srmclasses-frontend.vercel.app',
  'https://srm-classes.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Include localhost only in non-production environments
const allowedOrigins =
  !isProduction
    ? [...productionOrigins, 'http://localhost:5173', 'http://localhost:3000']
    : productionOrigins;

app.use(
  cors({
    origin: function (origin, callback) {
      // In production, block requests without origin to reduce abuse surface.
      if (!origin) {
        return isProduction
          ? callback(new Error('Origin header is required.'), false)
          : callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(
          new Error('The CORS policy for this site does not allow access from the specified Origin.'),
          false
        );
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
  })
);

// Apply global rate limiter to all routes
app.use(limiter);

// ─── Body Parsing (10mb limit for JSON/URL-encoded payloads) ─────────────────
// Note: Excel/file upload routes use multer with its own 50mb limit (see middleware/excelUpload.js)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin/auth', require('./routes/adminAuthRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/board-change', require('./routes/boardChangeRoutes'));
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
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/weekly-tests', require('./routes/weeklyTestRoutes'));
app.use('/api/config', require('./routes/configRoutes'));
app.use('/api/lifecycle', require('./routes/dataLifecycleRoutes'));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Never expose internal error details to the client in production
  if (!isProduction) logger.error('Unhandled error', { stack: err.stack });
  else logger.error('Unhandled error', { message: err.message });
  
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Something went wrong' : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`SRM Classes Server running on port ${PORT}`);
});
