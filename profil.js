fetch("api/session.php")

.then(response => response.json())

.then(data => {

    if (!data.loggedIn) {
        window.location.href = "connexion.html";
        return;
    }

    if (data.role == "admin") {
        document.getElementById("admin").style.display = "block";
    }

});


function deconnexion() {

    fetch("api/logout.php", {
        method: "POST"
    })

    .then(response => response.json())

    .then(data => {

        if (data.success) {
            window.location.href = "connexion.html";
        }

    });

}


function supprimer() {

    let choix = confirm("Voulez-vous vraiment supprimer votre compte ?");

    if (!choix) {
        return;
    }

    fetch("api/delete-account.php", {
        method: "DELETE"
    })

    .then(response => response.json())

    .then(data => {

        if (data.success) {
            window.location.href = "connexion.html";
        }

    });

}