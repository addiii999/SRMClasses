# SRM Classes Platform 🚀

A modern, full-stack coaching institute management platform built with the MERN stack (MongoDB, Express, React, Node.js). Designed for SRM Classes, Ranchi.

## 🌟 Features

- **Admin Dashboard**: Comprehensive management for Enquiries (CRM), Demo Bookings, Courses, Study Materials, Announcements, Gallery, and Results.
- **Student Portal**: Secure login to access study notes, test papers, and announcements.
- **Cloudinary Integration**: Fully persistent and secure image/PDF storage (HTTPS).
- **Self-Healing Backend**: Automatic database seeding (Admin & Courses) on first launch.
- **Premium UI**: Responsive glassmorphism design with brand-tailored animations and Google Maps integration.
- **Communication**: Built-in WhatsApp floating button and Click-to-call functionality.

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Storage**: Cloudinary (Secure CDN)
- **Deployment**: Render (Backend) & Vercel (Frontend)

---

## ⚙️ Setup Instructions

### 1. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` folder with these keys:
```ini
MONGO_URI=mongodb+srv://... (Your MongoDB Atlas URI)
JWT_SECRET=... (Any random string)
ADMIN_EMAIL=...
ADMIN_PASSWORD=...

# Cloudinary (Get these from Cloudinary Dashboard)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email (For OTPs)
EMAIL_USER=...
EMAIL_PASS=... (Gmail App Password)
```

### 2. Frontend Setup
```bash
cd client
npm install
```

### 3. Running Locally
- **Backend**: `npm run dev` (Runs on http://localhost:5000)
- **Frontend**: `npm run dev` (Runs on http://localhost:5173)

---

## 🚀 Deployment Notes

### Render (Backend)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Note**: The backend now automatically handles database seeding on startup. No separate `seed.js` command is needed.

---

## 📂 Project Structure
- `client/`: React frontend with Tailwind CSS.
- `server/`: Express backend with MongoDB models and controllers.
- `server/utils/cloudinary.js`: Secure file upload utility.
- `index.js`: Main entry point with internal seeding logic.

---
Designed for **SRM Classes, Ranchi**. Built with ❤️ for students.
