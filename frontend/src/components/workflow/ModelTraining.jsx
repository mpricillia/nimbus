import React, { useState } from 'react';
import { Lock, Play, Activity, Save, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';

const ModelTraining = ({ isLocked, onComplete, onReset }) => {
  const [loading, setLoading] = useState(false);
  // Poin 5: default empty — user must pick a model first
  const [selectedModel, setSelectedModel] = useState('');
  const [customName, setCustomName] = useState('');
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState(6);
  const [results, setResults] = useState({});
  const [noModelWarning, setNoModelWarning] = useState(false);
  // Poin 6: duplicate dialog state
  const [duplicateDialog, setDuplicateDialog] = useState(null);

  const buildParams = () => {
    const params = {};
    if (['rf', 'xgb', 'lgbm'].includes(selectedModel)) {
      params.n_estimators = parseInt(nEstimators);
      params.max_depth = parseInt(maxDepth);
    } else if (selectedModel === 'catboost') {
      params.iterations = parseInt(nEstimators);
      params.depth = parseInt(maxDepth);
    }
    return params;
  };

  const doTrain = async (name, replace = false) => {
    setLoading(true);
    setDuplicateDialog(null);
    try {
      if (replace) {
        try { await axios.delete(`http://localhost:8000/api/models/${name}`); } catch (e) {}
      }
      const res = await axios.post('http://localhost:8000/api/train', {
        model_algo: selectedModel,
        custom_model_name: name,
        params: buildParams()
      });
      const newResults = { ...results, [name]: res.data.result };
      setResults(newResults);
      onComplete(newResults);
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.detail;
      alert(`Error training model: ${backendError || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    // Poin 5: warn if no model selected
    if (!selectedModel) {
      setNoModelWarning(true);
      return;
    }
    setNoModelWarning(false);
    if (!customName.trim()) {
      alert('Please provide a model name.');
      return;
    }

    // Poin 6: check for duplicate name in Supabase
    try {
      const checkRes = await axios.get('http://localhost:8000/api/models');
      if (checkRes.data.status === 'success') {
        const existingNames = checkRes.data.models.map(m => m.name);
        if (existingNames.includes(customName.trim())) {
          setDuplicateDialog({ name: customName.trim() });
          return;
        }
      }
    } catch (e) {
      // If check fails, proceed anyway
    }

    doTrain(customName.trim());
  };

  const models = [
    { id: 'linear', name: 'Linear Regression' },
    { id: 'rf', name: 'Random Forest' },
    { id: 'xgb', name: 'XGBoost' },
    { id: 'lgbm', name: 'LightGBM' },
    { id: 'catboost', name: 'CatBoost (Recommended)' },
  ];

  const showHyperparams = selectedModel && selectedModel !== 'linear';

  return (
    <div className={`workflow-section glass-panel ${isLocked ? 'locked' : ''}`}>
      {isLocked && (
        <div className="lock-overlay">
          <Lock size={32} />
          <p>Complete Preprocessing First</p>
        </div>
      )}

      {/* Poin 6: Duplicate name dialog */}
      {duplicateDialog && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', zIndex: 20, display: 'flex',
          alignItems: 'center', justifyContent: 'center', borderRadius: '8px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '28px',
            maxWidth: '380px', width: '90%', textAlign: 'center'
          }}>
            <AlertTriangle size={32} color="#e67e22" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: 'var(--on-surface)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
              Name Already Exists
            </h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '20px', fontFamily: 'var(--font-body)' }}>
              Model <strong>"{duplicateDialog.name}"</strong> already exists in Supabase. What would you like to do?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
                onClick={() => setDuplicateDialog(null)}
              >
                Choose Another Name
              </button>
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
                onClick={() => doTrain(duplicateDialog.name, true)}
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '32px', position: 'relative' }}>
        <h2 style={{ color: 'var(--primary-fixed-dim)', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>
          STEP 06: ALGORITHM TRAINING
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>

          <div style={{ paddingRight: '16px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--on-surface-variant)', fontSize: '12px', fontFamily: 'var(--font-code)' }}>
              SELECT ARCHITECTURE
            </h3>

            {/* Poin 5: warning if no model selected */}
            {noModelWarning && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                color: '#e67e22', fontSize: '0.8rem', fontFamily: 'var(--font-code)',
                marginBottom: '12px', padding: '8px 12px',
                background: 'rgba(230, 126, 34, 0.08)', borderRadius: '6px',
                border: '1px solid rgba(230, 126, 34, 0.3)'
              }}>
                <AlertTriangle size={14} />
                Please select an algorithm before training.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {models.map(m => (
                <div
                  key={m.id}
                  onClick={() => { setSelectedModel(m.id); setNoModelWarning(false); }}
                  style={{
                    padding: '8px 12px', borderRadius: '4px',
                    border: `1px solid ${selectedModel === m.id ? 'var(--primary-fixed-dim)' : 'var(--outline-variant)'}`,
                    background: selectedModel === m.id ? 'rgba(0, 209, 255, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    color: selectedModel === m.id ? 'var(--primary-fixed)' : 'var(--on-surface)',
                    transition: 'all 0.2s', fontSize: '0.9rem'
                  }}
                >
                  {m.name}
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: '16px', color: 'var(--on-surface-variant)', fontSize: '12px', fontFamily: 'var(--font-code)' }}>
              HYPERPARAMETERS
            </h3>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px',
              opacity: showHyperparams ? 1 : 0.4, pointerEvents: showHyperparams ? 'auto' : 'none'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', fontFamily: 'var(--font-code)' }}>
                  <span>{selectedModel === 'catboost' ? 'ITERATIONS' : 'N_ESTIMATORS'}</span>
                  <span style={{ color: 'var(--on-surface)' }}>{nEstimators}</span>
                </div>
                <input type="range" min="10" max="1000" step="10"
                  value={nEstimators} onChange={e => setNEstimators(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary-fixed-dim)' }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', fontFamily: 'var(--font-code)' }}>
                  <span>MAX DEPTH</span>
                  <span style={{ color: 'var(--on-surface)' }}>{maxDepth}</span>
                </div>
                <input type="range" min="1" max="20" step="1"
                  value={maxDepth} onChange={e => setMaxDepth(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary-fixed-dim)' }} />
              </div>
            </div>

            <h3 style={{ marginBottom: '8px', color: 'var(--on-surface-variant)', fontSize: '12px', fontFamily: 'var(--font-code)' }}>
              SAVE AS
            </h3>
            <input
              type="text"
              className="input-field"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Enter model name"
              style={{ marginBottom: '24px' }}
            />

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleTrain}
              disabled={loading}
            >
              <Play size={18} />
              {loading ? 'TRAINING & SAVING...' : 'INITIALIZE TRAINING'}
            </button>
          </div>

          {/* Right: Results */}
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--on-surface)', fontSize: '12px', fontFamily: 'var(--font-code)' }}>
              EVALUATION METRICS & STORAGE
            </h3>
            {Object.keys(results).length === 0 ? (
              <div className="flex-center" style={{ height: '200px', border: '1px dashed var(--outline-variant)', borderRadius: '8px', color: 'var(--outline)' }}>
                <Activity size={24} style={{ marginRight: '12px' }} />
                Awaiting model execution...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '450px', overflowY: 'auto', paddingRight: '8px' }}>
                {Object.values(results).map((res, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--outline-variant)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--on-surface)', fontWeight: 'bold' }}>{res.model_name} ({res.algorithm.toUpperCase()})</span>
                      {/* Poin 7: fix yellow "TRAINING COMPLETE" → dark blue */}
                      <span style={{ color: 'var(--on-surface)', fontSize: '12px', fontFamily: 'var(--font-code)' }}>TRAINING COMPLETE</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', fontFamily: 'var(--font-code)', fontSize: '0.9rem', marginBottom: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--on-surface-variant)', fontSize: '10px' }}>RMSE</div>
                        <div style={{ color: 'var(--on-surface)' }}>{res.metrics.rmse.toFixed(4)}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--on-surface-variant)', fontSize: '10px' }}>MAE</div>
                        <div style={{ color: 'var(--on-surface)' }}>{res.metrics.mae.toFixed(4)}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--on-surface-variant)', fontSize: '10px' }}>R² SCORE</div>
                        <div style={{ color: 'var(--on-surface)' }}>{res.metrics.r2.toFixed(4)}</div>
                      </div>
                    </div>
                    {res.storage && (
                      /* Poin 7: fix green storage box → dark blue */
                      <div style={{ background: 'rgba(80,111,131,0.1)', padding: '8px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Save size={14} />
                        {res.storage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {Object.keys(results).length > 0 && (
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
                const el = document.getElementById('step-7');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              PROCEED TO PREDICTION &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelTraining;
