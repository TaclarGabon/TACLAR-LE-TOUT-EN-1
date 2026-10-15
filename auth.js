/* Firebase configuration identifies the public Web app, not a server credential. */
const firebaseConfig = {
  apiKey: "AIzaSyDW8KoQvMIqpAhk3LU3mz-WRp-FWkeq0pM",
  authDomain: "taclar-le-tout-en-1.firebaseapp.com",
  projectId: "taclar-le-tout-en-1",
  storageBucket: "taclar-le-tout-en-1.firebasestorage.app",
  messagingSenderId: "1050439713834",
  appId: "1:1050439713834:web:1e52e255b47f961ec52f53"
};
(function(){
  const status=document.getElementById("authMessage");
  if(typeof firebase==="undefined"){status.textContent="Connexion indisponible : impossible de charger Firebase.";return}
  try{firebase.initializeApp(firebaseConfig)}catch(err){status.textContent="Erreur d'initialisation Firebase.";return}
  const auth=firebase.auth();
  const logoutButton=document.getElementById("logoutButton");
  const loginEntry=document.getElementById("loginEntry");
  logoutButton.addEventListener("click",async()=>{
    logoutButton.disabled=true;
    try {
      await auth.signOut();
      window.taclarPendingPage=null;
      document.getElementById("authPassword").value="";
      status.textContent="";
      chosenRole="parent";go("welcome");
    } catch(error) {
      status.textContent="Déconnexion impossible. Réessaie.";
      go("login");
    } finally { logoutButton.disabled=false; }
  });
  const adminId="bX1ogVwQfHUy5Qy2r1toKF5z3Hl1";
  let chosenRole="parent";
  document.querySelectorAll("[data-role]").forEach(btn=>btn.addEventListener("click",()=>{
    chosenRole=btn.dataset.role;
    const user=auth.currentUser;
    if(chosenRole==="admin"){
      if(user&&user.uid===adminId){window.location.assign("./administration.html");return;}
      window.taclarPendingPage="rolechoice";go("login");status.textContent="Connecte-toi avec ton compte administrateur.";return;
    }
    const student=chosenRole==="student";
    document.getElementById("roleTitle").textContent=student?"Espace Élève":"Espace Parent";
    document.getElementById("roleHeading").textContent=student?"Mon espace Élève":"Mon espace Parent";
    document.getElementById("roleDescription").textContent="Mon planning et mon transport scolaire";
    document.getElementById("roleNote").textContent=student?"La connexion Élève sera activée pour les comptes élèves autorisés.":"Seul le dossier associé au compte connecté est visible.";
    document.getElementById("rolePlanning").classList.toggle("hidden",!user||student);
    document.getElementById("roleTransport").classList.toggle("hidden",!user||student);
    document.getElementById("roleLogin").classList.toggle("hidden",!!user&&!student);
    go("rolechoice");
  }));
  auth.onAuthStateChanged(user=>{
    logoutButton.classList.toggle("hidden",!user);
    loginEntry.classList.toggle("hidden",!!user);
    window.taclarAuthUser=user||null;
    if(!user&&(document.getElementById("planning")&&!document.getElementById("planning").classList.contains("hidden")||document.getElementById("transport")&&!document.getElementById("transport").classList.contains("hidden"))){go("login")}
    if(user&&window.taclarPendingPage){const destination=window.taclarPendingPage;window.taclarPendingPage=null;if(chosenRole==="admin"&&user.uid===adminId){window.location.assign("./administration.html");return;}go(destination)}
  });
  document.getElementById("loginForm").addEventListener("submit",async e=>{
    e.preventDefault();status.textContent="Connexion en cours…";
    const btn=document.getElementById("loginSubmit");btn.disabled=true;
    try{
      await auth.signInWithEmailAndPassword(document.getElementById("authEmail").value.trim(),document.getElementById("authPassword").value);
      document.getElementById("authPassword").value="";
      status.textContent="";
      const destination=window.taclarPendingPage||"rolechoice";window.taclarPendingPage=null;if(chosenRole==="admin"&&auth.currentUser?.uid===adminId){window.location.assign("./administration.html");return;}go(destination);
    }catch(err){
      status.textContent=(err.code==="auth/unauthorized-domain")?"Ce domaine doit être autorisé dans Firebase Authentication → Paramètres → Domaines autorisés.":"Connexion impossible. Vérifie ton adresse e-mail et ton mot de passe.";
    }finally{btn.disabled=false}
  });
})();
