import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import MyFarm from './pages/MyFarm';
import FarmersMarket from './pages/FarmersMarket';
import Wallet from './pages/Wallet';
import Fintech from './pages/Fintech';
import AgriLearning from './pages/AgriLearning';
import Irrigation from './pages/Irrigation';
import PostHarvest from './pages/PostHarvest';
import Chatbot from './pages/Chatbot';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Marketplace from './pages/Marketplace';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-primary-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/my-farm" element={
              <ProtectedRoute>
                <MyFarm />
              </ProtectedRoute>
            } />
            <Route path="/market" element={
              <ProtectedRoute>
                <FarmersMarket />
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />
            <Route path="/fintech" element={
              <ProtectedRoute>
                <Fintech />
              </ProtectedRoute>
            } />
            <Route path="/learning" element={
              <ProtectedRoute>
                <AgriLearning />
              </ProtectedRoute>
            } />
            <Route path="/irrigation" element={
              <ProtectedRoute>
                <Irrigation />
              </ProtectedRoute>
            } />
            <Route path="/post-harvest" element={
              <ProtectedRoute>
                <PostHarvest />
              </ProtectedRoute>
            } />
            <Route path="/chatbot" element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/marketplace" element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 