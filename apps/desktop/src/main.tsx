import 'web-streams-polyfill'
import * as Sentry from '@sentry/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'antd/dist/antd.css'
import { HoxRoot } from 'hox'
import { enableMapSet } from 'immer'
import { StrictMode, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import 'remixicon/fonts/remixicon.css'
import App from './App'
import { installDisableTextInputAssistance } from './helper/disableTextInputAssistance'
import { installInstantClick } from './helper/installInstantClick'
import { installGlobalErrorLogging } from './helper/logger'
import './atom.css'
import './normalize.css'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [],
})

enableMapSet()
installGlobalErrorLogging()

const queryClient = new QueryClient()

const Main = () => {
  return (
    <Suspense fallback={null}>
      <App />
    </Suspense>
  )
}

const rootElement = document.getElementById('root')!
installDisableTextInputAssistance(rootElement)
installInstantClick(rootElement)
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
