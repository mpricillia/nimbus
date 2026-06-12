import React from 'react';
import { Users, Code, Cpu } from 'lucide-react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page-container flex-center" style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <div className="text-center" style={{ marginBottom: '48px' }}>
          <h1 className="section-title text-glow" style={{ fontSize: '3rem', margin: 0 }}>THE DEVELOPERS</h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--on-surface-variant)', marginTop: '16px', fontSize: '1.1rem', textAlign: 'center' }}>
            The brilliant minds behind the Nimbus.ai
          </p>
        </div>

        <div className="developers-grid">
          
          <div className="developer-card glass-panel text-center">
            <div className="dev-icon-wrapper">
              <Code size={32} />
            </div>
            <h3 className="dev-name">Michelle Pricillia Sutanto</h3>
            <p className="dev-id">2802424080</p>
          </div>

          <div className="developer-card glass-panel text-center">
            <div className="dev-icon-wrapper">
              <Cpu size={32} />
            </div>
            <h3 className="dev-name">Wisely Janson Halim</h3>
            <p className="dev-id">2802467382</p>
          </div>

          <div className="developer-card glass-panel text-center">
            <div className="dev-icon-wrapper">
              <Users size={32} />
            </div>
            <h3 className="dev-name">Yosuke Yung</h3>
            <p className="dev-id">2802428066</p>
          </div>

        </div>

      </div>

      <style>{`
        .developers-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .developer-card {
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid var(--outline-variant);
        }

        .developer-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(80, 111, 131, 0.15);
          border-color: var(--primary);
        }

        .dev-icon-wrapper {
          width: 64px;
          height: 64px;
          background: var(--hero-gradient);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(250, 192, 114, 0.3);
        }

        .dev-name {
          font-family: var(--font-display);
          font-size: 1.5rem;
          color: var(--on-surface);
          margin-bottom: 8px;
          text-align: center;
        }

        .dev-id {
          font-family: var(--font-code);
          font-size: 1rem;
          color: var(--primary);
          background: rgba(80, 111, 131, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
        }
        
        @media (min-width: 768px) {
          .developers-grid {
            flex-direction: row;
            justify-content: center;
          }
          .developer-card {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
