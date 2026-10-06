let utilisateur = null;

function page(nom) {
    document.querySelectorAll(".page").forEach(function(element) {
        element.classList.remove("active");
    });

    document.getElementById(nom).classList.add("active");
}

async function inscription() {
    let username = document.getElementById("nom").value;
    let password = document.getElementById("password").value;

    if (username === "" || password === "") {
        document.getElementById("messageInscription").textContent =
            "Remplis tous les champs.";
        return;
    }

    try {
        let reponse = await fetch("/register", {
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

        document.getElementById("messageConnexion").textContent =
            resultat.message;

        if (reponse.ok && resultat.message === "Connexion réussie") {
            utilisateur = username;
            page("profil");
            document.getElementById("profilNom").textContent = username;
        }

    } catch (erreur) {
        document.getElementById("messageConnexion").textContent =
            "Impossible de contacter le serveur.";
    }
}

function deconnexion() {
    utilisateur = null;
    page("accueil");
}