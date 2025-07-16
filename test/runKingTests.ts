// Script de test simple pour vérifier la protection du roi

import { runKingProtectionTests } from '../test/kingProtection';

// Fonction principale pour exécuter les tests
async function main() {
  console.log('🚀 Lancement des tests de protection du roi...\n');
  
  try {
    const allTestsPassed = runKingProtectionTests();
    
    if (allTestsPassed) {
      console.log('\n✅ SUCCÈS: Tous les systèmes de protection fonctionnent !');
      console.log('🛡️  Le roi est maintenant totalement protégé.');
      process.exit(0);
    } else {
      console.log('\n❌ ÉCHEC: Certains tests ont échoué.');
      console.log('🔧 Des corrections sont nécessaires.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 ERREUR lors de l\'exécution des tests:');
    console.error(error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export { main };
