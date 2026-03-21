require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware - Allow all origins (bulletproof CORS fix)
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Root path friendly message
app.get('/', (req, res) => {
  res.send('<h1>SRM Classes API is Running! 🚀🚀🚀</h1><p>The backend is fully live and connected to MongoDB Atlas.</p>');
});
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin/auth', require('./routes/adminAuthRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/demo', require('./routes/demoRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));

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
