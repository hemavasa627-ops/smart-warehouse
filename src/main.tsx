import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { InventoryProvider } from './context/InventoryContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <InventoryProvider>
        <App />
      </InventoryProvider>
    </ThemeProvider>
  </React.StrictMode>,
)