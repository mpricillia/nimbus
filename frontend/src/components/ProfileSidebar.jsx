import React, { useState } from 'react';
import { User, LogOut, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfileSidebar.css';

const ProfileSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when navigating
  React.useEffect(() => {
    setIsOpen(false);
  }, [location]);

  if (!user) return null;

  const handleLogout = async () => {
    setIsOpen(false);
    navigate('/');
    setTimeout(async () => {
      await signOut();
    }, 50); // slight delay ensures navigation completes before AuthContext updates
  };

  const displayName = user?.email ? user.email.split('@')[0].toUpperCase() : 'USER';

  return (
    <div className={`profile-sidebar-wrapper ${isOpen ? 'open' : ''}`}>
      {/* Avatar Toggle */}
      <div className="profile-avatar-toggle" onClick={() => setIsOpen(!isOpen)}>
        <User size={20} />
      </div>

      {/* Expanded Sidebar */}
      <div className={`profile-sidebar glass-panel ${isOpen ? 'expanded' : 'collapsed'}`}>
        <div className="profile-sidebar-content">
          <button className="sidebar-close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>

          <div className="profile-info-section">
            <div className="profile-avatar-large">
              <User size={40} />
            </div>
            <div className="profile-name-badge">
              {displayName}
            </div>
            <p className="profile-email">{user?.email}</p>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-footer">
            <button onClick={handleLogout} className="sidebar-logout-btn">
              <LogOut size={18} />
              DISCONNECT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
