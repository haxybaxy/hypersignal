import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/sonner'
import App from './App'
import './index.css'

// Follow the OS colour scheme; shadcn's dark palette keys off the `.dark` class.
const darkScheme = window.matchMedia('(prefers-color-scheme: dark)')
const applyScheme = () => document.documentElement.classList.toggle('dark', darkScheme.matches)
applyScheme()
darkScheme.addEventListener('change', applyScheme)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="bottom-right" />
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
    </QueryClientProvider>
  </StrictMode>,
)
