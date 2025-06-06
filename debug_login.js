// Test de débogage pour la redirection après login
// À exécuter dans la console du navigateur après tentative de connexion

function debugLoginRedirection() {
  console.log("=== DEBUGGING LOGIN REDIRECTION ===");
  
  // Vérifier les cookies
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
  console.log("1. Token Cookie:", tokenCookie || "NOT FOUND");
  
  // Vérifier le localStorage
  console.log("2. LocalStorage token:", localStorage.getItem('token') || "NOT FOUND");
  
  // Vérifier l'URL actuelle
  console.log("3. Current URL:", window.location.href);
  console.log("4. Current Path:", window.location.pathname);
  
  // Vérifier le store Pinia (si accessible)
  try {
    const app = document.querySelector('#app').__vue_app__;
    if (app) {
      console.log("5. Vue app found, checking stores...");
      // Note: L'accès direct au store peut varier selon la version de Pinia
    }
  } catch (e) {
    console.log("5. Cannot access Vue app:", e.message);
  }
  
  // Test de redirection manuelle
  console.log("6. Testing manual navigation...");
  console.log("   Try: window.location.href = '/'");
  console.log("   Or: history.pushState({}, '', '/')");
  
  console.log("=== END DEBUG ===");
}

// Auto-exécution
debugLoginRedirection();

// Fonction pour forcer la redirection
function forceRedirect() {
  console.log("Forcing redirect to dashboard...");
  window.location.href = window.location.origin + '/';
}

// Instructions
console.log("Instructions:");
console.log("1. Essayez de vous connecter");
console.log("2. Si ça ne redirige pas, tapez: forceRedirect()");
console.log("3. Ou rechargez la page: window.location.reload()");
