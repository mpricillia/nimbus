import React, { useState } from 'react';
import { Lock, Cpu, CheckSquare, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// Poin 2: Maps each FE option to the features it depends on from Feature Selection
const FEATURE_DEPENDENCIES = {
  hdd: ['temperature_2m_max', 'temperature_2m_min'],
  daylight: ['daylight_duration', 'sunshine_duration'],
  date_components: null, // always available
  cyclical: null,
  pandemic: null,
};

const FeatureEngineering = ({ isLocked, onComplete, onReset, selectedFeatures = [] }) => {
  const [loading, setLoading] = useState(false);
  const [transformations, setTransformations] = useState({
    date_components: false,
    cyclical: false,
    pandemic: false,
    hdd: false,
    daylight: false,
  });
  const [result, setResult] = useState(null);

  // Poin 2: Check if a transformation option is available based on feature selection
  const isOptionAvailable = (key) => {
    const deps = FEATURE_DEPENDENCIES[key];
    if (!deps) return true; // no dependency → always available
    if (selectedFeatures.length === 0) return true; // no info yet → allow
    return deps.some(dep => selectedFeatures.includes(dep));
  };

  const getUnavailableReason = (key) => {
    const deps = FEATURE_DEPENDENCIES[key];
    if (!deps) return null;
    return `Not available: required feature(s) [${deps.join(', ')}] were not included in Feature Selection.`;
  };

  const toggleTransformation = (key) => {
    if (!isOptionAvailable(key)) return;
    setTransformations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      const activeTransformations = Object.keys(transformations).filter(k => transformations[k] && isOptionAvailable(k));
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/feature_engineering`, {
        transformations: activeTransformations
      });
      setResult(res.data.info);
      onComplete(res.data.info);
    } catch (err) {
      console.error(err);
      alert('Error applying features');
    } finally {
      setLoading(false);
    }
  };

  const renderCheckbox = (key, label) => {
    const available = isOptionAvailable(key);
    const reason = !available ? getUnavailableReason(key) : null;

    return (
      <div key={key}>
        <label
          className="checkbox-label"
          style={{ marginBottom: '8px', cursor: available ? 'pointer' : 'not-allowed', opacity: available ? 1 : 0.45 }}
          title={reason || ''}
        >
          <input
            type="checkbox"
            checked={transformations[key] && available}
            onChange={() => toggleTransformation(key)}
            disabled={!available}
          />
          <div className="checkbox-custom"></div>
          {label}
        </label>
        {!available && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#e67e22', fontSize: '10px', fontFamily: 'var(--font-code)', marginBottom: '8px', lineHeight: '1.4' }}>
            <AlertTriangle size={10} style={{ marginTop: '1px', flexShrink: 0 }} />
            {reason}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`workflow-section glass-panel ${isLocked ? 'locked' : ''}`}>
      {isLocked && (
        <div className="lock-overlay">
          <Lock size={32} />
          <p>Complete Feature Selection First</p>
        </div>
      )}

      <div style={{ padding: '32px' }}>
        <h2 style={{ color: 'var(--primary-fixed-dim)', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>
          STEP 04: FEATURE ENGINEERING
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginBottom: '32px' }}>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--on-surface)' }}>Temporal Cycles</h3>
            {renderCheckbox('date_components', 'Extract Date Components (Year, Month, Day)')}
            {renderCheckbox('cyclical', 'Cyclical Encoding (sin/cos transformations)')}
            {renderCheckbox('pandemic', 'Pandemic Anomaly Flag (2020)')}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--on-surface)' }}>Weather Heuristics</h3>
            {renderCheckbox('hdd', 'Heating Degree Days (HDD)')}
            {renderCheckbox('daylight', 'Daylight Ratio')}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={handleApply} disabled={loading || result !== null}>
            <Cpu size={18} />
            {loading ? 'PROCESSING...' : result ? 'FEATURES APPLIED' : 'APPLY TRANSFORMATIONS'}
          </button>

          {result && (
            <div style={{ color: 'var(--on-surface)', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-code)' }}>
              <CheckSquare size={18} style={{ marginRight: '8px' }} />
              TOTAL FEATURES NOW: {result.shape[1]}
            </div>
          )}
        </div>

        {result && (
          <div className="continue-btn-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Poin 1: Reset per step */}
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 16px', color: 'var(--on-surface-variant)', borderColor: 'var(--outline-variant)' }}
              onClick={onReset}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const el = document.getElementById('step-5');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              PROCEED TO PREPROCESSING &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureEngineering;
