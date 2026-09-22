const http = require("http");
const fs = require("fs");

const serveur = http.createServer(function(req, res) {

let fichier = req.url;

if (fichier == "/") {
fichier = "/index.html";
}

fs.readFile("." + fichier, function(erreur, contenu) {

if (erreur) {
res.writeHead(404);
res.end("Fichier introuvable");
return;
}

res.writeHead(200);
res.end(contenu);

});

});

serveur.listen(3000, function() {
console.log("Serveur lancé sur http://localhost:3000");
});