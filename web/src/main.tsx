import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import './styles/admin-login.css'
import './styles/admin-dashboard.css'
import './styles/event-post-detail.css'
import './styles/saved-items.css'
import './styles/inshorts-feed.css'
import './styles/events-ui.css'
import './styles/events-profile.css'
import './styles/events-apps.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
