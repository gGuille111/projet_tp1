// Récupère le token JWT stocké à la connexion
const token = localStorage.getItem("token");

// Pas de token : l'utilisateur n'est pas connecté, retour à l'accueil
if (!token) {
 window.location.href = "index.html";
}

// Liste des comptes reçue du serveur
let comptes = [];

// Envoie une requête authentifiée au serveur et renvoie { ok, donnees }
async function appeler(url, methode, corps) {
 const reponse = await fetch(url, {
  method: methode,
  headers: {
   "Content-Type": "application/json",
   Authorization: "Bearer " + token
  },
  body: corps ? JSON.stringify(corps) : undefined
 });

 // Token expiré ou invalide : on efface la session
 if (reponse.status === 401) {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("admin");
  window.location.href = "index.html";
 }
 // Connecté mais pas administrateur : retour à l'accueil
 if (reponse.status === 403) {
  window.location.href = "index.html";
 }

 const donnees = await reponse.json();
 return { ok: reponse.ok, donnees: donnees };
}

// Récupère les comptes et remplit le menu déroulant (aSelectionner = login à garder sélectionné)
async function chargerComptes(aSelectionner) {
 const resultat = await appeler("/users", "GET");
 if (!resultat.ok) {
  document.getElementById("messageAdmin").textContent = resultat.donnees.message;
  return;
 }

 comptes = resultat.donnees;
 const liste = document.getElementById("listeUsers");
 liste.innerHTML = "";
 liste.appendChild(new Option("-- Choisir un compte --", ""));

 // new Option() insère le texte tel quel, sans interpréter de HTML
 comptes.forEach((compte) => {
  liste.appendChild(new Option(compte.username + (compte.admin === 1 ? " (admin)" : ""), compte.username));
 });

 liste.value = aSelectionner || "";
 afficherCompte();
}

// Remplit le formulaire avec le compte sélectionné (caché si aucun compte n'est choisi)
function afficherCompte() {
 const login = document.getElementById("listeUsers").value;
 const compte = comptes.find((c) => c.username === login);

 document.getElementById("zoneAdmin").hidden = !compte;
 if (!compte) return;

 document.getElementById("adminLogin").value = compte.username;
 document.getElementById("adminNom").value = compte.nom || "";
 document.getElementById("adminPrenom").value = compte.prenom || "";
 document.getElementById("adminMail").value = compte.mail || "";
 document.getElementById("adminAdmin").checked = compte.admin === 1;
 document.getElementById("adminNouveauMdp").value = "";
}

document.getElementById("listeUsers").addEventListener("change", () => {
 document.getElementById("messageAdmin").textContent = "";
 afficherCompte();
});

// Modification du compte sélectionné
document.getElementById("btnAdminModifier").addEventListener("click", async () => {
 const login = document.getElementById("listeUsers").value;
 const message = document.getElementById("messageAdmin");

 try {
  // encodeURIComponent protège l'URL si le login contient des caractères spéciaux
  const resultat = await appeler("/users/" + encodeURIComponent(login), "PUT", {
   nom: document.getElementById("adminNom").value,
   prenom: document.getElementById("adminPrenom").value,
   mail: document.getElementById("adminMail").value,
   admin: document.getElementById("adminAdmin").checked,
   nouveauPassword: document.getElementById("adminNouveauMdp").value
  });

  // Recharge la liste pour afficher les nouvelles valeurs
  if (resultat.ok) {
   await chargerComptes(login);
  }
  message.textContent = resultat.donnees.message;

 } catch (erreur) {
  message.textContent = "Impossible de contacter le serveur.";
 }
});

// Suppression du compte sélectionné après confirmation
document.getElementById("btnAdminSupprimer").addEventListener("click", async () => {
 const login = document.getElementById("listeUsers").value;
 const message = document.getElementById("messageAdmin");

 if (!confirm("Voulez-vous supprimer " + login + " ?")) return;

 try {
  const resultat = await appeler("/users/" + encodeURIComponent(login), "DELETE");

  if (resultat.ok) {
   await chargerComptes("");
  }
  message.textContent = resultat.donnees.message;

 } catch (erreur) {
  message.textContent = "Impossible de contacter le serveur.";
 }
});

// Lance l'affichage de la liste au chargement de la page
chargerComptes("");