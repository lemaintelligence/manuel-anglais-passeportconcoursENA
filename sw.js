// Service worker - Manuel interactif anglais ENA
// Version du cache : changer ce numéro à chaque mise à jour du contenu
const CACHE_NAME        = 'manuel-anglais-ena-v4';
const FONTS_CACHE_NAME  = 'manuel-anglais-ena-fonts-v4';

// ── Liste de tous les fichiers à mettre en cache ─────────────────────────────
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
  './imprimer_manuel_complet.html',
];

// ── Installation : mise en cache de tous les fichiers du manuel ──────────────
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
  const VALID_CACHES = [CACHE_NAME, FONTS_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => !VALID_CACHES.includes(name))
          .map((name) => caches.delete(name))
      )
    )
  );
  // Prise de contrôle immédiate de toutes les pages ouvertes
  self.clients.claim();
});

// ── Interception des requêtes ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {

  // 1. Ignorer tout ce qui n'est pas GET (POST, PUT, DELETE…)
  //    L'API Cache ne supporte pas les requêtes non-GET.
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 2. Polices Google Fonts → stratégie "cache d'abord, réseau en fallback"
  //    Les polices ne changent jamais une fois chargées : inutile de
  //    solliciter le réseau à chaque fois. On les garde dans un cache dédié
  //    pour ne pas polluer le cache principal du manuel.
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(FONTS_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        // Première fois : on récupère et on stocke
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      })
    );
    return;
  }

  // 3. Tout le reste (pages du manuel) → stratégie "réseau d'abord, cache en fallback"
  //    On essaie d'abord le réseau pour avoir la version la plus récente.
  //    Si pas de connexion, on sert depuis le cache.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
