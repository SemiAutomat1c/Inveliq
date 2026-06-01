import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeProvider.tsx'
import { Toaster } from './components/ui/toaster.tsx'
import { normalizeConvexUrl } from './lib/convexUrl.ts'

const convex = new ConvexReactClient(normalizeConvexUrl(import.meta.env.VITE_CONVEX_URL as string))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ConvexProvider client={convex}>
        <App />
        <Toaster />
      </ConvexProvider>
    </ThemeProvider>
  </StrictMode>,
)
