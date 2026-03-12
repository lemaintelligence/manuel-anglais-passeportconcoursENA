// Service worker - Manuel interactif anglais ENA
// Version du cache : changer ce numéro à chaque mise à jour du contenu
const CACHE_NAME = 'manuel-anglais-ena-v2';

// Liste de tous les fichiers à mettre en cache
const FILES_TO_CACHE = [
  './',
  './index.html',
  './passeport_concours_ENA_anglais.html',
  './manuel_interactif_anglais_chapitre1_bases_grammaire.html',
  './manuel_interactif_anglais_chapitre2_comparatifs_superlatifs.html',
  './manuel_interactif_anglais_chapitre3_pluriel.html',
  './manuel_interactif_anglais_chapitre4_conjugaison.html',
  './manuel_interactif_anglais_chapitre5_prepositions.html',
  './manuel_interactif_anglais_chapitre6_traduction.html',
  './lead_magnet_chariow.html',
];

// Installation : mise en cache de tous les fichiers
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Activation immédiate sans attendre la fermeture des onglets existants
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Prise de contrôle immédiate de toutes les pages ouvertes
  self.clients.claim();
});

// Interception des requêtes : stratégie "network first, fallback cache"
// => On essaie d'abord le réseau pour avoir la version à jour,
//    si pas de connexion on sert depuis le cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la réponse réseau est valide, on met à jour le cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Pas de connexion : on sert depuis le cache
        return caches.match(event.request);
      })
  );
});
