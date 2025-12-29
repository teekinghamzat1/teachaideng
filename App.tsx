import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Generator from './pages/Generator';
import Result from './pages/Result';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import History from './pages/History';
import AssessmentGenerator from './pages/AssessmentGenerator';
import ClassManager from './pages/ClassManager';
import Timetable from './pages/Timetable';
import Settings from './pages/Settings';
import SchoolManagement from './pages/SchoolManagement';
import { sessionManager } from './utils/sessionManager';
import { HelpCenter } from './pages/HelpCenter';
import { ContactUs } from './pages/ContactUs';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminOverview from './pages/AdminDashboard'; // We reuse AdminDashboard.tsx as the overview
import AdminUsers from './pages/AdminUsers';
import AdminContent from './pages/AdminContent';
import AdminTestimonials from './pages/AdminTestimonials';
import AdminCurriculum from './pages/AdminCurriculum';
import AdminSettings from './pages/AdminSettings';
import AdminProfile from './pages/AdminProfile';

import ProtectedRoute from './components/ProtectedRoute';
import { BrandingProvider } from './contexts/BrandingContext';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize session timeout manager
    sessionManager.init();

    return () => {
      sessionManager.destroy();
    };
  }, []);

  return (
    <BrandingProvider>
      <Router>
        <Routes>
          {/* Main Application Routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />

          {/* Protected User Routes */}
          <Route path="/generator" element={
            <ProtectedRoute>
              <Layout><Generator /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/result" element={
            <ProtectedRoute>
              <Layout><Result /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <Layout><History /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/assessment" element={
            <ProtectedRoute>
              <Layout><AssessmentGenerator /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/classes" element={
            <ProtectedRoute>
              <Layout><ClassManager /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/timetable" element={
            <ProtectedRoute>
              <Layout><Timetable /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/school" element={
            <ProtectedRoute>
              <Layout><SchoolManagement /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/payment/success" element={
            <ProtectedRoute>
              <Layout><PaymentSuccess /></Layout>
            </ProtectedRoute>
          } />

          {/* Public Routes */}
          <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/admin/login" element={<Layout><AdminLogin /></Layout>} />
          <Route path="/signup" element={<Layout><Signup /></Layout>} />
          <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />

          <Route path="/help" element={<Layout><HelpCenter /></Layout>} />
          <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="curriculum" element={<AdminCurriculum />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </Router>
    </BrandingProvider>
  );
};

export default App;