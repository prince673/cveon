/* CVEon offline shell service worker.
 *
 * Scope of the cache — deliberately narrow to honor the privacy model:
 *   - ONLY same-origin static shell assets (the app bundle itself).
 *   - NEVER cross-origin responses. All intelligence feeds (NVD, CIRCL,
 *     EPSS, KEV, GitHub) pass straight through to the network uncached,
 *     so lookups are always fresh and nothing query-related is stored.
 *   - No user data, no request bodies, no query strings persisted.
 */

const CACHE_NAME = 'cveon-shell-v1'
// Relative paths resolve against the SW's own location, so this works both at
// site root and on subpath deployments (e.g. GitHub Pages project sites).
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Cross-origin (the intelligence APIs): never intercept, never cache.
  if (url.origin !== self.location.origin) return

  // Navigations: network first, fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(resp => {
          const copy = resp.clone()
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy))
          return resp
        })
        .catch(() => caches.match('./index.html'))
    )
    return
  }

  // Static assets: cache-first, refresh in the background (stale-while-revalidate).
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(resp => {
          if (resp.ok) {
            const copy = resp.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          }
          return resp
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
