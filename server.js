let utilisateur = null;

function page(nom) {

    document.querySelectorAll(".page").forEach(function(page) {
        page.classList.remove("active");
    });

    document.getElementById(nom).classList.add("active");
}


async function inscription() {

    let nom = document.getElementById("nom").value;
    let password = document.getElementById("password").value;

    let reponse = await fetch("/api/inscription", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            username: nom,
            email: email,
            password: password
        })

    });

    let resultat = await reponse.json();

    document.getElementById("messageInscription").textContent =
        resultat.message;

    if (reponse.ok) {
        page("connexion");
    }
}

async function connexion() {

    let email =
        document.getElementById("nomConnexion").value;

    let password =
        document.getElementById("passwordConnexion").value;

    let reponse = await fetch("/api/connexion", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email: email,
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
}


function afficherProfil() {

    document.getElementById("profilNom").textContent =
        utilisateur.username;
}


async function deconnexion() {

    await fetch("/api/deconnexion", {
        method: "POST"
    });

    utilisateur = null;

    page("accueil");
}

async function supprimerCompte() {

    if (!confirm("Supprimer ton compte ?")) {
        return;
    }

    await fetch("/api/supprimer", {
        method: "DELETE"
    });

    utilisateur = null;

    page("accueil");
}