// Récupère le token JWT et le nom d'utilisateur stockés à la connexion
const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

// Pas de token : l'utilisateur n'est pas connecté, retour à l'accueil
if (!token) {
 window.location.href = "index.html";
}

document.getElementById("username").textContent = "Bienvenue " + username;

// Mot de passe vérifié à l'étape 1, renvoyé au serveur pour chaque action sensible
let motDePasse = "";

// Envoie une requête authentifiée au serveur et renvoie { ok, donnees }
async function appeler(url, methode, corps) {
 const reponse = await fetch(url, {
  method: methode,
  headers: {
   "Content-Type": "application/json",
   Authorization: "Bearer " + token
  },
  body: JSON.stringify(corps)
 });

 // Token expiré ou invalide : on efface la session et on retourne à l'accueil
 if (reponse.status === 401) {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("admin");
  window.location.href = "index.html";
 }

 const donnees = await reponse.json();
 return { ok: reponse.ok, donnees: donnees };
}

// Étape 1 : le serveur vérifie le mot de passe, puis on affiche le formulaire rempli
document.getElementById("btnVerifier").addEventListener("click", async () => {
 const message = document.getElementById("messageVerif");
 const saisie = document.getElementById("verifierMdp").value;

 try {
  const resultat = await appeler("/compte/infos", "POST", { password: saisie });

  if (!resultat.ok) {
   message.textContent = resultat.donnees.message;
   return;
  }

  motDePasse = saisie;

  // Le login est affiché mais non modifiable (champ désactivé dans le HTML)
  document.getElementById("champLogin").value = resultat.donnees.username;
  document.getElementById("champNom").value = resultat.donnees.nom || "";
  document.getElementById("champPrenom").value = resultat.donnees.prenom || "";
  document.getElementById("champMail").value = resultat.donnees.mail || "";

  document.getElementById("zoneVerif").hidden = true;
  document.getElementById("zoneInfos").hidden = false;

 } catch (erreur) {
  message.textContent = "Impossible de contacter le serveur.";
 }
});

// Étape 2 : enregistre les modifications (nom, prénom, mail, nouveau mot de passe éventuel)
document.getElementById("btnModifier").addEventListener("click", async () => {
 const message = document.getElementById("messageModif");
 const nouveau = document.getElementById("champNouveauMdp").value;

 try {
  const resultat = await appeler("/compte", "PUT", {
   password: motDePasse,
   nom: document.getElementById("champNom").value,
   prenom: document.getElementById("champPrenom").value,
   mail: document.getElementById("champMail").value,
   nouveauPassword: nouveau
  });

  message.textContent = resultat.donnees.message;

  // Si le mot de passe a changé, le nouveau devient celui à renvoyer au serveur
  if (resultat.ok && nouveau !== "") {
   motDePasse = nouveau;
   document.getElementById("champNouveauMdp").value = "";
  }

 } catch (erreur) {
  message.textContent = "Impossible de contacter le serveur.";
 }
});

// Suppression du compte : confirmation, puis le serveur revérifie le mot de passe
document.getElementById("deleteAccount").addEventListener("click", async () => {
 if (!confirm("Voulez-vous vraiment supprimer votre compte ?")) return;

 try {
  const resultat = await appeler("/delete-account", "DELETE", { password: motDePasse });

  if (resultat.ok) {
   localStorage.removeItem("token");
   localStorage.removeItem("username");
   localStorage.removeItem("admin");
   window.location.href = "index.html";
  } else {
   alert(resultat.donnees.message || "Impossible de supprimer le compte");
  }

 } catch (erreur) {
  alert("Impossible de contacter le serveur.");
 }
});