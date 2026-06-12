import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Terminal, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLogin && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Registration successful! You can now log in.");
        setIsLogin(true);
        setLoading(false);
        return;
      }
      
      // Navigate on successful login
      navigate('/playground');
    } catch (error) {
      alert(error.message || 'Authentication failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex-center">
      <div className="auth-card glass-panel">
        <div className="auth-header text-center">
          <img src="/nimbus-logo.png" alt="Nimbus.ai Logo" style={{ height: '80px', margin: '0 auto 16px', display: 'block' }} />
          <h2 className="text-glow">{isLogin ? 'LOGIN' : 'REGISTER'}</h2>
          <p className="auth-subtitle">Authenticate to access the system</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>EMAIL</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="user@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>PASSWORD</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label>CONFIRM PASSWORD</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : isLogin ? <><LogIn size={18}/> LOGIN</> : <><UserPlus size={18}/> REGISTER</>}
          </button>
        </form>

        <div className="auth-toggle text-center">
          <span style={{color: 'var(--on-surface-variant)'}}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button className="toggle-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'REGISTER' : 'LOGIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
