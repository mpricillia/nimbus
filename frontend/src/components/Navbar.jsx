import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileSidebar from './ProfileSidebar';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/playground');
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-content" style={{ padding: '0 40px' }}>
        <a href="/" onClick={handleLogoClick} className="brand" style={{ marginLeft: '0px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/nimbus-logo.png" alt="Nimbus.ai Logo" style={{ height: '120px', margin: '-30px 0' }} />
        </a>

        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link>
          {user && (
            <>
              <Link to="/playground" className={location.pathname === '/playground' ? 'active' : ''}>Playground</Link>
              <Link to="/playground/recent" className={location.pathname === '/playground/recent' ? 'active' : ''}>Recent Activities</Link>
            </>
          )}
        </div>

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <ProfileSidebar />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/auth?mode=login" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
                LOGIN
              </Link>
              <Link to="/auth?mode=register" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
                REGISTER
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
