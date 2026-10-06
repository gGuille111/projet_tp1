const express = require('express');
const app = express();
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.HostBDD,
  user: process.env.LoginBDD,
  password: process.env.PasswordBDD,
  database: 'projet_auth'
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }

  console.log('Connecté à la base de données MySQL.');
});

app.use(express.json());
app.use(express.static(__dirname));

app.post('/register', (req, res) => {
  if (req.body.login === undefined || req.body.password === undefined) {
    res.json({ message: 'Aucune donnée reçue' });
    return;
  }

  if (req.body.login.length < 4) {
    res.json({ message: 'Le login doit contenir au moins 4 caractères' });
    return;
  }

  if (req.body.login.length > 20) {
    res.json({ message: 'Le login ne doit pas dépasser 20 caractères' });
    return;
  }

  if (req.body.password.length < 8) {
    res.json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    return;
  }

  if (req.body.password.length > 30) {
    res.json({ message: 'Le mot de passe ne doit pas dépasser 30 caractères' });
    return;
  }

  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      console.error('Erreur lors du hash du mot de passe :', err);
      res.status(500).json({ message: 'Erreur serveur' });
      return;
    }

    connection.query(
      'INSERT INTO User (login, password) VALUES (?, ?)',
      [req.body.login, hash],
      (err, results) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            res.json({ message: 'Login déjà utilisé' });
            return;
          }

          console.error('Erreur lors de l\'inscription :', err);
          res.status(500).json({ message: 'Erreur serveur' });
          return;
        }

        console.log('Inscription réussie pour :', req.body.login);
        res.json({ message: 'Inscription réussie' });
      }
    );
  });
});

app.post('/login', (req, res) => {
  if (req.body.login === undefined || req.body.password === undefined) {
    res.json({ message: 'Aucune donnée reçue' });
    return;
  }

  connection.query(
    'SELECT * FROM User WHERE login = ?',
    [req.body.login],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la connexion :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }

      if (results.length === 0) {
        res.json({ message: 'Identifiants invalides' });
        return;
      }

      bcrypt.compare(req.body.password, results[0].password, (err, resultat) => {
        if (err) {
          console.error('Erreur lors de la vérification du mot de passe :', err);
          res.status(500).json({ message: 'Erreur serveur' });
          return;
        }

        if (resultat) {
          console.log('Connexion réussie pour :', results[0].login);
          res.json({ message: 'Connexion réussie' });
          return;
        }

        res.json({ message: 'Identifiants invalides' });
      });
    }
  );
});

app.listen(2000, () => {
  console.log('Serveur lancé sur le port 2000');
});