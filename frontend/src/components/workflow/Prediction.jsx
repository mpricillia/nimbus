import React, { useState, useEffect } from 'react';
import { Lock, Zap } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Prediction = ({ isLocked, trainResults, features, onComplete }) => {
  const { user } = useAuth();
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
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/models`);
        if (res.data.status === 'success' && res.data.models.length > 0) {
          // Sort newest first and filter by user
          const sorted = [...res.data.models]
            .filter(m => m.metrics && m.user_email === user?.email)
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
    if (!allFilled) {
      alert('Please fill in all input fields before generating a prediction.');
      return;
    }
    setLoading(true);
    try {
      const processedData = {};
      Object.keys(inputData).forEach(k => {
        processedData[k] = parseFloat(inputData[k]) || 0;
      });
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/predict`, {
        custom_model_name: selectedModel || models[0]?.name,
        input_data: processedData,
        user_email: user?.email
      });
      setPrediction(res.data.prediction);
      if (onComplete) onComplete();
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

  const allFilled = displayFeatures.every(f => inputData[f.name] !== undefined && inputData[f.name] !== '');

  // Poin 8: Compute dynamic prediction confidence
  const selectedModelData = models.find(m => m.name === selectedModel);
  let confidencePct = null;

  if (prediction !== null && selectedModelData) {
    let baseConf = (selectedModelData.r2 != null ? selectedModelData.r2 : 0.8) * 100;
    baseConf = Math.max(0, Math.min(100, baseConf));
    
    // Calculate penalty based on input extremity
    let totalPenalty = 0;
    displayFeatures.forEach(f => {
      const val = parseFloat(inputData[f.name]);
      if (!isNaN(val)) {
        const mid = (f.max + f.min) / 2;
        const rangeHalf = (f.max - f.min) / 2;
        const distance = Math.abs(val - mid) / (rangeHalf || 1);
        
        if (distance > 1) {
          totalPenalty += 5; // Extreme outlier
        } else if (distance > 0.8) {
          totalPenalty += 2; // Near the edge
        }
      }
    });

    let conf = Math.max(0, baseConf - totalPenalty);
    
    let color = '#e74c3c';
    let icon = '🔴';
    let text = 'Rendah';
    let msg = 'Kondisi sangat ekstrem atau di luar kebiasaan historis.';
    
    if (conf >= 85) {
      color = '#2ecc71';
      icon = '🟢';
      text = 'Tinggi';
      msg = 'Sangat yakin. Kondisi mirip dengan pola historis.';
    } else if (conf >= 70) {
      color = '#f1c40f';
      icon = '🟡';
      text = 'Sedang';
      msg = 'Cukup yakin. Terdapat sedikit kondisi yang tidak biasa.';
    }

    confidencePct = {
      val: `${conf.toFixed(1)}%`,
      color,
      icon,
      text,
      msg
    };
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

            {!allFilled && models.length > 0 && (
              <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center', fontFamily: 'var(--font-code)' }}>
                * Please fill in all {displayFeatures.length} fields above to enable prediction.
              </div>
            )}
            
            <button
              className="btn btn-primary"
              style={{ 
                marginTop: '16px', 
                width: '100%', 
                opacity: (!allFilled || loading || models.length === 0) ? 0.5 : 1,
                cursor: (!allFilled || loading || models.length === 0) ? 'not-allowed' : 'pointer'
              }}
              onClick={handlePredict}
              disabled={!allFilled || loading || models.length === 0}
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

            {/* Poin 8: confidence indicator */}
            {prediction !== null && confidencePct && (
              <div style={{ marginTop: '24px', fontFamily: 'var(--font-body)' }}>
                <div style={{ fontSize: '10px', marginBottom: '8px', letterSpacing: '1px', color: 'var(--on-surface-variant)', fontFamily: 'var(--font-code)' }}>
                  TINGKAT KEYAKINAN PREDIKSI
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{confidencePct.icon}</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: confidencePct.color }}>
                    {confidencePct.text} ({confidencePct.val})
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', padding: '0 16px', lineHeight: '1.4' }}>
                  {confidencePct.msg}
                </div>
              </div>
            )}
          </div>

        </div>

        {prediction !== null && confidencePct && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--outline-variant)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--on-surface-variant)',
            fontFamily: 'var(--font-body)',
            lineHeight: '1.6'
          }}>
            <h4 style={{ color: 'var(--on-surface)', marginBottom: '8px', fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>💡 Bagaimana Tingkat Keyakinan Dihitung?</h4>
            <p style={{ margin: 0 }}>
              Tingkat keyakinan diambil dari <strong>Kualitas Model Asli (Skor R²)</strong> yang dikurangi dengan <strong>Hukuman Data Ekstrem (Outlier Penalty)</strong>. Semakin ekstrem atau tidak wajar angka cuaca yang Anda masukkan dibandingkan batas wajar masa lalu, maka persentase keyakinan model akan semakin menurun.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prediction;
