const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
// Clé secrète pour signer les tokens JWT (lue dans le .env)
const SECRET = process.env.JWT_SECRET || 'secret_de_test';

// Connexion active à la base, remplie par Connexion()
let connection;

// Connexion(serveur, user, passwd, bdd, retour)
// Appelle retour(true) si la connexion est OK, sinon retour(message d'erreur explicite)
// (Node est asynchrone : le résultat passe par la fonction "retour" et non par un return)
function Connexion(serveur, user, passwd, bdd, retour) {
 const essai = mysql.createConnection({
  host: serveur,
  user: user,
  password: passwd,
  database: bdd
 });
 essai.connect((err) => {
  if (err) {
   return retour('Connexion à la base "' + bdd + '" impossible : ' + err.message);
  }
  connection = essai;
  retour(true);
 });
}

// Vrai si la valeur est une chaîne de caractères non vide
function estTexte(valeur) {
 return typeof valeur === 'string' && valeur.trim() !== '';
}

// Vérifie nom, prénom et mail (tailles de la table : 40 caractères)
// Retourne un message d'erreur, ou null si tout est correct
function validerChamps(d) {
 if (!estTexte(d.nom) || !estTexte(d.prenom) || !estTexte(d.mail)) {
  return 'Nom, prénom et mail sont obligatoires';
 }
 if (d.nom.length > 40 || d.prenom.length > 40 || d.mail.length > 40) {
  return 'Nom, prénom et mail : 40 caractères maximum';
 }
 if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.mail)) {
  return 'Adresse mail invalide';
 }
 return null;
}

// Autorisation(login, passwd, retour)
// Appelle retour(true, utilisateur) si le login existe et que le mot de passe correspond, sinon retour(false)
// Le mot de passe est comparé au hash bcrypt stocké en base (jamais de mot de passe en clair)
function Autorisation(login, passwd, retour) {
 if (!estTexte(login) || typeof passwd !== 'string' || passwd === '') {
  return retour(false);
 }
 // Requête préparée (?) pour éviter les injections SQL
 connection.query('SELECT * FROM users WHERE username = ?', [login], (err, results) => {
  if (err) {
   console.error('Erreur lors de la recherche de l\'utilisateur :', err);
   return retour(false);
  }
  if (results.length === 0) {
   return retour(false);
  }
  bcrypt.compare(passwd, results[0].password, (err, ok) => {
   if (err || !ok) {
    return retour(false);
   }
   retour(true, results[0]);
  });
 });
}

// Valide les champs, hashe le nouveau mot de passe s'il y en a un, puis enregistre
// retour(succès, message, code HTTP)
function enregistrerModification(login, donnees, retour) {
 const message = validerChamps(donnees);
 if (message) {
  return retour(false, message, 400);
 }
 const nouveau = donnees.nouveauPassword;
 // Pas de nouveau mot de passe : on garde l'ancien
 if (nouveau === undefined || nouveau === '') {
  return mettreAJour(login, donnees, null, retour);
 }
 if (typeof nouveau !== 'string' || nouveau.length < 8) {
  return retour(false, 'Le mot de passe doit contenir au moins 8 caractères', 400);
 }
 bcrypt.hash(nouveau, 10, (err, hash) => {
  if (err) {
   console.error('Erreur lors du hash du mot de passe :', err);
   return retour(false, 'Erreur serveur', 500);
  }
  mettreAJour(login, donnees, hash, retour);
 });
}

// Construit et exécute la requête UPDATE (le login n'est jamais modifié)
function mettreAJour(login, donnees, hash, retour) {
 let sql = 'UPDATE users SET nom = ?, prenom = ?, mail = ?';
 const valeurs = [donnees.nom.trim(), donnees.prenom.trim(), donnees.mail.trim()];
 if (hash) {
  sql += ', password = ?';
  valeurs.push(hash);
 }
 // Seule la route admin envoie ce champ
 if (typeof donnees.admin === 'boolean') {
  sql += ', admin = ?';
  valeurs.push(donnees.admin ? 1 : 0);
 }
 sql += ' WHERE username = ?';
 valeurs.push(login);

 connection.query(sql, valeurs, (err, result) => {
  if (err) {
   console.error('Erreur lors de la modification :', err);
   return retour(false, 'Erreur serveur', 500);
  }
  if (result.affectedRows === 0) {
   return retour(false, 'Utilisateur introuvable', 404);
  }
  retour(true, 'Compte modifié', 200);
 });
}

