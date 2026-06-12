import React, { useState } from 'react';
import { Lock, Settings2, SlidersHorizontal, CheckCircle } from 'lucide-react';
import axios from 'axios';

const Preprocessing = ({ isLocked, onComplete, onReset }) => {
  const [loading, setLoading] = useState(false);
  const [testSize, setTestSize] = useState(20);
  const [randomState, setRandomState] = useState(42);
  const [applyLog, setApplyLog] = useState(true);
  const [scaling, setScaling] = useState('standard');
  const [result, setResult] = useState(null);

  const handleProcess = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/preprocess', {
        test_size: testSize / 100,
        random_state: parseInt(randomState),
        apply_log: applyLog,
        scaling: scaling
      });
      setResult(res.data.info);
      onComplete(res.data.info);
    } catch (err) {
      console.error(err);
      alert('Error in preprocessing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`workflow-section glass-panel ${isLocked ? 'locked' : ''}`}>
      {isLocked && (
        <div className="lock-overlay">
          <Lock size={32} />
          <p>Complete Feature Engineering First</p>
        </div>
      )}
      
      <div style={{ padding: '32px' }}>
        <h2 style={{ color: 'var(--primary-fixed-dim)', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>
          STEP 05: PREPROCESSING & SPLIT
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginBottom: '32px' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
            <h3 style={{ marginBottom: '24px', color: 'var(--on-surface)', display: 'flex', alignItems: 'center' }}>
              <SlidersHorizontal size={18} style={{ marginRight: '8px' }} /> Split Configuration
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: 'var(--on-surface-variant)' }}>TEST SIZE</label>
                <span style={{ color: 'var(--primary-fixed-dim)' }}>{testSize}%</span>
              </div>
              <input 
                type="range" 
                min="10" max="40" step="5"
                value={testSize} 
                onChange={(e) => setTestSize(e.target.value)} 
                style={{ width: '100%', accentColor: 'var(--primary-fixed-dim)' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-code)', fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
                RANDOM SEED
              </label>
              <input 
                type="number" 
                className="input-field" 
                value={randomState}
                onChange={(e) => setRandomState(e.target.value)}
              />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
            <h3 style={{ marginBottom: '24px', color: 'var(--on-surface)', display: 'flex', alignItems: 'center' }}>
              <Settings2 size={18} style={{ marginRight: '8px' }} /> Transformations
            </h3>
            
            <label className="checkbox-label" style={{ marginBottom: '24px', cursor: 'pointer' }}>
              <input type="checkbox" checked={applyLog} onChange={(e) => setApplyLog(e.target.checked)} />
              <div className="checkbox-custom"></div>
              Apply Log Transformation on Target (np.log1p)
            </label>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-code)', fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
                SCALING ALGORITHM (NUMERIC FEATURES ONLY)
              </label>
              <select className="input-field" value={scaling} onChange={(e) => setScaling(e.target.value)}>
                <option value="standard">StandardScaler</option>
                <option value="minmax">MinMaxScaler</option>
                <option value="robust">RobustScaler</option>
                <option value="none">None</option>
              </select>
            </div>
            
            <div style={{ padding: '12px', background: 'rgba(0, 209, 255, 0.05)', borderRadius: '6px', border: '1px solid rgba(0, 209, 255, 0.2)' }}>
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                <strong>Note:</strong> Categorical features like <code>cluster_id</code> will automatically be transformed using Label Encoding.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button className="btn btn-outline" onClick={handleProcess} disabled={loading || result !== null} style={{ marginBottom: '16px' }}>
              <Settings2 size={18} />
              {loading ? 'PROCESSING...' : result ? 'PREPROCESSING COMPLETE' : 'EXECUTE PREPROCESSING'}
            </button>
            {result && (
              <div style={{ color: 'var(--on-surface)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={14} />
                <span>Preprocessing complete. Data is ready for training.</span>
              </div>
            )}
          </div>

          {result && (
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-code)', fontSize: '1rem', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ color: 'var(--on-surface)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                <span>TRAIN SET:</span> 
                <strong>{result.train_shape[0]} rows</strong>
              </div>
              <div style={{ color: 'var(--on-surface)', display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                <span>TEST SET:</span> 
                <strong>{result.test_shape[0]} rows</strong>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="continue-btn-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                const el = document.getElementById('step-6');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              PROCEED TO MODEL TRAINING &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preprocessing;
