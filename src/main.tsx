import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "leaflet/dist/leaflet.css"
import './index.css'
import App from './App.tsx'

// El tema sigue la preferencia del sistema: la clase `dark` activa el bloque
// .dark de index.css (espejo del modo Dark de Figma).
const darkMedia = window.matchMedia("(prefers-color-scheme: dark)")
function syncColorScheme() {
  document.documentElement.classList.toggle("dark", darkMedia.matches)
}
syncColorScheme()
darkMedia.addEventListener("change", syncColorScheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
