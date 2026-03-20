# SRM Classes Platform

A full-stack coaching institute platform with React + Vite frontend, Node.js + Express backend, and MongoDB database.

## Prerequisites

Install the following before running:

1. **Node.js** (v18+): https://nodejs.org/en/download
2. **MongoDB**: 
   - Local: https://www.mongodb.com/try/download/community  
   - OR use **MongoDB Atlas** (cloud): https://www.mongodb.com/atlas

---

## Setup Instructions

### Step 1 – Install Node.js
Download and install Node.js from https://nodejs.org  
Verify: open a new terminal and run:
```
node --version
npm --version
```

### Step 2 – Setup the Backend

```bash
cd server
npm install
```

Edit `.env` with your actual values:
- Set `MONGO_URI` to your MongoDB URI  
  - Local: `mongodb://localhost:27017/srmclasses`  
  - Atlas: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/srmclasses`
- Set `EMAIL_PASS` to your Gmail App Password (for OTP emails)

### Step 3 – Seed Database (Run Once)

```bash
cd server
node seed.js
```

This creates the admin account and pre-fills courses for Class 5–12.

### Step 4 – Setup the Frontend

```bash
cd client
npm install
```

### Step 5 – Run the Application

**Terminal 1 – Backend:**
```bash
cd server
npm run dev
```
Server runs on: http://localhost:5000

**Terminal 2 – Frontend:**
```bash
cd client
npm run dev
```
App runs on: http://localhost:5173

---

## Key URLs

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Main website (home page) |
| http://localhost:5173/register | Student registration |
| http://localhost:5173/login | Student login |
| http://localhost:5173/dashboard | Student dashboard |
| http://localhost:5173/admin/login | Admin login |
| http://localhost:5173/admin/dashboard | Admin overview |
| http://localhost:5173/admin/enquiries | CRM / Lead management |
| http://localhost:5000/api/health | API health check |

---

## Gmail App Password (for OTP emails)

1. Go to Google Account → Security → 2-Step Verification → App Passwords  
2. Create an app password for "Mail"  
3. Copy the 16-character password → paste into `server/.env` as `EMAIL_PASS`

---

## Project Structure

```
SRMClasses/
├── client/                     ← React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/              ← Home, About, Courses, Faculty, Results, Gallery, Contact
│   │   │   ├── admin/          ← AdminLogin, AdminDashboard
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── StudentDashboard.jsx
│   │   ├── components/         ← Navbar, Footer, WhatsAppButton, ProtectedRoute
│   │   ├── context/            ← AuthContext (JWT state management)
│   │   └── lib/                ← api.js (Axios with JWT interceptor)
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/                     ← Node.js + Express + MongoDB
    ├── models/                 ← User, Admin, Enquiry, DemoBooking, Course, StudyMaterial, Announcement, Gallery, Result
    ├── controllers/            ← Auth, AdminAuth, Enquiry, Demo, Course, Material, Announcement, Gallery, Result
    ├── routes/                 ← All API routes
    ├── middleware/             ← auth.js, adminAuth.js, upload.js (Multer)
    ├── config/                 ← db.js (MongoDB connection)
    ├── uploads/                ← Uploaded PDFs and images
    ├── seed.js                 ← Database seeding script
    ├── index.js                ← Express entry point
    └── .env                    ← Environment variables
```

---

## Features

- ✅ Student registration & login (JWT + bcrypt)
- ✅ Forgot password via OTP (email-based)
- ✅ Admin login with OTP password reset
- ✅ Student Dashboard (notes, test papers, announcements)
- ✅ Admin Dashboard with 8 management sections
- ✅ CRM system (leads with New/Contacted/Converted status)
- ✅ Demo class booking management
- ✅ File upload (PDFs, images via Multer)
- ✅ Course management (Class 5–12)
- ✅ Results & achievements management
- ✅ Gallery with category filter
- ✅ Announcements system
- ✅ Enquiry form, Contact form, Demo booking form
- ✅ Google Maps embed (Ranchi location)
- ✅ WhatsApp floating button
- ✅ Click-to-call button
- ✅ Premium glassmorphism UI with brand colors
- ✅ Fully mobile responsive
- ✅ SEO meta tags
