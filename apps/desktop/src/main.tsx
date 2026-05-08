import 'web-streams-polyfill'
import { darkTheme, lightTheme } from '@markflowy/theme'
import * as Sentry from '@sentry/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { emit } from '@tauri-apps/api/event'
import 'antd/dist/antd.css'
import { HoxRoot } from 'hox'
import { enableMapSet } from 'immer'
import { StrictMode, Suspense, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import 'remixicon/fonts/remixicon.css'
import { Spinners } from 'zens'
import App from './App'
import { currentWindow } from './services/windows'
import './atom.css'
import './normalize.css'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [],
})

enableMapSet()

const queryClient = new QueryClient()

const initialThemeMode = window.__MF_INITIAL_THEME_MODE__
const startupTheme = initialThemeMode === 'dark' || (
  initialThemeMode !== 'light' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
)
  ? darkTheme
  : lightTheme

const Main = () => {
  useEffect(() => {
    const notifyStartupReady = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          void emit('markflowy-startup-ready')
        })
      })
    }

    const timer = window.setTimeout(() => {
      currentWindow.show()
      currentWindow.setFocus()
      notifyStartupReady()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <Suspense
      fallback={
        <div
          style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: startupTheme.styledConstants.bgColor,
            color: startupTheme.styledConstants.primaryFontColor,
          }}
        >
          <Spinners.BarLoader color={startupTheme.styledConstants.accentColor} width={200} />
        </div>
      }
    >
      <App />
    </Suspense>
  )
}

const rootElement = document.getElementById('root')!
rootElement.addEventListener('dragover', (e) => {
  e.preventDefault()
})
rootElement.addEventListener('drop', (event) => {
  event.preventDefault()
})

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <HoxRoot>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Main />
        </BrowserRouter>
      </QueryClientProvider>
    </HoxRoot>
  </StrictMode>,
)
