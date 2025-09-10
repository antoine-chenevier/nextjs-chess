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
          background: 
            radial-gradient(circle at 20% 80%, rgba(26, 26, 46, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(22, 33, 62, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%);
          background-attachment: fixed;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
          overflow-x: hidden;
        }
        
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-conic-gradient(
              from 0deg at 0% 0%,
              transparent 0deg 60deg,
              rgba(255, 215, 0, 0.03) 60deg 120deg
            ),
            repeating-conic-gradient(
              from 30deg at 100% 100%,
              transparent 0deg 60deg,
              rgba(255, 255, 255, 0.01) 60deg 120deg
            );
          background-size: 100px 100px, 80px 80px;
          background-position: 0 0, 50px 50px;
          z-index: 0;
          animation: chessPatternFloat 20s ease-in-out infinite;
        }
        
        @keyframes chessPatternFloat {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.5;
          }
          33% { 
            transform: translate(10px, -5px) rotate(0.5deg);
            opacity: 0.3;
          }
          66% { 
            transform: translate(-5px, 10px) rotate(-0.3deg);
            opacity: 0.7;
          }
        }
        
        .page-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        
        .page-header {
          width: 100%;
          text-align: center;
          margin-bottom: 30px;
          padding: 50px 40px;
          background: 
            linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.9) 50%, rgba(15, 52, 96, 0.95) 100%),
            radial-gradient(ellipse at top, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
          color: #ffffff;
          border-radius: 25px;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 215, 0, 0.2);
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
              rgba(255, 215, 0, 0.03) 45deg 90deg
            );
          background-size: 60px 60px;
          z-index: 1;
          animation: chessboardPattern 30s linear infinite;
        }
        
        @keyframes chessboardPattern {
          0% { 
            transform: translate(0, 0);
            opacity: 0.3;
          }
          50% { 
            transform: translate(30px, 30px);
            opacity: 0.1;
          }
          100% { 
            transform: translate(0, 0);
            opacity: 0.3;
          }
        }
        
        .page-header::after {
          content: '♔ ♕ ♖ ♗ ♘ ♙ ♚ ♛ ♜ ♝ ♞ ♟';
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1.4rem;
          opacity: 0.2;
          letter-spacing: 12px;
          z-index: 1;
          animation: pieceFloat 8s ease-in-out infinite;
          background: linear-gradient(45deg, #ffd700, #ffed4e, #ffd700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        @keyframes pieceFloat {
          0%, 100% { 
            transform: translateX(-50%) translateY(0);
            opacity: 0.2;
          }
          50% { 
            transform: translateX(-50%) translateY(-3px);
            opacity: 0.4;
          }
        }
        
        .page-header > * {
          position: relative;
          z-index: 2;
        }
        
        .page-header h1 {
          margin: 0 0 25px 0;
          font-size: 3.5rem;
          font-weight: 800;
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          text-shadow: 
            2px 2px 4px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(255, 215, 0, 0.3);
          letter-spacing: 2px;
          background: linear-gradient(145deg, #ffd700 0%, #ffed4e 25%, #ffd700 50%, #ffb000 75%, #ffd700 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% 200%;
          animation: shimmer 3s ease-in-out infinite;
          position: relative;
          z-index: 2;
        }
        
        @keyframes shimmer {
          0%, 100% { 
            background-position: 0% 50%;
          }
          50% { 
            background-position: 100% 50%;
          }
        }
        
        .page-description {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 400;
          line-height: 1.7;
          max-width: 900px;
          margin: 0 auto;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
          position: relative;
          z-index: 2;
          color: rgba(255, 255, 255, 0.95);
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
          background: 
            linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.9) 100%);
          padding: 45px;
          border-radius: 20px;
          box-shadow: 
            0 20px 40px -15px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 215, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 215, 0, 0.15);
          margin-top: 20px;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
        
        .rules-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-linear-gradient(
              45deg,
              transparent 0px,
              rgba(255, 215, 0, 0.02) 1px,
              transparent 2px,
              transparent 50px
            );
          z-index: 1;
        }
        
        .rules-section > * {
          position: relative;
          z-index: 2;
        }
        
        .rules-section h2 {
          margin: 0 0 30px 0;
          color: #1a1a2e;
          font-size: 2rem;
          font-weight: 700;
          border-bottom: 3px solid transparent;
          border-image: linear-gradient(90deg, #1a1a2e 0%, #ffd700 50%, #1a1a2e 100%) 1;
          padding-bottom: 15px;
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          text-align: center;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .rules-content section {
          margin-bottom: 35px;
          background: 
            linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%);
          padding: 25px;
          border-radius: 15px;
          border-left: 5px solid transparent;
          border-image: linear-gradient(180deg, #1a1a2e 0%, #ffd700 50%, #1a1a2e 100%) 1;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 4px 15px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          position: relative;
          overflow: hidden;
        }
        
        .rules-content section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at top right, rgba(255, 215, 0, 0.05) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .rules-content section:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 215, 0, 0.2);
          border-image: linear-gradient(180deg, #ffd700 0%, #1a1a2e 50%, #ffd700 100%) 1;
        }
        
        .rules-content section:hover::before {
          opacity: 1;
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
