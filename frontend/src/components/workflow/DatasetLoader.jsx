import React, { useState } from 'react';
import { Database, Lock, CheckCircle, FileText } from 'lucide-react';
import axios from 'axios';

const DatasetLoader = ({ isLocked, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoad = async () => {
    setLoading(true);
    try {
      // Connect to FastAPI backend
      const res = await axios.post('http://localhost:8000/api/load_data', { filename: 'dataset.csv' });
      setInfo(res.data.info);
      setSuccessMsg('Successfully loaded train.csv and test.csv into pipeline.');
      onComplete(res.data.info);
    } catch (err) {
      console.error(err);
      alert('Error loading dataset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`workflow-section glass-panel ${isLocked ? 'locked' : ''}`}>
      {isLocked && (
        <div className="lock-overlay">
          <Lock size={32} />
          <p>Complete previous steps</p>
        </div>
      )}
      
      <div style={{ padding: '32px' }}>
        <h2 style={{ color: 'var(--primary-fixed-dim)', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>
          STEP 01: DATA INGESTION
        </h2>
        
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', alignItems: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleLoad}
            disabled={loading}
          >
            <Database size={18} />
            {loading ? 'LOADING...' : 'Load dataset.csv'}
          </button>
          
          {successMsg && (
            <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} />
              {successMsg}
            </div>
          )}
        </div>

        {info && (
          <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
              <div>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '12px', fontFamily: 'var(--font-display)' }}>RECORDS</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h3 style={{ fontSize: '2rem', color: 'var(--primary-fixed-dim)', fontFamily: 'var(--font-display)' }}>{info.rows.toLocaleString()}</h3>
                  {/* Added horizontal line as requested */}
                  <div style={{ height: '2px', width: '100px', background: 'var(--primary-fixed-dim)' }}></div>
                </div>
              </div>
              <div>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '12px', fontFamily: 'var(--font-display)' }}>FEATURES</p>
                <h3 style={{ fontSize: '2rem', color: 'var(--primary-fixed-dim)', fontFamily: 'var(--font-display)' }}>{info.columns}</h3>
              </div>
            </div>
            
            {/* Displaying dataset snippet/head */}
            {info.head && info.head.length > 0 && (
              <div style={{ marginTop: '20px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '8px', padding: '16px', overflowX: 'auto', border: '1px solid var(--outline-variant)' }}>
                <h4 style={{ color: 'var(--on-surface-variant)', marginBottom: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
                  <FileText size={16} /> Dataset Preview (Top 5 Rows)
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'var(--font-code)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--outline-variant)', color: 'var(--primary-fixed-dim)' }}>
                      {Object.keys(info.head[0]).map(key => (
                        <th key={key} style={{ padding: '8px', textAlign: 'left' }}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {info.head.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                        {Object.values(row).map((val, i) => (
                          <td key={i} style={{ padding: '8px', color: 'var(--on-surface)' }}>{val !== null ? val.toString() : 'NaN'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Proceed Button */}
            <div className="continue-btn-container">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const el = document.getElementById('step-2');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                PROCEED TO EDA &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetLoader;
