import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

// ask-sonner skill:
// ONE Toaster, at document root, outside any dialog/portal — never conditional.
// richColors for colorful success/error.
// theme="light" because Iron Gym is light-mode only.
// mobileOffset accounts for the mobile bottom nav + safe area.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      theme="light"
      position="bottom-right"
      richColors
      expand={false}
      offset={{ top: 20, bottom: 80, right: 20 }}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: 'font-["Plus_Jakarta_Sans"] !text-[var(--text-primary)] !shadow-[var(--shadow-float)]',
          title: '!font-semibold',
          description: '!text-[var(--text-secondary)]',
        },
      }}
    />
  </StrictMode>,
)
