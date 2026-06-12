import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, X, Trash2, Cpu, AlertTriangle } from 'lucide-react';
import './ActivitiesPage.css';

const ActivitiesPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelToDelete, setModelToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!modelToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/models/${modelToDelete}`);
      setModels(prev => prev.filter(m => m.name !== modelToDelete));
      if (selectedModel?.name === modelToDelete) setSelectedModel(null);
      setModelToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete model.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/models`);
        if (res.data.status === 'success') {
          // Filter out models that might be incomplete or missing metrics
          setModels(res.data.models.filter(m => m.metrics));
        }
      } catch (err) {
        console.error('Error fetching models:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="profile-page">
      <div className="container">
        
        <div className="activities-header" style={{ marginBottom: '32px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '24px' }}>

          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Activity size={32} color="var(--primary)" />
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', fontSize: '2.5rem', margin: 0 }}>Recent Activities</h1>
          </div>
          <p className="profile-subtitle" style={{ marginTop: '8px' }}>History of trained models and reports</p>
        </div>

        {loading ? (
          <p style={{ fontFamily: 'var(--font-code)' }}>Loading recent activities...</p>
        ) : models.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <p>No models trained yet.</p>
          </div>
        ) : (
          <div className="models-grid">
            {models.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((model, idx) => (
              <div key={idx} className="model-card" onClick={() => setSelectedModel(model)} style={{ position: 'relative' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setModelToDelete(model.name); }}
                  style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--on-surface-variant)', opacity: 0.5,
                    padding: '4px', borderRadius: '4px', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = '#e74c3c'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.color = 'var(--on-surface-variant)'; }}
                  title="Delete model"
                >
                  <Trash2 size={16} />
                </button>
                <div className="model-card-header">
                  <div className="model-icon">
                    <Cpu size={20} />
                  </div>
                  <span className="model-algo">{model.algorithm.toUpperCase()}</span>
                </div>
                <h3 className="model-name">{model.name}</h3>
                <p className="model-date">{formatDate(model.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedModel && (
        <div className="modal-overlay" onClick={() => setSelectedModel(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedModel(null)}>
              <X size={24} />
            </button>
            
            <h2>{selectedModel.name}</h2>
            
            <div className="metric-grid">
              <div className="metric-card">
                <p className="metric-label">ALGORITHM</p>
                <p className="metric-value" style={{ fontSize: '1.2rem' }}>{selectedModel.algorithm.toUpperCase()}</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">TRAINED ON</p>
                <p className="metric-value" style={{ fontSize: '1.1rem' }}>{formatDate(selectedModel.created_at)}</p>
              </div>
              
              {selectedModel.metrics?.metrics && Object.entries(selectedModel.metrics.metrics).map(([key, val]) => (
                <div className="metric-card" key={key}>
                  <p className="metric-label">{key.toUpperCase()}</p>
                  <p className="metric-value">{typeof val === 'number' ? val.toFixed(4) : val}</p>
                </div>
              ))}
            </div>

            {selectedModel.params && (
              <div className="params-section">
                <h3>Hyperparameters</h3>
                <div className="params-box">
                  {JSON.stringify(selectedModel.params, null, 2)}
                </div>
              </div>
            )}
            
            <div className="metrics-explanation">
              <h4>Metrics Guide</h4>
              <p><strong>MAE (Mean Absolute Error):</strong> Rata-rata kesalahan mutlak prediksi. Semakin kecil nilainya (mendekati 0), semakin akurat modelnya.</p>
              <p><strong>RMSE (Root Mean Square Error):</strong> Standar deviasi dari error prediksi. Sangat sensitif terhadap outlier. Semakin kecil semakin baik.</p>
              <p><strong>R² (R-Squared):</strong> Persentase variansi data yang bisa dijelaskan oleh model. Mendekati 1.0 (100%) berarti sangat sempurna.</p>
            </div>
            
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modelToDelete && (
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
              Delete Model?
            </h3>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '0.9rem',
              color: 'var(--on-surface-variant)', lineHeight: '1.6',
              marginBottom: '28px',
            }}>
              Are you sure you want to delete <strong style={{color: 'var(--on-surface)'}}>"{modelToDelete}"</strong>?
              <br />
              <span style={{ color: 'var(--on-surface)' }}>This action cannot be undone.</span>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setModelToDelete(null)}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem', cursor: isDeleting ? 'not-allowed' : 'pointer',
                  color: 'var(--on-surface-variant)',
                  transition: 'all 0.2s',
                  opacity: isDeleting ? 0.5 : 1
                }}
                onMouseEnter={e => { if(!isDeleting) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                onMouseLeave={e => { if(!isDeleting) e.currentTarget.style.background = 'transparent' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '10px 20px',
                  background: '#e74c3c',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem', cursor: isDeleting ? 'not-allowed' : 'pointer',
                  color: '#fff',
                  fontWeight: '600',
                  transition: 'background 0.2s',
                  opacity: isDeleting ? 0.5 : 1
                }}
                onMouseEnter={e => { if(!isDeleting) e.currentTarget.style.background = '#c0392b' }}
                onMouseLeave={e => { if(!isDeleting) e.currentTarget.style.background = '#e74c3c' }}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default ActivitiesPage;
