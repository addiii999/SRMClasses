import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Preloader from './components/Preloader';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import Faculty from './pages/Faculty';
import Results from './pages/Results';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Mentor from './pages/Mentor';
import PrivacyPolicy from './pages/PrivacyPolicy';
import FeeCalculator from './pages/FeeCalculator';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Student Dashboard
import StudentDashboard from './pages/StudentDashboard';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer />
    <WhatsAppButton />
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <Preloader />
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#fff', color: '#2D274B', fontFamily: 'Inter, sans-serif', borderRadius: '12px', boxShadow: '0 8px 32px rgba(151,135,243,0.15)' },
            success: { iconTheme: { primary: '#9787F3', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/courses" element={<PublicLayout><Courses /></PublicLayout>} />
          <Route path="/faculty" element={<PublicLayout><Faculty /></PublicLayout>} />
          <Route path="/results" element={<PublicLayout><Results /></PublicLayout>} />
          <Route path="/gallery" element={<PublicLayout><Gallery /></PublicLayout>} />
          <Route path="/mentor" element={<PublicLayout><Mentor /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
          <Route path="/fee-calculator" element={<PublicLayout><FeeCalculator /></PublicLayout>} />

          {/* Auth Routes */}
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
          <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />

          {/* Student Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