// Modification_user(login, passwd, donnees, retour)
// Modifie le compte seulement si le mot de passe actuel est correct
function Modification_user(login, passwd, donnees, retour) {
 Autorisation(login, passwd, (ok) => {
  if (!ok) {
   return retour(false, 'Mot de passe incorrect', 403);
  }
  enregistrerModification(login, donnees, retour);
 });
}

// Suppression_user(login, passwd, retour)
// Supprime le compte seulement si le mot de passe est correct
function Suppression_user(login, passwd, retour) {
 Autorisation(login, passwd, (ok) => {
  if (!ok) {
   return retour(false, 'Mot de passe incorrect', 403);
  }
  connection.query('DELETE FROM users WHERE username = ?', [login], (err) => {
   if (err) {
    console.error('Erreur lors de la suppression :', err);
    return retour(false, 'Erreur serveur', 500);
   }
   retour(true, 'Compte supprimé', 200);
  });
 });
}

// Permet de lire le JSON envoyé par le client
app.use(express.json());

// Accepte "login" comme alias de "username" dans les requêtes
app.use((req, res, next) => {
 if (req.body && req.body.login !== undefined && req.body.username === undefined) {
  req.body.username = req.body.login;
 }
 next();
});

// Sert les fichiers du projet (html, js, css)
app.use(express.static(__dirname));

// Middleware d'authentification : vérifie le token JWT de l'en-tête Authorization
// Si le token est valide, les infos de l'utilisateur sont stockées dans req.user
function auth(req, res, next) {
 const header = req.headers.authorization;
 if (!header) {
  return res.status(401).json({ message: 'Token manquant' });
 }
 // Format attendu : "Bearer <token>"
 const token = header.split(' ')[1];
 jwt.verify(token, SECRET, (err, payload) => {
  if (err) {
   return res.status(401).json({ message: 'Token invalide' });
  }
  req.user = payload;
  next();
 });
}

// Middleware à placer après auth : réserve la route aux administrateurs
function adminSeulement(req, res, next) {
 if (!req.user.admin) {
  return res.status(403).json({ message: 'Accès interdit' });
 }
 next();
}

// Inscription d'un nouvel utilisateur
app.post('/register', (req, res) => {
 const corps = req.body || {};
 if (!estTexte(corps.username) || !estTexte(corps.password)) {
  return res.status(400).json({ message: 'Aucune donnée reçue' });
 }
 if (corps.username.length < 4) {
  return res.status(400).json({ message: 'Le nom d\'utilisateur doit contenir au moins 4 caractères' });
 }
 if (corps.password.length < 8) {
  return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
 }
 const message = validerChamps(corps);
 if (message) {
  return res.status(400).json({ message: message });
 }

 // Hash du mot de passe avec bcrypt
 bcrypt.hash(corps.password, 10, (err, hash) => {
  if (err) {
   console.error('Erreur lors du hash du mot de passe :', err);
   return res.status(500).json({ message: 'Erreur serveur' });
  }
  connection.query(
   'INSERT INTO users (username, password, nom, prenom, mail) VALUES (?, ?, ?, ?, ?)',
   [corps.username, hash, corps.nom.trim(), corps.prenom.trim(), corps.mail.trim()],
   (err) => {
    if (err) {
     // Le nom d'utilisateur existe déjà
     if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Nom d\'utilisateur déjà utilisé' });
     }
     console.error('Erreur lors de l\'inscription :', err);
     return res.status(500).json({ message: 'Erreur serveur' });
    }
    console.log('Inscription réussie pour :', corps.username);
    res.json({ message: 'Inscription réussie' });
   }
  );
 });
});

