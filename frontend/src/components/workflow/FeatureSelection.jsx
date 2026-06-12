import React, { useState, useEffect } from 'react';
import { Lock, CheckSquare, Square, Filter } from 'lucide-react';
import axios from 'axios';

const FeatureSelection = ({ isLocked, datasetInfo, onComplete, onReset }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (datasetInfo && datasetInfo.columns_list) {
      const features = datasetInfo.columns_list.filter(f => f !== 'ID' && f !== 'electricity_consumption');
      setAllFeatures(features);
      // Default: nothing selected — user must choose manually
      setSelectedFeatures([]);
    }
  }, [datasetInfo]);

  const toggleFeature = (feature) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const selectAll = () => setSelectedFeatures(allFeatures);
  const deselectAll = () => setSelectedFeatures([]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}'}/api/feature_selection`, {
        selected_columns: selectedFeatures
      });
      setResult(res.data.info);
      onComplete(res.data.info);
    } catch (err) {
      console.error(err);
      alert('Error applying feature selection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`workflow-section glass-panel ${isLocked ? 'locked' : ''}`}>
      {isLocked && (
        <div className="lock-overlay">
          <Lock size={32} />
          <p>Complete EDA First</p>
        </div>
      )}
      
      <div style={{ padding: '32px' }}>
        <h2 style={{ color: 'var(--primary-fixed-dim)', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>
          STEP 03: FEATURE SELECTION
        </h2>
        
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: '24px' }}>
          Select the features you want to keep for the model. The target variable (electricity_consumption) is automatically included.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={selectAll}>Select All</button>
          <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={deselectAll}>Deselect All</button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '12px',
          marginBottom: '32px',
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '8px'
        }}>
          {allFeatures.map(feature => {
            const isSelected = selectedFeatures.includes(feature);
            return (
              <div 
                key={feature}
                onClick={() => toggleFeature(feature)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px',
                  background: isSelected ? 'rgba(0, 209, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                  border: isSelected ? '1px solid var(--primary-fixed-dim)' : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isSelected ? <CheckSquare size={18} color="var(--primary-fixed)" /> : <Square size={18} color="var(--on-surface-variant)" />}
                <span style={{ color: isSelected ? 'var(--on-surface)' : 'var(--on-surface-variant)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
                  {feature}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={loading || selectedFeatures.length === 0}
          >
            <Filter size={18} />
            {loading ? 'APPLYING...' : result ? 'SELECTION APPLIED' : 'APPLY SELECTION'}
          </button>
          
          {result && (
            <div style={{ color: 'var(--on-surface)', fontFamily: 'var(--font-code)', fontSize: '0.9rem' }}>
              Selected Features Count: {result.columns.length}
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
                const el = document.getElementById('step-4');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              PROCEED TO FEATURE ENGINEERING &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureSelection;
