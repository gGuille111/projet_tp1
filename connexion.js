document.getElementById("formulaire").addEventListener("submit", function(e) {

    e.preventDefault();

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    fetch("api/login.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })

    .then(response => response.json())

    .then(data => {

        if (data.success) {
            window.location.href = "profil.html";
        } else {
            document.getElementById("message").textContent = data.message;
        }

    });

});