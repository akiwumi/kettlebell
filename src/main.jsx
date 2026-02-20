import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import RootErrorBoundary from './components/RootErrorBoundary'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:24px;font-family:system-ui;">Root element #root not found.</div>'
} else {
  try {
    const root = ReactDOM.createRoot(rootEl)
    root.render(
      <React.StrictMode>
        <RootErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </RootErrorBoundary>
      </React.StrictMode>
    )
  } catch (err) {
    console.error('Mount error:', err)
    rootEl.innerHTML = `<div style="padding:24px;font-family:system-ui;max-width:480px;margin:40px auto;"><h1>Failed to start</h1><pre style="font-size:12px;overflow:auto;">${String(err?.message || err)}</pre><p style="font-size:12px;margin-top:16px;">Check the browser console.</p></div>`
  }
}
