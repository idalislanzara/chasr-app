import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Show something immediately while React loads
const root = document.getElementById('root')!;
root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0d0d12;color:#d946ef;font-family:Inter,sans-serif;font-size:36px;font-weight:800;letter-spacing:-1.5px">chasr</div>';

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
