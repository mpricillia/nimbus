import React, { useState, useEffect, useMemo } from 'react';
import { Lock, BarChart2, Activity, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';
import axios from 'axios';

const EDA = ({ isLocked, datasetInfo, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('univariate');
  const [stats, setStats] = useState(null);
  
  const numericFeatures = useMemo(() => {
    if (!datasetInfo || !datasetInfo.dtypes) return [];
    return Object.keys(datasetInfo.dtypes).filter(col => {
      const dtype = datasetInfo.dtypes[col].toLowerCase();
      return dtype.includes('int') || dtype.includes('float');
    });
  }, [datasetInfo]);
  
  const [uniFeature, setUniFeature] = useState(numericFeatures[0] || '');
  const [uniChartType, setUniChartType] = useState('Histogram');
  
  const [biFeatureX, setBiFeatureX] = useState(numericFeatures[0] || '');
  const [biFeatureY, setBiFeatureY] = useState(numericFeatures[1] || '');

  // Initialize defaults once datasetInfo is available
  useEffect(() => {
    if (numericFeatures.length > 0 && !uniFeature) {
      setUniFeature(numericFeatures[0]);
      setBiFeatureX(numericFeatures[0]);
      setBiFeatureY(numericFeatures[1] || numericFeatures[0]);
    }
  }, [numericFeatures]);

  const fetchEDA = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}'}/api/eda`, {
        feature_x: biFeatureX,
        feature_y: biFeatureY
      });
      setStats(res.data.stats);
      onComplete(res.data.stats);
    } catch (err) {
      console.error(err);
      alert('Error generating EDA');
    } finally {
      setLoading(false);
    }
  };


  // Histogram Binning Logic
  const getHistogramData = () => {
    if (!stats || !stats.histogram_data || !stats.histogram_data[uniFeature]) return [];
    const data = stats.histogram_data[uniFeature];
    if (data.length === 0) return [];
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const bins = 10;
    const binWidth = (max - min) / bins;
    
    const histogram = Array.from({ length: bins }, (_, i) => ({
      name: `${(min + i * binWidth).toFixed(1)} - ${(min + (i + 1) * binWidth).toFixed(1)}`,
      count: 0
    }));
    
    data.forEach(val => {
      let binIndex = Math.floor((val - min) / binWidth);
      if (binIndex >= bins) binIndex = bins - 1; // edge case for max value
      if (binIndex >= 0 && binIndex < bins) {
        histogram[binIndex].count += 1;
      }
    });
    
    return histogram;
  };

  const getHeatmapCells = () => {
    if (!stats || !stats.correlation) return { keys: [], cells: [] };
    const keys = Object.keys(stats.correlation);
    const cells = [];
    keys.forEach((keyY, y) => {
      keys.forEach((keyX, x) => {
        cells.push({ x, y, value: stats.correlation[keyY][keyX] });
      });
    });
    return { keys, cells };
  };

  const { keys: corrKeys, cells: corrCells } = useMemo(() => getHeatmapCells(), [stats]);

  return (
    <div className={`workflow-section glass-panel ${isLocked ? 'locked' : ''}`}>
      {isLocked && (
        <div className="lock-overlay">
          <Lock size={32} />
          <p>Complete Dataset Ingestion First</p>
        </div>
      )}
      
      <div style={{ padding: '32px' }}>
        <h2 style={{ color: 'var(--primary-fixed-dim)', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>
          STEP 02: EXPLORATORY DATA ANALYSIS
        </h2>

        {!stats ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <button className="btn btn-primary" onClick={fetchEDA} disabled={loading}>
              <BarChart2 size={18} />
              {loading ? 'ANALYZING...' : 'GENERATE ANALYSIS'}
            </button>
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--outline-variant)', marginBottom: '24px' }}>
              {['univariate', 'bivariate', 'multivariate'].map(tab => (
                <div 
                  key={tab}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    color: activeTab === tab ? 'var(--primary-fixed-dim)' : 'var(--on-surface-variant)',
                    borderBottom: activeTab === tab ? '2px solid var(--primary-fixed-dim)' : '2px solid transparent',
                    fontFamily: 'var(--font-code)',
                    textTransform: 'uppercase'
                  }}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Content */}
            <div style={{ minHeight: '400px', width: '100%' }}>
              
              {activeTab === 'univariate' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--on-surface-variant)', marginBottom: '8px', fontSize: '12px' }}>FEATURE</label>
                      <select className="input-field" value={uniFeature} onChange={e => setUniFeature(e.target.value)}>
                        {numericFeatures.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--on-surface-variant)', marginBottom: '8px', fontSize: '12px' }}>CHART TYPE</label>
                      <select className="input-field" value={uniChartType} onChange={e => setUniChartType(e.target.value)}>
                        <option value="Histogram">Histogram</option>
                        <option value="Boxplot">Boxplot</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ height: '350px', width: '100%' }}>
                    {uniChartType === 'Histogram' ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={getHistogramData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#3c494e" vertical={false} />
                          <XAxis dataKey="name" stroke="#bbc9cf" tick={{fontFamily: 'monospace', fontSize: 10}} />
                          <YAxis stroke="#bbc9cf" tick={{fontFamily: 'monospace'}} />
                          <Tooltip contentStyle={{ backgroundColor: '#131313', border: '1px solid #4cd6ff' }} />
                          <Bar dataKey="count" fill="#4cd6ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex-center" style={{ height: '100%', color: 'var(--primary-fixed)' }}>
                        <div style={{ width: '100px', height: '200px', border: '2px solid #4cd6ff', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '50%', width: '100%', borderTop: '2px solid #2ff801' }}></div>
                          <div style={{ position: 'absolute', top: '-20px', width: '2px', height: '20px', background: '#4cd6ff', left: '50%' }}></div>
                          <div style={{ position: 'absolute', bottom: '-20px', width: '2px', height: '20px', background: '#4cd6ff', left: '50%' }}></div>
                          <div style={{ position: 'absolute', top: '-20px', width: '20px', height: '2px', background: '#4cd6ff', left: '40%' }}></div>
                          <div style={{ position: 'absolute', bottom: '-20px', width: '20px', height: '2px', background: '#4cd6ff', left: '40%' }}></div>
                        </div>
                        <p style={{marginLeft: '20px', fontFamily: 'var(--font-code)'}}>Boxplot Representation</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'bivariate' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--on-surface-variant)', marginBottom: '8px', fontSize: '12px' }}>FEATURE X</label>
                      <select className="input-field" value={biFeatureX} onChange={e => setBiFeatureX(e.target.value)}>
                        {numericFeatures.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--on-surface-variant)', marginBottom: '8px', fontSize: '12px' }}>FEATURE Y</label>
                      <select className="input-field" value={biFeatureY} onChange={e => setBiFeatureY(e.target.value)}>
                        {numericFeatures.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <button 
                      className="btn btn-outline" 
                      onClick={fetchEDA} 
                      disabled={loading}
                      style={{ height: '45px', padding: '0 16px' }}
                    >
                      {loading ? 'LOADING...' : 'UPDATE PLOT'}
                    </button>
                  </div>

                  <div style={{ height: '350px', width: '100%' }}>
                    {loading ? <p>Loading plot...</p> : (
                      <ResponsiveContainer width="100%" height={350}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#3c494e" />
                          <XAxis type="number" dataKey={biFeatureX} name={biFeatureX} stroke="#bbc9cf" tick={{fontFamily: 'monospace'}} domain={['auto', 'auto']} />
                          <YAxis type="number" dataKey={biFeatureY} name={biFeatureY} stroke="#bbc9cf" tick={{fontFamily: 'monospace'}} domain={['auto', 'auto']} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#131313', border: '1px solid #2ff801' }} />
                          <Scatter name="A data" data={stats.scatter_data || []} fill="#2ff801" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'multivariate' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h4 style={{ marginBottom: '16px', fontFamily: 'var(--font-code)' }}>Correlation Heatmap</h4>
                  <div style={{ overflow: 'auto', maxHeight: '400px' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: `100px repeat(${corrKeys.length}, 40px)`,
                      gap: '2px', fontSize: '10px', fontFamily: 'var(--font-code)' 
                    }}>
                      {/* Header Row */}
                      <div></div>
                      {corrKeys.map(k => (
                        <div key={k} style={{ transform: 'rotate(-45deg)', transformOrigin: 'left bottom', whiteSpace: 'nowrap', height: '60px', display: 'flex', alignItems: 'flex-end' }}>
                          {k.substring(0, 10)}
                        </div>
                      ))}
                      
                      {/* Data Rows */}
                      {corrKeys.map((keyY, y) => (
                        <React.Fragment key={keyY}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {keyY.substring(0, 12)}
                          </div>
                          {corrKeys.map((keyX, x) => {
                            const val = stats.correlation[keyY] ? stats.correlation[keyY][keyX] : 0;
                            const isNaN = typeof val !== 'number';
                            // color scale from red(-1) to black(0) to cyan(1)
                            const bg = isNaN ? '#222' : val > 0 ? `rgba(0, 209, 255, ${val})` : `rgba(255, 50, 50, ${Math.abs(val)})`;
                            return (
                              <div key={keyX} title={`${keyY} vs ${keyX}: ${val}`} style={{
                                background: bg,
                                height: '40px', width: '40px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: Math.abs(val) > 0.5 ? '#000' : '#fff',
                                borderRadius: '4px', cursor: 'crosshair', transition: 'transform 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                {!isNaN ? val.toFixed(1) : '-'}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Proceed Button */}
            <div className="continue-btn-container">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const el = document.getElementById('step-3');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                PROCEED TO FEATURE SELECTION &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EDA;
