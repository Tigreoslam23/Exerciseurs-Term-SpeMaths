/* Lanceur statique : TypeScript/TSX transformé dans le navigateur.
   Les versions des dépendances sont fixées. Une compilation locale
   produit aussi une version sans transformation TSX au démarrage. */
(async function () {
  "use strict";
  const status = document.getElementById("startup-status");
  const retry = document.getElementById("startup-retry");
  if (retry) retry.addEventListener("click", () => location.reload());
  function failure(error) {
    console.error("Dérive Lab :", error);
    if (status) status.textContent = "L’atelier n’a pas pu démarrer. Vérifie ta connexion Internet, puis réessaie.";
    if (retry) retry.hidden = false;
  }
  async function load(urls) {
    let lastError;
    for (const url of urls) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = url;
          script.crossOrigin = "anonymous";
          script.onload = () => resolve(undefined);
          script.onerror = () => { script.remove(); reject(new Error("Ressource indisponible : " + url)); };
          document.head.appendChild(script);
        });
        return;
      } catch (error) { lastError = error; }
    }
    throw lastError;
  }
  window.addEventListener("error", event => {
    if (document.getElementById("startup-status")) failure(event.error || new Error(event.message));
  });
  try {
    await load([
      "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js",
      "https://unpkg.com/react@18.3.1/umd/react.production.min.js"
    ]);
    await Promise.all([
      load([
        "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js",
        "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"
      ]),
      load([
        "https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js",
        "https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"
      ])
    ]);
    if (!window.React || !window.ReactDOM || !window.Babel) throw new Error("Dépendance manquante");
    const response = await fetch("./app.tsx", {cache:"no-cache"});
    if (!response.ok) throw new Error("Source introuvable (" + response.status + ")");
    const source = await response.text();
    const result = window.Babel.transform(source, {
      filename: "app.tsx",
      presets: [
        ["typescript", {allExtensions:true,isTSX:true}],
        ["react", {runtime:"classic"}]
      ],
      sourceMaps: false
    });
    if (!result.code) throw new Error("Compilation impossible");
    const script = document.createElement("script");
    script.textContent = result.code + "\n//# sourceURL=derive-lab-app.js";
    document.body.appendChild(script);
  } catch (error) { failure(error); }
})();
