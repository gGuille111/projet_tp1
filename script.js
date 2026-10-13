// Nom de l'utilisateur connecté (null si personne n'est connecté)
let utilisateur = null;

// Affiche une seule page à la fois : retire "active" de toutes, puis l'ajoute à celle demandée
function page(nom) {
 document.querySelectorAll(".page").forEach(function(element) {
  element.classList.remove("active");
 });

 document.getElementById(nom).classList.add("active");
}

// Affiche la page d'accueil (menu) d'un utilisateur connecté
function afficherAccueil(username, admin) {
 utilisateur = username;
 document.getElementById("profilNom").textContent = username;
 // Le lien vers l'administration n'est visible que pour un administrateur
 document.getElementById("lienAdmin").style.display = admin ? "block" : "none";
 page("profil");
}

// Envoie le formulaire d'inscription au serveur
async function inscription() {
 let username = document.getElementById("nom").value;
 let password = document.getElementById("password").value;
 let nomFamille = document.getElementById("nomFamille").value;
 let prenom = document.getElementById("prenom").value;
 let mail = document.getElementById("mail").value;
 let message = document.getElementById("messageInscription");

 // Vérifie que les champs ne sont pas vides avant d'appeler le serveur
 if (username === "" || password === "" || nomFamille === "" || prenom === "" || mail === "") {
  message.textContent = "Remplis tous les champs.";
  return;
 }

 try {
  // Requête POST vers /register avec les données en JSON
  let reponse = await fetch("/register", {
   method: "POST",
   headers: {
    "Content-Type": "application/json"
   },
   body: JSON.stringify({
    login: username,
    password: password,
    nom: nomFamille,
    prenom: prenom,
    mail: mail
   })
  });

  let resultat = await reponse.json();

  // Affiche la réponse du serveur (succès ou erreur)
  message.textContent = resultat.message;

  // Si tout s'est bien passé, on vide le formulaire et on passe à la connexion
  if (reponse.ok) {
   document.getElementById("nom").value = "";
   document.getElementById("password").value = "";
   document.getElementById("nomFamille").value = "";
   document.getElementById("prenom").value = "";
   document.getElementById("mail").value = "";

   page("connexion");
  }

 } catch (erreur) {
  // Le serveur ne répond pas (arrêté, réseau coupé...)
  message.textContent = "Impossible de contacter le serveur.";
 }
}

// Envoie les identifiants au serveur et gère la réponse
async function connexion() {
 let username = document.getElementById("nomConnexion").value;
 let password = document.getElementById("passwordConnexion").value;

 if (username === "" || password === "") {
  document.getElementById("messageConnexion").textContent =
   "Remplis tous les champs.";
  return;
 }

 try {
  let reponse = await fetch("/login", {
   method: "POST",
   headers: {
    "Content-Type": "application/json"
   },
   body: JSON.stringify({
    login: username,
    password: password
   })
  });

  let resultat = await reponse.json();

  // Échec : on affiche le message d'erreur du serveur
  if (!reponse.ok || resultat.message !== "Connexion réussie") {
   document.getElementById("messageConnexion").textContent =
    resultat.message || "Connexion impossible.";
   return;
  }

  // Garde la session : le token sert aux requêtes protégées, le nom et le statut admin aux autres pages
  localStorage.setItem("token", resultat.token);
  localStorage.setItem("username", resultat.username);
  localStorage.setItem("admin", resultat.admin === true ? "true" : "false");

  // Tout le monde arrive sur la page d'accueil, l'admin y voit un lien en plus
  afficherAccueil(resultat.username, resultat.admin === true);

 } catch (erreur) {
  document.getElementById("messageConnexion").textContent =
   "Impossible de contacter le serveur.";
 }
}

// Déconnexion : on efface la session (token compris) et on revient à l'accueil
function deconnexion() {
 localStorage.removeItem("token");
 localStorage.removeItem("username");
 localStorage.removeItem("admin");
 utilisateur = null;
 page("accueil");
}

// Au chargement : si une session existe déjà (retour depuis compte.html par exemple), on affiche le menu
document.addEventListener("DOMContentLoaded", function() {
 if (localStorage.getItem("token")) {
  afficherAccueil(
   localStorage.getItem("username"),
   localStorage.getItem("admin") === "true"
  );
 }
});