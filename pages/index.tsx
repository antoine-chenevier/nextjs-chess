import React from 'react';
import Head from 'next/head';
import SecretKingBootGame from '../src/secretKingBoot/SecretKingBootGame';

export default function SecretKingBootPage() {
  const handleGameEnd = (winner: 'white' | 'black' | 'draw') => {
    console.log(`Partie terminée. Gagnant: ${winner}`);
    // Ici vous pouvez ajouter la logique de fin de partie
    // Par exemple: sauvegarder le résultat, afficher un modal, etc.
  };

  return (
    <>
      <Head>
        <title>La Botte Secrète du Roi - Variante d'échecs</title>
        <meta 
          name="description" 
          content="Jouez à 'La Botte Secrète du Roi', une variante fascinante d'échecs où vous construisez votre armée pendant la partie !" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <main>
        <div className="page-container">
          <header className="page-header">
            <h1>La Botte Secrète du Roi</h1>
            <p className="page-description">
              Une variante d'échecs révolutionnaire !
              Maîtrisez l'art du placement tactique et de la gestion des ressources dans cette expérience d'échecs totalement unique.
            </p>
          </header>
          
          <div className="game-section">
            <SecretKingBootGame 
              onGameEnd={handleGameEnd}
              enableAI={false}
              aiLevel="medium"
            />
          </div>
          
          <aside className="rules-section">
            <h2>Règles du jeu</h2>
            
            <div className="rules-content">
              <section>
                <h3>🏁 Mise en place</h3>
                <ul>
                  <li>Placez votre roi sur D1 ou E1 (blanc) / D8 ou E8 (noir)</li>
                  <li><strong>Réserve initiale</strong> : 4 pions, 1 cavalier, 1 fou, 1 tour</li>
                  <li>Le but reste l'échec et mat du roi adverse</li>
                </ul>
              </section>
              
              <section>
                <h3>⚡ Actions possibles (1 coup chacune)</h3>
                <ul>
                  <li><strong>Générer un pion</strong> : Ajouter un pion à votre réserve (max 8)</li>
                  <li><strong>Placer une pièce</strong> : De la réserve vers l'échiquier</li>
                  <li><strong>Déplacer une pièce</strong> : Selon les règles classiques</li>
                  <li><strong>Roi spécial</strong> : Déplacer le roi ET placer une pièce sur sa case de départ</li>
                  <li><strong>Échanger</strong> : 2 pions → cavalier, 3 → fou, 4 → tour</li>
                </ul>
              </section>
              
              <section>
                <h3>♟️ Règles des pions</h3>
                <ul>
                  <li>Placement : rangs 1-4 (blanc) ou 5-8 (noir)</li>
                  <li>Premier mouvement : plusieurs cases possibles</li>
                  <li>Ensuite : 1 case à la fois</li>
                  <li>Promotion classique sur la dernière rangée</li>
                </ul>
              </section>
              
              <section>
                <h3>🎯 Stratégie</h3>
                <ul>
                  <li>Équilibrez développement et économie de pions</li>
                  <li>Le placement du roi influence toute la partie</li>
                  <li>Gérez votre réserve comme une ressource précieuse</li>
                  <li>Timing crucial pour les échanges de pièces</li>
                </ul>
              </section>
            </div>
          </aside>
        </div>
      </main>
      
      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
        }
        
        .page-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          align-items: center;
        }
        
        .page-header {
          width: 100%;
          text-align: center;
          margin-bottom: 30px;
          padding: 40px 30px;
          background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: #ffffff;
          border-radius: 20px;
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }
        
        .page-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-conic-gradient(
              from 0deg at 0% 0%,
              transparent 0deg 45deg,
              rgba(255,255,255,0.02) 45deg 90deg
            );
          background-size: 40px 40px;
          z-index: 1;
        }
        
        .page-header::after {
          content: '♔ ♕ ♖ ♗ ♘ ♙';
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1.2rem;
          opacity: 0.15;
          letter-spacing: 10px;
          z-index: 1;
        }
        
        .page-header > * {
          position: relative;
          z-index: 2;
        }
        
        .page-header h1 {
          margin: 0 0 20px 0;
          font-size: 3rem;
          font-weight: 700;
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          letter-spacing: 1px;
          background: linear-gradient(145deg, #ffffff, #e8e8e8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .page-description {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 300;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .page-description strong {
          font-weight: 600;
          color: #ffd700;
        }
        
        .game-section {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        
        .rules-section {
          width: 100%;
          max-width: 1200px;
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          padding: 40px;
          border-radius: 15px;
          box-shadow: 
            0 15px 35px rgba(0,0,0,0.1),
            0 5px 15px rgba(0,0,0,0.05);
          border: 1px solid rgba(255,255,255,0.2);
          margin-top: 20px;
        }
        
        .rules-section h2 {
          margin: 0 0 25px 0;
          color: #1a1a2e;
          font-size: 1.8rem;
          font-weight: 600;
          border-bottom: 3px solid #16213e;
          padding-bottom: 12px;
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          text-align: center;
        }
        
        .rules-content section {
          margin-bottom: 30px;
          background: rgba(255,255,255,0.7);
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid #16213e;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .rules-content section:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .rules-content h3 {
          margin: 0 0 15px 0;
          color: #1a1a2e;
          font-size: 1.2rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .rules-content ul {
          margin: 0;
          padding-left: 25px;
          line-height: 1.7;
        }
        
        .rules-content li {
          margin-bottom: 8px;
          color: #555;
          position: relative;
        }
        
        .rules-content li::marker {
          color: #16213e;
          font-weight: bold;
        }
        
        .rules-content strong {
          color: #1a1a2e;
          font-weight: 600;
        }
        
        @media (max-width: 1200px) {
          .page-container {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          
          .rules-section {
            grid-column: 1;
            position: static;
          }
        }
        
        @media (max-width: 768px) {
          .page-container {
            padding: 15px;
          }
          
          .page-header {
            padding: 30px 20px;
            border-radius: 15px;
          }
          
          .page-header h1 {
            font-size: 2.2rem;
            margin-bottom: 15px;
          }
          
          .page-description {
            font-size: 1.1rem;
          }
          
          .page-header::after {
            font-size: 1rem;
            letter-spacing: 6px;
          }
          
          .rules-section {
            padding: 25px 20px;
          }
          
          .rules-section h2 {
            font-size: 1.5rem;
          }
          
          .rules-content section {
            padding: 15px;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </>
  );
}
