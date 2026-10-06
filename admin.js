const token = localStorage.getItem("token");

if (!token) {
window.location.href = "index.html";
}

async function afficherUtilisateurs() {
const response = await fetch("/users", {
headers: {
Authorization: "Bearer " + token
}
});

if (!response.ok) {
window.location.href = "index.html";
return;
}

const users = await response.json();

const container = document.getElementById("users");

users.forEach(user => {
const div = document.createElement("div");

div.innerHTML = `
<p>
${user.username}
<button onclick="supprimerUtilisateur('${user.username}')">
Supprimer
</button>
</p>
`;

container.appendChild(div);
});
}

async function supprimerUtilisateur(username) {
if (!confirm("Voulez-vous supprimer " + username + " ?")) {
return;
}

const response = await fetch("/users/" + username, {
method: "DELETE",
headers: {
Authorization: "Bearer " + token
}
});

if (response.ok) {
location.reload();
} else {
alert("Impossible de supprimer l'utilisateur");
}
}

afficherUtilisateurs();

