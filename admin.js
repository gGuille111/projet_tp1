fetch("api/admin-users.php")

.then(response => response.json())

.then(data => {

    if (!data.success) {
        document.getElementById("utilisateurs").textContent =
        "Accès interdit.";
        return;
    }

    let texte = "";

    data.users.forEach(user => {

        texte += "<p>";

        texte += user.id + " - ";
        texte += user.username + " - ";
        texte += user.email + " - ";
        texte += user.role;

        if (user.role != "admin") {

            texte += " <button onclick=\"supprimer(" +
            user.id + ")\">Supprimer</button>";

        }

        texte += "</p>";

    });

    document.getElementById("utilisateurs").innerHTML = texte;

});


function supprimer(id) {

    let choix = confirm("Supprimer cet utilisateur ?");

    if (!choix) {
        return;
    }

    fetch("api/admin-delete-user.php", {

        method: "DELETE",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            id: id
        })

    })

    .then(() => {
        location.reload();
    });

}