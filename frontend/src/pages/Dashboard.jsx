import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle } from 'lucide-react';
import DatasetLoader from '../components/workflow/DatasetLoader';
import EDA from '../components/workflow/EDA';
import FeatureSelection from '../components/workflow/FeatureSelection';
import FeatureEngineering from '../components/workflow/FeatureEngineering';
import Preprocessing from '../components/workflow/Preprocessing';
import ModelTraining from '../components/workflow/ModelTraining';
import Prediction from '../components/workflow/Prediction';
import './Dashboard.css';

const STORAGE_KEY = 'nimbus_step_state';
// 12% spacing: 7 nodes fit with room for reset button at ~87%
const STEP_PCT = 12;

const Dashboard = () => {
  const { user } = useAuth();
  const [activeVisibleStep, setActiveVisibleStep] = useState(1);
  const [unlockedSteps, setUnlockedSteps] = useState([1]);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [stepKeys, setStepKeys] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pipelineData, setPipelineData] = useState({
    datasetInfo: null,
    edaStats: null,
    selectedFeaturesInfo: null,
    featuresInfo: null,
    preprocessInfo: null,
    trainResults: null,
  });

  // Restore from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { unlocked, completed } = JSON.parse(saved);
        if (Array.isArray(unlocked) && unlocked.length > 0) setUnlockedSteps(unlocked);
        if (Array.isArray(completed)) setCompletedSteps(completed);
      }
    } catch (e) {}
  }, []);

  // Persist to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        unlocked: unlockedSteps,
        completed: completedSteps,
      }));
    } catch (e) {}
  }, [unlockedSteps, completedSteps]);

  const stepDataKeys = [
    'datasetInfo', 'edaStats', 'selectedFeaturesInfo',
    'featuresInfo', 'preprocessInfo', 'trainResults', null,
  ];

  const unlockNextStep = (stepNumber, dataKey, data) => {
    setPipelineData(prev => ({ ...prev, [dataKey]: data }));
    setCompletedSteps(prev => prev.includes(stepNumber) ? prev : [...prev, stepNumber]);
    const nextStep = stepNumber + 1;
    if (nextStep <= 7) {
      setUnlockedSteps(prev => prev.includes(nextStep) ? prev : [...prev, nextStep]);
    }
  };

  const resetStep = (stepNumber) => {
    // Remount this step AND all downstream
    setStepKeys(prev => {
      const next = { ...prev };
      for (let i = stepNumber; i <= 7; i++) next[i] = (next[i] || 0) + 1;
      return next;
    });
    const clearedData = {};
    stepDataKeys.slice(stepNumber - 1).forEach(k => { if (k) clearedData[k] = null; });
    setPipelineData(prev => ({ ...prev, ...clearedData }));
    setCompletedSteps(prev => prev.filter(s => s < stepNumber));
    setUnlockedSteps(prev => {
      const base = prev.filter(s => s < stepNumber);
      return [...base, stepNumber];
    });
  };

  const resetAll = () => {
    setStepKeys(prev => {
      const next = {};
      Object.keys(prev).forEach(k => { next[k] = (prev[k] || 0) + 1; });
      return next;
    });
    setPipelineData({
      datasetInfo: null, edaStats: null, selectedFeaturesInfo: null,
      featuresInfo: null, preprocessInfo: null, trainResults: null,
    });
    setUnlockedSteps([1]);
    setCompletedSteps([]);
    sessionStorage.removeItem(STORAGE_KEY);
    // Scroll back to top / step 1
    setTimeout(() => {
      const el = document.getElementById('step-1');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleStepClick = (step) => {
    if (unlockedSteps.includes(step)) {
      const element = document.getElementById(`step-${step}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scrollspy
  useEffect(() => {
    const handleScroll = () => {
      const stepEls = [1, 2, 3, 4, 5, 6, 7].map(s => document.getElementById(`step-${s}`));
      const scrollPos = window.scrollY + 180;
      for (let i = stepEls.length - 1; i >= 0; i--) {
        const el = stepEls[i];
        if (el && scrollPos >= el.offsetTop) {
          setActiveVisibleStep(i + 1);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Progress line height: fills from step 1 to the highest completed step
  const maxCompleted = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
  const progressLineHeight = maxCompleted > 0 ? `${((maxCompleted - 1) / 6) * 100}%` : '0%';

  return (
    <div className="dashboard-page">

      {/* Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(20,28,40,0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '36px 32px',
            maxWidth: '420px', width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.25s ease',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(231,76,60,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <AlertTriangle size={28} color="#e74c3c" />
            </div>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.4rem',
              color: 'var(--on-surface)', marginBottom: '10px',
            }}>
              Reset All Progress?
            </h3>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '0.9rem',
              color: 'var(--on-surface-variant)', lineHeight: '1.6',
              marginBottom: '28px',
            }}>
              All configurations and pipeline data will be cleared.
              <br />
              <strong style={{ color: 'var(--on-surface)' }}>This action cannot be undone.</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1, padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem', cursor: 'pointer',
                  color: 'var(--on-surface-variant)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                No, Keep Working
              </button>
              <button
                onClick={() => { setShowResetConfirm(false); resetAll(); }}
                style={{
                  flex: 1, padding: '10px 20px',
                  background: '#e74c3c',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem', cursor: 'pointer',
                  color: '#fff',
                  fontWeight: '600',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#c0392b'}
                onMouseLeave={e => e.currentTarget.style.background = '#e74c3c'}
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        {/* Left Rail */}
        <div className="progress-rail">
          <div className="progress-line-bg">
            <div
              className="progress-line-fill"
              style={{ height: progressLineHeight }}
            />
          </div>

          {[1, 2, 3, 4, 5, 6, 7].map(step => {
            const isCompleted = completedSteps.includes(step);
            const isActive = activeVisibleStep === step;
            const isAccessible = unlockedSteps.includes(step);
            return (
              <div
                key={step}
                className={`progress-node ${isCompleted ? 'completed' : ''} ${isActive ? 'current' : ''}`}
                style={{
                  top: `${(step - 1) * STEP_PCT}%`,
                  cursor: isAccessible ? 'pointer' : 'default',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => handleStepClick(step)}
              >
                <div className="node-label">
                  STEP 0{step}
                </div>
              </div>
            );
          })}

          {/* Reset All — inside rail, below Step 7 */}
          <button
            className="rail-reset-btn"
            onClick={() => setShowResetConfirm(true)}
            title="Reset all progress"
          >
            RESET ALL
          </button>
        </div>

        {/* Main Content */}
        <div className="dashboard-content" style={{ position: 'relative' }}>

          <div key={`step-1-${stepKeys[1]}`} id="step-1" className="step-card hover-glow-card">
            <DatasetLoader
              isLocked={false}
              onComplete={(data) => unlockNextStep(1, 'datasetInfo', data)}
              onReset={() => resetStep(1)}
            />
          </div>

          <div key={`step-2-${stepKeys[2]}`} id="step-2" className="step-card hover-glow-card">
            <EDA
              isLocked={!unlockedSteps.includes(2)}
              datasetInfo={pipelineData.datasetInfo}
              onComplete={(data) => unlockNextStep(2, 'edaStats', data)}
              onReset={() => resetStep(2)}
            />
          </div>

          <div key={`step-3-${stepKeys[3]}`} id="step-3" className="step-card hover-glow-card">
            <FeatureSelection
              isLocked={!unlockedSteps.includes(3)}
              datasetInfo={pipelineData.datasetInfo}
              onComplete={(data) => unlockNextStep(3, 'selectedFeaturesInfo', data)}
              onReset={() => resetStep(3)}
            />
          </div>

          <div key={`step-4-${stepKeys[4]}`} id="step-4" className="step-card hover-glow-card">
            <FeatureEngineering
              isLocked={!unlockedSteps.includes(4)}
              onComplete={(data) => unlockNextStep(4, 'featuresInfo', data)}
              onReset={() => resetStep(4)}
              selectedFeatures={pipelineData.selectedFeaturesInfo?.columns || []}
            />
          </div>

          <div key={`step-5-${stepKeys[5]}`} id="step-5" className="step-card hover-glow-card">
            <Preprocessing
              isLocked={!unlockedSteps.includes(5)}
              onComplete={(data) => unlockNextStep(5, 'preprocessInfo', data)}
              onReset={() => resetStep(5)}
            />
          </div>

          <div key={`step-6-${stepKeys[6]}`} id="step-6" className="step-card hover-glow-card">
            <ModelTraining
              isLocked={!unlockedSteps.includes(6)}
              onComplete={(data) => unlockNextStep(6, 'trainResults', data)}
              onReset={() => resetStep(6)}
            />
          </div>

          <div key={`step-7-${stepKeys[7]}`} id="step-7" className="step-card hover-glow-card" style={{ marginBottom: '100px' }}>
            <Prediction
              isLocked={!unlockedSteps.includes(7)}
              trainResults={pipelineData.trainResults}
              features={pipelineData.preprocessInfo?.features || []}
              onComplete={() => {
                setCompletedSteps(prev => prev.includes(7) ? prev : [...prev, 7]);
              }}
            />
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
