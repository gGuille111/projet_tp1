document.getElementById("formulaire").addEventListener("submit", function(e) {

    e.preventDefault();

    let username = document.getElementById("username").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let confirmation = document.getElementById("confirmation").value;

    if (password != confirmation) {
        document.getElementById("message").textContent =
        "Les mots de passe ne sont pas identiques.";
        return;
    }

    fetch("api/register.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password
        })
    })

    .then(response => response.json())

    .then(data => {
        document.getElementById("message").textContent = data.message;
    });

});