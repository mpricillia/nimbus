import React from 'react';
import { Link } from 'react-router-dom';
import { Database, BarChart2, Cpu, Zap, Activity, BrainCircuit, Shield, Server } from 'lucide-react';
import './LandingPage.css';
import '../pages/AboutPage.css'; // Import the old about page css

const LandingPage = () => {
  return (
    <div className="landing-page">
      <section id="home" className="hero-section flex-center" style={{ minHeight: '100vh', margin: 0, paddingTop: '80px' }}>
        <div className="container hero-split">
          <div className="hero-content-left">
            <h1 className="hero-title text-glow">
              <span style={{color: 'var(--on-surface)'}}>PREDICT. </span>
              <span style={{color: 'var(--on-surface-variant)'}}>ANALYZE. </span>
              <span style={{color: 'var(--primary)'}}>OPTIMIZE.</span>
            </h1>
            <p className="hero-subtitle">
              Advanced Machine Learning pipeline for high-precision electricity consumption forecasting based on weather heuristics.
            </p>
            <div className="hero-actions">
              <Link to="/auth" className="btn btn-primary">
                <Zap size={18} /> Get Started
              </Link>
            </div>
          </div>
          <div className="hero-illustration-right">
            <img src="/hero-illustration.png" alt="Electricity Analysis Illustration" className="hero-illustration floating-element" />
          </div>
        </div>
        <div className="wave-container">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C69.67,23.3,138.83,43.09,203.7,53.72,243.68,60.27,283.47,63.5,321.39,56.44Z" fill="#E0E5F7"></path>
          </svg>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '60px' }}>
          <h2 className="section-title">SYSTEM CAPABILITIES</h2>
          <div className="features-grid">
          <div className="feature-card glass-panel">
            <div className="feature-icon"><Database /></div>
            <h3>Smart Data Loading</h3>
            <p>Seamlessly ingest and validate electricity consumption and weather datasets.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon"><BarChart2 /></div>
            <h3>Visual Analytics</h3>
            <p>Comprehensive EDA with univariate, bivariate, and multivariate visualizations.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon"><BrainCircuit /></div>
            <h3>Feature Engineering</h3>
            <p>Automated extraction of temporal cycles, heating degree days, and weather heuristics.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon"><Cpu /></div>
            <h3>Advanced Modeling</h3>
            <p>Train and compare cutting-edge algorithms including LightGBM, XGBoost, and CatBoost.</p>
          </div>
          </div>
        </div>
        <div className="wave-container">
          <svg style={{transform: "scaleX(-1)"}} data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C69.67,23.3,138.83,43.09,203.7,53.72,243.68,60.27,283.47,63.5,321.39,56.44Z" fill="#FBEFC2"></path>
          </svg>
        </div>
      </section>

      <section id="about" className="about-wrapper">
        <div className="about-page container">
          <div className="about-header text-center">
            <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ABOUT <img src="/nimbus-logo.png" alt="Nimbus.ai Logo" style={{ height: '72px', marginLeft: '12px' }} />
            </h1>
          </div>

        <div className="about-content glass-panel">
          <div className="about-section">
            <h2 className="text-glow">MISSION DIRECTIVE</h2>
            <p>
              Nimbus.ai is a cybernetic logic core designed to predict and analyze electricity 
              consumption across multiple clusters. By leveraging high-precision weather heuristics, 
              temporal cycles, and state-of-the-art machine learning algorithms, Nimbus.ai provides 
              unparalleled forecasting accuracy for heating-driven regions.
            </p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <Server size={32} color="#00d1ff" className="stat-icon" />
              <h3>11.6K+</h3>
              <p>Data Points Processed</p>
            </div>
            <div className="stat-card">
              <Activity size={32} color="#2ff801" className="stat-icon" />
              <h3>97.2%</h3>
              <p>Peak Prediction Accuracy</p>
            </div>
            <div className="stat-card">
              <Shield size={32} color="#cbb5ff" className="stat-icon" />
              <h3>5</h3>
              <p>Integrated ML Models</p>
            </div>
          </div>


        </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
