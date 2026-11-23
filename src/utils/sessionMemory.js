// Ephemeral, in-memory UI state for recent searches and pinned CVEs.
//
// Nothing here touches localStorage, sessionStorage, cookies or the network —
// it is plain module-scope RAM that vanishes the moment the tab closes. This
// keeps the app's zero-footprint privacy promise while still letting the UI
// feel persistent within a session.

import { CVE_ID_PATTERN } from './cveFormat'

let recents = []
let pins = []
const listeners = new Set()

function emit() {
  const snapshot = { recents: [...recents], pins: [...pins] }
  for (const listener of listeners) {
    try { listener(snapshot) } catch { /* a broken subscriber must not break the rest */ }
  }
}

export function subscribeMemory(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getRecents() {
  return [...recents]
}

export function addRecent(cveId, max = 8) {
  const id = String(cveId || '').trim().toUpperCase()
  if (!CVE_ID_PATTERN.test(id)) return
  recents = [id, ...recents.filter(r => r !== id)].slice(0, max)
  emit()
}

export function clearRecents() {
  recents = []
  emit()
}

export function getPins() {
  return [...pins]
}

export function isPinned(cveId) {
  return pins.includes(String(cveId || '').trim().toUpperCase())
}

export function togglePin(cveId, max = 12) {
  const id = String(cveId || '').trim().toUpperCase()
  if (!CVE_ID_PATTERN.test(id)) return false
  pins = pins.includes(id)
    ? pins.filter(p => p !== id)
    : [id, ...pins].slice(0, max)
  emit()
  return pins.includes(id)
}

export function clearPins() {
  pins = []
  emit()
}
