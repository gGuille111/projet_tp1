let utilisateur = null;

function page(nom) {
    document.querySelectorAll(".page").forEach(function(element) {
        element.classList.remove("active");
    });
    document.getElementById(nom).classList.add("active");
}

async function inscription() {
    let username =
        document.getElementById("nom").value;
    let password =
        document.getElementById("password").value;
    if (username === "" || password === "") {
        document.getElementById("messageInscription").textContent =
            "Remplis tous les champs.";
        return;
    }

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
}

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

    let reponse = await fetch("/api/supprimer", {
        method: "DELETE"
    });

    let resultat = await reponse.json();

    if (reponse.ok) {
        utilisateur = null;
        page("accueil");
        alert(resultat.message);
    } else {
        alert(resultat.message);
    }
}


// CHARGER LES UTILISATEURS

async function chargerUtilisateurs() {

    let reponse =
        await fetch("/api/admin");

    let resultat =
        await reponse.json();


    if (!reponse.ok) {

        alert(resultat.message);

        return;
    }


    let div =
        document.getElementById("listeUtilisateurs");


    div.innerHTML = "";


    resultat.users.forEach(function(user) {

        let ligne =
            document.createElement("p");


        ligne.innerHTML =
            user.id +
            " - " +
            user.username +
            " - " +
            user.role +
            " ";


        let bouton =
            document.createElement("button");


        bouton.textContent =
            "Supprimer";


        bouton.onclick =
            function() {
                supprimerUtilisateur(user.id);
            };


        ligne.appendChild(bouton);

        div.appendChild(ligne);

    });

}


// SUPPRIMER UN UTILISATEUR

async function supprimerUtilisateur(id) {

    if (!confirm("Supprimer cet utilisateur ?")) {
        return;
    }


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

}