// Connexion : vérifie les identifiants et renvoie un token JWT
app.post('/login', (req, res) => {
 const corps = req.body || {};
 if (!estTexte(corps.username) || typeof corps.password !== 'string') {
  return res.status(400).json({ message: 'Aucune donnée reçue' });
 }
 Autorisation(corps.username, corps.password, (ok, utilisateur) => {
  if (!ok) {
   return res.status(401).json({ message: 'Identifiants invalides' });
  }
  // Token valable 2h avec le nom et le statut admin
  const token = jwt.sign(
   { username: utilisateur.username, admin: utilisateur.admin === 1 },
   SECRET,
   { expiresIn: '2h' }
  );
  console.log('Connexion réussie pour :', utilisateur.username);
  res.json({
   message: 'Connexion réussie',
   token: token,
   username: utilisateur.username,
   admin: utilisateur.admin === 1
  });
 });
});

// Renvoie les informations du compte, seulement si le mot de passe est correct
// (elles servent à remplir le formulaire de modification)
app.post('/compte/infos', auth, (req, res) => {
 const corps = req.body || {};
 Autorisation(req.user.username, corps.password, (ok, utilisateur) => {
  if (!ok) {
   return res.status(403).json({ message: 'Mot de passe incorrect' });
  }
  res.json({
   username: utilisateur.username,
   nom: utilisateur.nom,
   prenom: utilisateur.prenom,
   mail: utilisateur.mail
  });
 });
});

// Modification de son propre compte (mot de passe actuel obligatoire)
app.put('/compte', auth, (req, res) => {
 const corps = req.body || {};
 // On ne garde que les champs autorisés (pas de champ admin ici)
 const donnees = {
  nom: corps.nom,
  prenom: corps.prenom,
  mail: corps.mail,
  nouveauPassword: corps.nouveauPassword
 };
 Modification_user(req.user.username, corps.password, donnees, (ok, message, code) => {
  res.status(code).json({ message: message });
 });
});

// Suppression de son propre compte (mot de passe obligatoire)
app.delete('/delete-account', auth, (req, res) => {
 const corps = req.body || {};
 Suppression_user(req.user.username, corps.password, (ok, message, code) => {
  res.status(code).json({ message: message });
 });
});

// Liste des utilisateurs (réservée aux administrateurs)
app.get('/users', auth, adminSeulement, (req, res) => {
 connection.query('SELECT username, nom, prenom, mail, admin FROM users', (err, results) => {
  if (err) {
   console.error('Erreur lors de la lecture des utilisateurs :', err);
   return res.status(500).json({ message: 'Erreur serveur' });
  }
  res.json(results);
 });
});

// Modification d'un utilisateur par un administrateur (sans son mot de passe)
app.put('/users/:username', auth, adminSeulement, (req, res) => {
 const corps = req.body || {};
 // Empêche l'admin de se retirer ses propres droits
 if (req.params.username === req.user.username && corps.admin === false) {
  return res.status(400).json({ message: 'Tu ne peux pas retirer tes propres droits administrateur' });
 }
 enregistrerModification(req.params.username, corps, (ok, message, code) => {
  res.status(code).json({ message: message });
 });
});

// Suppression d'un utilisateur par un administrateur
app.delete('/users/:username', auth, adminSeulement, (req, res) => {
 // Empêche l'admin de supprimer son propre compte
 if (req.params.username === req.user.username) {
  return res.status(400).json({
   message: 'Tu ne peux pas supprimer ton propre compte administrateur'
  });
 }

 connection.query(
  'DELETE FROM users WHERE username = ?',
  [req.params.username],
  (err, result) => {
   if (err) {
    console.error('Erreur lors de la suppression :', err);
    return res.status(500).json({ message: 'Erreur serveur' });
   }
   // Aucune ligne supprimée = l'utilisateur n'existe pas
   if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
   }
   res.json({ message: 'Utilisateur supprimé' });
  }
 );
});

// Connexion à la base, puis démarrage du serveur sur le port 2000
Connexion(process.env.HostBDD, process.env.LoginBDD, process.env.PasswordBDD, 'projet_auth', (resultat) => {
 if (resultat !== true) {
  console.error(resultat);
  return;
 }
 console.log('Connecté à la base de données MySQL.');
 app.listen(2000, () => {
  console.log('Serveur lancé sur le port 2000');
 });
});