import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import Header from './components/Header';
import Hero from './components/Hero';
import BillsProjects from "./components/Services";
import CallToActionComponent from './components/WhyChooseUs';
import WhyChooseUs from './components/Statistics';
import Footer from './components/Footer';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnonymousFeedbackPage from './pages/AnonymousFeedbackPage';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';
// import AdminDashboard from './components/dashboard/AdminDashboard';
import AdminDashboardLayout from './components/dashboard/AdminDashboardLayout';
import AdminFeedbackManagement from './components/dashboard/AdminFeedbackManagement';
import AdminAnalytics from './components/dashboard/AdminAnalytics';
import AdminOverview from './components/dashboard/AdminOverview';
import AdminUserManagement from './components/dashboard/AdminUserManagement';
import AdminSettings from './components/dashboard/AdminSettings';
import AdminGuard from './components/guards/AdminGuard';

// Home Page Component
const HomePage: React.FC = () => {
  useDocumentTitle();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main> 
        <Hero />
        <BillsProjects />
        <CallToActionComponent />
        <WhyChooseUs />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/anonymous-feedback" element={<AnonymousFeedbackPage />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            {/* Role-based dashboard routes */}
            <Route path="/citizen-dashboard" element={<DashboardPage />} />
            <Route path="/gov-dashboard" element={<DashboardPage />} />
            
            {/* Admin dashboard with layout */}
            <Route path="/admin-dashboard" element={<AdminGuard><AdminDashboardLayout /></AdminGuard>}>
              <Route index element={<AdminOverview />} />
              <Route path="feedback" element={<AdminFeedbackManagement />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;