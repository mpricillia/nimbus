import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProfileSidebar from './components/ProfileSidebar';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ActivitiesPage from './pages/ActivitiesPage';
import { AuthProvider, useAuth } from './context/AuthContext';


const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/playground" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/auth" element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          } />
          <Route path="/playground" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/playground/recent" element={
            <ProtectedRoute>
              <ActivitiesPage />
            </ProtectedRoute>
          } />
          {/* Redirect old activities route */}
          <Route path="/activities" element={<Navigate to="/playground/recent" replace />} />
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
