import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import Home from '../components/dashboard/Home';
import Files from '../components/dashboard/Files';
import Links from '../components/dashboard/Links';
import Users from '../components/dashboard/Users';
import ProfileModal from '../components/dashboard/ProfileModal';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { user } = useAuth();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openProfileModal = () => {
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none"
          style={{ zIndex: 999 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="main-content">
        {/* Top bar */}
        <TopBar 
          onToggleSidebar={toggleSidebar}
          onOpenProfile={openProfileModal}
        />

        {/* Page content */}
        <div className="container-fluid py-4">
          <Routes>
            <Route path="/" element={<Navigate to="home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="files" element={<Files />} />
            <Route path="links" element={<Links />} />
            {user?.role === 'superuser' && (
              <Route path="users" element={<Users />} />
            )}
            <Route path="*" element={<Navigate to="home" replace />} />
          </Routes>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileModalOpen}
        onClose={closeProfileModal}
      />
    </div>
  );
};

export default Dashboard;