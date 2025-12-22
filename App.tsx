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

// Admin Pages
import AdminOverview from './pages/AdminDashboard'; // We reuse AdminDashboard.tsx as the overview
import AdminUsers from './pages/AdminUsers';
import AdminContent from './pages/AdminContent';
import AdminTestimonials from './pages/AdminTestimonials';
import AdminCurriculum from './pages/AdminCurriculum';
import AdminSettings from './pages/AdminSettings';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize session timeout manager
    sessionManager.init();

    return () => {
      sessionManager.destroy();
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Main Application Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/generator" element={<Layout><Generator /></Layout>} />
        <Route path="/result" element={<Layout><Result /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/admin/login" element={<Layout><AdminLogin /></Layout>} />
        <Route path="/signup" element={<Layout><Signup /></Layout>} />
        <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
        <Route path="/history" element={<Layout><History /></Layout>} />
        <Route path="/assessment" element={<Layout><AssessmentGenerator /></Layout>} />
        <Route path="/classes" element={<Layout><ClassManager /></Layout>} />
        <Route path="/timetable" element={<Layout><Timetable /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/school" element={<Layout><SchoolManagement /></Layout>} />
        <Route path="/payment/success" element={<Layout><PaymentSuccess /></Layout>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="curriculum" element={<AdminCurriculum />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;