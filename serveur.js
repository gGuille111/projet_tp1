const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");

const app = express();

const PORT = 3000;


// CONNEXION A MYSQL

const db = mysql.createConnection({

    host: "localhost",

    user: "root",

    password: "debiantp1",

    database: "projet_auth"

});


db.connect(function(error) {

    if (error) {

        console.log("Erreur MySQL :", error);

        return;
    }

    console.log("Connecté à MySQL");

});


// MIDDLEWARE

app.use(express.json());

app.use(express.static(__dirname));


// SESSIONS

let sessions = {};


// HASH DU MOT DE PASSE

function hashPassword(password) {

    return crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

}


// RECUPERER L'UTILISATEUR CONNECTE

function getUser(req) {

    let session =
        req.headers.cookie;

    if (!session) {
        return null;
    }


    let sessionId =
        session
        .split("=")[1];


    return sessions[sessionId];

}


// INSCRIPTION

app.post("/api/inscription", function(req, res) {

    let username =
        req.body.username;

    let password =
        req.body.password;


    if (!username || !password) {

        return res.status(400).json({
            message: "Tous les champs sont obligatoires."
        });

    }


    let passwordHash =
        hashPassword(password);


    let sql = `
        INSERT INTO users
        (username, password)
        VALUES (?, ?)
    `;


    db.query(
        sql,
        [username, passwordHash],
        function(error) {

            if (error) {

                if (error.code === "ER_DUP_ENTRY") {

                    return res.status(400).json({
                        message:
                            "Ce nom d'utilisateur existe déjà."
                    });

                }


                console.log(error);

                return res.status(500).json({
                    message: "Erreur serveur."
                });

            }


            res.json({
                message:
                    "Compte créé avec succès."
            });

        }
    );

});


// CONNEXION

app.post("/api/connexion", function(req, res) {

    let username =
        req.body.username;

    let password =
        req.body.password;


    let passwordHash =
        hashPassword(password);


    let sql = `
        SELECT id, username, role
        FROM users
        WHERE username = ?
        AND password = ?
    `;


    db.query(
        sql,
        [username, passwordHash],
        function(error, results) {

            if (error) {

                console.log(error);

                return res.status(500).json({
                    message: "Erreur serveur."
                });

            }


            if (results.length === 0) {

                return res.status(401).json({
                    message:
                        "Nom d'utilisateur ou mot de passe incorrect."
                });

            }


            let user =
                results[0];


            let sessionId =
                crypto
                .randomBytes(20)
                .toString("hex");


            sessions[sessionId] =
                user;


            res.setHeader(
                "Set-Cookie",
                "sessionId=" +
                sessionId +
                "; HttpOnly; Path=/"
            );


            res.json({

                message:
                    "Connexion réussie.",

                user: user

            });

        }
    );

});


// DECONNEXION

app.post("/api/deconnexion", function(req, res) {

    let session =
        req.headers.cookie;


    if (session) {

        let sessionId =
            session.split("=")[1];

        delete sessions[sessionId];

    }


    res.setHeader(
        "Set-Cookie",
        "sessionId=; Max-Age=0; Path=/"
    );


    res.json({
        message: "Déconnexion réussie."
    });

});


// SUPPRIMER SON COMPTE

app.delete("/api/supprimer", function(req, res) {

    let user =
        getUser(req);


    if (!user) {

        return res.status(401).json({
            message: "Vous n'êtes pas connecté."
        });

    }


    db.query(
        "DELETE FROM users WHERE id = ?",
        [user.id],
        function(error) {

            if (error) {

                console.log(error);

                return res.status(500).json({
                    message: "Erreur serveur."
                });

            }


            let sessionId =
                req.headers.cookie.split("=")[1];


            delete sessions[sessionId];


            res.setHeader(
                "Set-Cookie",
                "sessionId=; Max-Age=0; Path=/"
            );


            res.json({
                message:
                    "Compte supprimé."
            });

        }
    );

});


// ADMIN : LISTE DES UTILISATEURS

app.get("/api/admin", function(req, res) {

    let user =
        getUser(req);


    if (!user) {

        return res.status(401).json({
            message: "Vous devez être connecté."
        });

    }


    if (user.role !== "admin") {

        return res.status(403).json({
            message: "Accès refusé."
        });

    }


    db.query(
        "SELECT id, username, role FROM users",
        function(error, results) {

            if (error) {

                console.log(error);

                return res.status(500).json({
                    message: "Erreur serveur."
                });

            }


            res.json({
                users: results
            });

        }
    );

});


// ADMIN : SUPPRIMER UN UTILISATEUR

app.delete("/api/admin/supprimer", function(req, res) {

    let admin =
        getUser(req);


    if (!admin) {

        return res.status(401).json({
            message: "Vous devez être connecté."
        });

    }


    if (admin.role !== "admin") {

        return res.status(403).json({
            message: "Accès refusé."
        });

    }


    let id =
        req.body.id;


    db.query(
        "DELETE FROM users WHERE id = ?",
        [id],
        function(error) {

            if (error) {

                console.log(error);

                return res.status(500).json({
                    message: "Erreur serveur."
                });

            }


            res.json({
                message:
                    "Utilisateur supprimé."
            });

        }
    );

});


// LANCER LE SERVEUR

app.listen(PORT, function() {

    console.log(
        "Serveur lancé sur http://localhost:" + PORT
    );

});