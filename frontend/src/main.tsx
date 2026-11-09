import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import './i18n'
import App from './App.tsx'
import { queryClient } from './lib/query-client.ts'
import { initLanguage } from './lib/language.ts'
import { initPerf } from './lib/perf.ts'
import { initUiTheme } from './lib/ui-theme.ts'
import { initTheme } from './lib/theme.ts'

initLanguage()
initPerf()
initUiTheme()
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* Công cụ debug dữ liệu (nút logo góc phải dưới): tắt mặc định, bật bằng VITE_QUERY_DEVTOOLS=true trong .env.local.
          Thư viện tự loại khỏi bản build production. */}
      {import.meta.env.VITE_QUERY_DEVTOOLS === 'true' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
)
