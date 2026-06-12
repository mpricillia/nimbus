import React, { useState, useEffect } from 'react';
import { Lock, Zap } from 'lucide-react';
import axios from 'axios';

const Prediction = ({ isLocked, trainResults, features }) => {
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]); // [{name, r2}] sorted newest first
  const [selectedModel, setSelectedModel] = useState('');
  const [inputData, setInputData] = useState({});
  const [prediction, setPrediction] = useState(null);

  // Poin 8: Fetch models from API (supports page refresh / Poin 9)
  useEffect(() => {
    const buildFromTrainResults = () => {
      if (trainResults && Object.keys(trainResults).length > 0) {
        const list = Object.values(trainResults).map(r => ({
          name: r.model_name,
          r2: r.metrics?.r2 ?? null,
          rmse: r.metrics?.rmse ?? null,
          created_at: null,
        }));
        setModels(list);
        setSelectedModel(list[0]?.name || '');
      }
    };

    const fetchFromApi = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/models');
        if (res.data.status === 'success' && res.data.models.length > 0) {
          // Sort newest first
          const sorted = [...res.data.models]
            .filter(m => m.metrics)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const list = sorted.map(m => ({
            name: m.name,
            r2: m.metrics?.metrics?.r2 ?? m.metrics?.r2 ?? null,
            rmse: m.metrics?.metrics?.rmse ?? m.metrics?.rmse ?? null,
            created_at: m.created_at,
          }));
          setModels(list);
          setSelectedModel(list[0]?.name || '');
          return true;
        }
      } catch (e) {}
      return false;
    };

    fetchFromApi().then(ok => {
      if (!ok) buildFromTrainResults();
    });
  }, [trainResults]);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const processedData = {};
      Object.keys(inputData).forEach(k => {
        processedData[k] = parseFloat(inputData[k]) || 0;
      });
      const res = await axios.post('http://localhost:8000/api/predict', {
        custom_model_name: selectedModel || models[0]?.name,
        input_data: processedData
      });
      setPrediction(res.data.prediction);
    } catch (err) {
      console.error(err);
      alert('Prediction failed. Please ensure all required features are provided.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setInputData(prev => ({ ...prev, [field]: value }));
  };

  const displayFeatures = [
    { name: 'temperature_2m_max', min: -20, max: 50, step: 0.1 },
    { name: 'temperature_2m_min', min: -30, max: 40, step: 0.1 },
    { name: 'apparent_temperature_max', min: -20, max: 60, step: 0.1 },
    { name: 'apparent_temperature_min', min: -30, max: 50, step: 0.1 },
    { name: 'sunshine_duration', min: 0, max: 86400, step: 100 },
    { name: 'daylight_duration', min: 0, max: 86400, step: 100 },
    { name: 'wind_speed_10m_max', min: 0, max: 100, step: 0.1 },
    { name: 'wind_gusts_10m_max', min: 0, max: 150, step: 0.1 },
    { name: 'wind_direction_10m_dominant', min: 0, max: 360, step: 1 },
    { name: 'shortwave_radiation_sum', min: 0, max: 30, step: 0.1 },
    { name: 'et0_fao_evapotranspiration', min: 0, max: 10, step: 0.1 },
    { name: 'cluster_id', min: 1, max: 4, step: 1 },
  ];

  // Poin 8: Compute dynamic prediction confidence
  const selectedModelData = models.find(m => m.name === selectedModel);
  let confidencePct = null;

  if (prediction !== null && selectedModelData) {
    if (selectedModelData.rmse != null) {
      // RMSE is log-scaled. Convert to approximate relative error
      const relativeError = Math.exp(selectedModelData.rmse) - 1;
      let conf = 100 - (relativeError * 100);
      
      // Penalty for outlier predictions (assuming typical consumption is around 350 GWh)
      const penalty = (Math.abs(prediction - 350) / 350) * 3; // 0 to 3% penalty
      conf = Math.max(0, Math.min(99.9, conf - penalty));
      confidencePct = `${conf.toFixed(1)}%`;
    } else if (selectedModelData.r2 != null) {
      // Fallback if no RMSE
      let conf = selectedModelData.r2 * 100;
      const penalty = (Math.abs(prediction - 350) / 350) * 2;
      conf = Math.max(0, Math.min(99.9, conf - penalty));
      confidencePct = `${conf.toFixed(1)}%`;
    }
  }

  return (
    <div className={`workflow-section glass-panel ${isLocked ? 'locked' : ''}`}>
      {isLocked && (
        <div className="lock-overlay">
          <Lock size={32} />
          <p>Complete Training First</p>
        </div>
      )}

      <div style={{ padding: '32px' }}>
        <h2 style={{ color: 'var(--primary-fixed-dim)', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>
          STEP 07: INFERENCE & PREDICTION
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>

          <div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-code)', fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
                ACTIVE MODEL
              </label>
              {/* Poin 8: sorted newest first */}
              <select
                className="input-field"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {models.length > 0 ? (
                  models.map(m => (
                    <option key={m.name} value={m.name}>{m.name.toUpperCase()}</option>
                  ))
                ) : (
                  <option value="">No models trained yet</option>
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {displayFeatures.map(f => {
                const rawVal = inputData[f.name];
                const val = parseFloat(rawVal);
                const hasError = rawVal !== undefined && rawVal !== '' && !isNaN(val) && (val < f.min || val > f.max);

                return (
                  <div key={f.name}>
                    <label style={{
                      display: 'block', fontFamily: 'var(--font-code)', fontSize: '10px',
                      color: 'var(--on-surface-variant)', marginBottom: '4px',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }} title={f.name}>
                      {f.name.replace(/_/g, ' ').toUpperCase()}
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder=""
                      min={f.min} max={f.max} step={f.step}
                      value={rawVal !== undefined ? rawVal : ''}
                      onChange={(e) => handleInputChange(f.name, e.target.value)}
                      style={{
                        fontSize: '0.9rem', padding: '8px',
                        borderColor: hasError ? '#e74c3c' : undefined,
                        boxShadow: hasError ? '0 0 8px rgba(231,76,60,0.3)' : undefined
                      }}
                    />
                    {hasError && (
                      <div style={{ color: '#e74c3c', fontSize: '10px', marginTop: '4px', fontFamily: 'var(--font-code)' }}>
                        Range: {f.min} – {f.max}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: '24px', width: '100%' }}
              onClick={handlePredict}
              disabled={loading || models.length === 0}
            >
              <Zap size={18} />
              {loading ? 'CALCULATING...' : 'GENERATE PREDICTION'}
            </button>
          </div>

          {/* Result panel */}
          <div className="flex-center" style={{
            background: 'rgba(0, 209, 255, 0.05)',
            border: '1px solid var(--primary-fixed-dim)',
            borderRadius: '8px',
            flexDirection: 'column',
            padding: '24px',
            textAlign: 'center',
            boxShadow: 'inset 0 0 20px rgba(0, 209, 255, 0.1)'
          }}>
            <h3 style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-code)', fontSize: '12px', marginBottom: '16px', letterSpacing: '2px' }}>
              FORECASTED CONSUMPTION
            </h3>

            {prediction !== null ? (
              <div style={{ color: 'var(--on-surface)' }}>
                <span style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
                  {prediction.toFixed(2)}
                </span>
                <span style={{ fontSize: '1rem', marginLeft: '8px' }}>GWh</span>
              </div>
            ) : (
              <div style={{ color: 'var(--outline)', fontSize: '2rem', fontFamily: 'var(--font-display)' }}>
                --.--
              </div>
            )}

            {/* Poin 8: confidence as R² percentage */}
            {prediction !== null && confidencePct && (
              <div style={{ marginTop: '16px', fontFamily: 'var(--font-code)', color: 'var(--on-surface-variant)' }}>
                <div style={{ fontSize: '10px', marginBottom: '4px', letterSpacing: '1px' }}>PREDICTION CONFIDENCE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--on-surface)' }}>{confidencePct}</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Prediction;
