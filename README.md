# SRM Classes - Official Online Platform 🎓🚀

Welcome to the official repository of **SRM Classes, Ranchi**. This is a premium, full-stack educational platform designed to manage students, enquiries, and digital study materials with a seamless user experience.

### 🌐 Live Links
- **Official Website:** [https://www.srmclasses.in](https://www.srmclasses.in)
- **Student Gallery:** [https://www.srmclasses.in/gallery](https://www.srmclasses.in/gallery)
- **Admin Access:** [https://www.srmclasses.in/admin/login](https://www.srmclasses.in/admin/login)

---

## ✨ Key Features

- **🎯 CRM System:** Manage student enquiries and demo bookings with lead status tracking.
- **📚 Digital Library:** Securely upload and share Study Materials (PDFs) and Test Papers.
- **🏆 Results & Gallery:** Showcase student achievements and institute activities via a high-performance Cloudinary CDN.
- **🔒 Secure Portals:** Dedicated dashboards for Students and Admins with JWT-protected sessions.
- **📱 Premium Design:** Fully responsive, modern glassmorphism UI with smooth animations and integrated Google Maps.

---

## 🛠️ Project Architecture

| Component | Technology | Hosting |
|-----------|------------|---------|
| **Frontend** | React.js + Vite | Vercel |
| **Backend** | Node.js + Express | Render |
| **Database** | MongoDB Atlas | Cloud |
| **Storage** | Cloudinary (Secure HTTPS) | CDN |

---

## 💻 Local Development (For Developers)

If you want to run this project on your local machine for coding/testing, follow these steps:

### 1. Requirements
- Node.js (v18+)
- MongoDB Atlas account (for database)
- Cloudinary account (for images)

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/addiii999/SRMClasses.git

# Setup Backend
cd server
npm install
# (Create .env file with your API keys)

# Setup Frontend
cd ../client
npm install
```

### 3. Running Locally
When running locally on your computer, you can access the app at:
- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:5000`

*(Note: These `localhost` links only work when you are running the project code on your PC.)*

---

## 🔐 Environment Variables (Required)
The following keys are needed in your `server/.env` file:
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Security key for logins.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `EMAIL_PASS`: Gmail App Password for OTP delivery.

---
Designed with ❤️ for **SRM Classes, Ranchi**.  
Improving Education through Technology. 🛡️✨
