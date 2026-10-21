/* L’application et React sont précompilés ensemble : aucun CDN n’est requis. */
"use strict";
const retry = document.getElementById("startup-retry");
if (retry) retry.addEventListener("click", () => location.reload());
window.addEventListener("error", () => {
  const status = document.getElementById("startup-status");
  if (status) {
    status.textContent = "Le chargement n’a pas abouti. Vérifie ta connexion puis réessaie.";
    if (retry) retry.hidden = false;
  }
});
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", {scope:"./", updateViaCache:"none"})
      .then(registration => registration.update())
      .catch(error => console.warn("Mode hors connexion indisponible :", error));
  });
}
