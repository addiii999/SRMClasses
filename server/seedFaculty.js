require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Force using Google DNS to fix the ECONNREFUSED / querySrv error
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Define Faculty Schema
const facultySchema = new mongoose.Schema({
  name: String,
  subject: String,
  qualification: String,
  experience: Number,
  speciality: String,
  rating: Number,
  isActive: { type: Boolean, default: true }
});

const Faculty = mongoose.model('Faculty', facultySchema);

const initialFaculty = [
  { name: 'Mr. Ranjan Kumar Soni', subject: 'Mathematics & Physics', experience: 15, qualification: 'M.Sc. Mathematics, Founder', speciality: 'Board Exam Specialist', rating: 5.0 },
  { name: 'Mr. Raghuwendra Kumar Soni', subject: 'Computer & AI', experience: 12, qualification: 'MCA, IT Expert', speciality: 'Tech & AI Mentor', rating: 4.9 },
  { name: 'Mr. Yuvraj Kumar', subject: 'Chemistry & Physics', experience: 6, qualification: 'B.Sc. Physics, RU', speciality: 'Conceptual Science', rating: 4.8 },
  { name: 'Mr. Aayush Gupta', subject: 'Management', experience: 4, qualification: 'MBA, Management Expert', speciality: 'Operations & Strategy', rating: 4.8 },
  { name: 'Mr. Raj Kumar Ranjan', subject: 'Social Science & English', experience: 5, qualification: 'M.A. English & B.Ed.', speciality: 'Humanities Expert', rating: 4.7 },
  { name: 'Mrs. Kamla Sahu', subject: 'Accountant', experience: 5, qualification: 'B.Com, Accounts Specialist', speciality: 'Finance & Admin', rating: 4.7 },
  { name: 'Miss Deepsikha Kumari', subject: 'English & Social Science', experience: 5, qualification: 'M.A. English, RU', speciality: 'Language Proficiency', rating: 4.8 },
  { name: 'Mrs. Vibha Sinha', subject: 'Hindi', experience: 5, qualification: 'M.A. Hindi & Sanskrit', speciality: 'Language Specialist', rating: 4.7 },
  { name: 'Mr. Aman Kumar', subject: 'English', experience: 5, qualification: 'B.A. English Honours', speciality: 'Grammar & Literature', rating: 4.7 },
  { name: 'Mr. Ravi Kumar', subject: 'Mathematics', experience: 7, qualification: 'M.Sc. Mathematics', speciality: 'Quantitative Expert', rating: 4.8 },
  { name: 'Miss Priyanka Kumari', subject: 'Mathematics', experience: 0, qualification: 'B.Sc. Mathematics', speciality: 'Foundational Maths', rating: 4.7 },
  { name: 'Miss Deepanshu Kumari', subject: 'Social Science', experience: 0, qualification: 'B.A. Social Science', speciality: 'Civics & Geography', rating: 4.7 },
  { name: 'Miss Priyanshu Kumari', subject: 'Biology', experience: 0, qualification: 'B.Sc. Biology Specialist', speciality: 'Life Sciences', rating: 4.7 },
  { name: 'Mr. Adarsh Kumar', subject: 'English & History', experience: 4, qualification: 'M.A. History, B.Ed.', speciality: 'Modern History & English', rating: 4.7 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await Faculty.deleteMany({});
    console.log('Cleared existing faculty');

    // Insert new
    await Faculty.insertMany(initialFaculty);
    console.log(`Successfully seeded ${initialFaculty.length} faculty members`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
