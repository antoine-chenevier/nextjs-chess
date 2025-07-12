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
      </Head>
      
      <main>
        <div className="page-container">
          <header className="page-header">
            <h1>La Botte Secrète du Roi</h1>
            <p className="page-description">
              Une variante d'échecs révolutionnaire où la stratégie commence avant même le premier coup !
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
                  <li>Toutes les autres pièces sont en réserve</li>
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
        .page-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 40px;
          align-items: start;
        }
        
        .page-header {
          grid-column: 1 / -1;
          text-align: center;
          margin-bottom: 30px;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .page-header h1 {
          margin: 0 0 15px 0;
          font-size: 2.5rem;
          font-weight: 700;
        }
        
        .page-description {
          margin: 0;
          font-size: 1.2rem;
          opacity: 0.9;
        }
        
        .game-section {
          grid-column: 1;
        }
        
        .rules-section {
          grid-column: 2;
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          height: fit-content;
          position: sticky;
          top: 20px;
        }
        
        .rules-section h2 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.5rem;
          border-bottom: 3px solid #667eea;
          padding-bottom: 10px;
        }
        
        .rules-content section {
          margin-bottom: 25px;
        }
        
        .rules-content h3 {
          margin: 0 0 10px 0;
          color: #555;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .rules-content ul {
          margin: 0;
          padding-left: 20px;
          line-height: 1.6;
        }
        
        .rules-content li {
          margin-bottom: 5px;
          color: #666;
        }
        
        .rules-content strong {
          color: #333;
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
            padding: 20px;
          }
          
          .page-header h1 {
            font-size: 2rem;
          }
          
          .page-description {
            font-size: 1rem;
          }
          
          .rules-section {
            padding: 20px;
          }
        }
      `}</style>
    </>
  );
}
