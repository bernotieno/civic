import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import WhyChooseUs from './components/WhyChooseUs';
import Statistics from './components/Statistics';
import Footer from './components/Footer';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnonymousFeedbackPage from './pages/AnonymousFeedbackPage';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';

// Home Page Component
const HomePage: React.FC = () => {
  useDocumentTitle();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-24"> {/* Add padding-top to account for fixed header */}
        <Hero />
        <Services />
        <WhyChooseUs />
        <Statistics />
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
            <Route path="/admin-dashboard" element={<DashboardPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;