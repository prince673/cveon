import { StrictMode } from 'react'
import { createRoot }  from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Offline shell: register the service worker in production builds only, so
// `vite dev` is never intercepted. The SW caches the static bundle (same-origin
// assets) and deliberately never touches cross-origin intelligence feeds —
// lookups stay live and nothing query-related is ever stored.
// NOTE: BASE_URL-aware (vite base is './') so registration also works when the
// site is served from a subpath, e.g. GitHub Pages project sites.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`
    navigator.serviceWorker.register(swUrl, { scope: './' }).catch(() => {
      // Offline shell is a progressive enhancement — ignore failures.
    })
  })
}