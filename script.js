let utilisateur = null;


// CHANGER DE PAGE
function page(nom) {

    document.querySelectorAll(".page").forEach(function(element) {
        element.classList.remove("active");
    });

    document.getElementById(nom).classList.add("active");
}


// INSCRIPTION
async function inscription() {

    let username = document.getElementById("nom").value;
    let password = document.getElementById("password").value;

    if (username === "" || password === "") {
        document.getElementById("messageInscription").textContent =
            "Remplis tous les champs.";
        return;
    }

    try {

        let reponse = await fetch("/api/inscription", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        let resultat = await reponse.json();

        document.getElementById("messageInscription").textContent =
            resultat.message;

        if (reponse.ok) {

            document.getElementById("nom").value = "";
            document.getElementById("password").value = "";

            page("connexion");
        }

    } catch (erreur) {

        document.getElementById("messageInscription").textContent =
            "Impossible de contacter le serveur.";
    }
}


// CONNEXION
async function connexion() {

    let username =
        document.getElementById("nomConnexion").value;

    let password =
        document.getElementById("passwordConnexion").value;

    if (username === "" || password === "") {

        document.getElementById("messageConnexion").textContent =
            "Remplis tous les champs.";

        return;
    }

    try {

        let reponse = await fetch("/api/connexion", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        let resultat = await reponse.json();

        document.getElementById("messageConnexion").textContent =
            resultat.message;

        if (reponse.ok) {

            utilisateur = resultat.user;

            afficherProfil();

            page("profil");
        }

    } catch (erreur) {

        document.getElementById("messageConnexion").textContent =
            "Impossible de contacter le serveur.";
    }
}


// AFFICHER LE PROFIL
function afficherProfil() {

    document.getElementById("profilNom").textContent =
        utilisateur.username;
}


// DECONNEXION
async function deconnexion() {

    try {

        await fetch("/api/deconnexion", {
            method: "POST"
        });

    } catch (erreur) {
        console.log(erreur);
    }

    utilisateur = null;

    page("accueil");
}


// SUPPRIMER SON COMPTE
async function supprimerCompte() {

    if (!confirm("Supprimer ton compte ?")) {
        return;
    }

    try {

        let reponse = await fetch("/api/supprimer", {
            method: "DELETE"
        });

        let resultat = await reponse.json();

        alert(resultat.message);

        if (reponse.ok) {

            utilisateur = null;

            page("accueil");
        }

    } catch (erreur) {

        alert("Impossible de contacter le serveur.");
    }
}


// CHARGER LES UTILISATEURS ADMIN
async function chargerUtilisateurs() {

    try {

        let reponse =
            await fetch("/api/admin");

        let resultat =
            await reponse.json();

        if (!reponse.ok) {

            alert(resultat.message);

            return;
        }

        let liste =
            document.getElementById("listeUtilisateurs");

        liste.innerHTML = "";

        resultat.users.forEach(function(user) {

            let ligne =
                document.createElement("p");

            ligne.textContent =
                user.id +
                " - " +
                user.username +
                " - " +
                user.role;

            let bouton =
                document.createElement("button");

            bouton.textContent =
                "Supprimer";

            bouton.onclick =
                function() {
                    supprimerUtilisateur(user.id);
                };

            ligne.appendChild(bouton);

            liste.appendChild(ligne);

        });

    } catch (erreur) {

        alert("Impossible de contacter le serveur.");
    }
}


// SUPPRIMER UN UTILISATEUR
async function supprimerUtilisateur(id) {

    if (!confirm("Supprimer cet utilisateur ?")) {
        return;
    }

    try {

        let reponse =
            await fetch("/api/admin/supprimer", {

                method: "DELETE",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    id: id
                })
            });

        let resultat =
            await reponse.json();

        alert(resultat.message);

        if (reponse.ok) {
            chargerUtilisateurs();
        }

    } catch (erreur) {

        alert("Impossible de contacter le serveur.");
    }
}