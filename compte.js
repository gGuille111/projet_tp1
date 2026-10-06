const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token) {
window.location.href = "index.html";
}

document.getElementById("username").textContent = "Bienvenue " + username;

document.getElementById("deleteAccount").addEventListener("click", async () => {
const confirmation = confirm("Voulez-vous vraiment supprimer votre compte ?");

if (!confirmation) return;

const response = await fetch("/delete-account", {
method: "DELETE",
headers: {
Authorization: "Bearer " + token
}
});

if (response.ok) {
localStorage.removeItem("token");
localStorage.removeItem("username");
window.location.href = "index.html";
} else {
alert("Impossible de supprimer le compte");
}
});