/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  future: {
    // Only fire hover styles on true pointer devices — kills sticky hover on touch
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'title': ['1.375rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'heading': ['1.0625rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'base': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'sm': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'xs': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
      },
      colors: {
        // Surfaces
        'surface-ground':   'hsl(220, 20%, 97%)',
        'surface-raised':   'hsl(0, 0%, 100%)',
        'surface-overlay':  'hsl(220, 18%, 98%)',
        'surface-sidebar':  'hsl(224, 32%, 20%)',

        // Accent — Cobalt Blue
        'accent':           'hsl(221, 83%, 53%)',
        'accent-hover':     'hsl(221, 83%, 46%)',
        'accent-light':     'hsl(221, 92%, 96%)',
        'accent-mid':       'hsl(221, 70%, 88%)',

        // Danger — Iron Red
        'danger':           'hsl(356, 72%, 50%)',
        'danger-light':     'hsl(356, 92%, 96%)',
        'danger-border':    'hsl(356, 72%, 85%)',

        // Status
        'status-active':    'hsl(152, 55%, 40%)',
        'status-expiring':  'hsl(38, 92%, 44%)',
        'status-inactive':  'hsl(220, 12%, 56%)',

        // Text
        'text-primary':     'hsl(224, 30%, 14%)',
        'text-secondary':   'hsl(220, 14%, 42%)',
        'text-muted':       'hsl(220, 12%, 60%)',
        'text-on-sidebar':  'hsl(220, 20%, 85%)',

        // Borders
        'border-dim':       'hsl(220, 18%, 92%)',
        'border-subtle':    'hsl(220, 16%, 88%)',
        'border-strong':    'hsl(220, 14%, 76%)',
        'border-accent':    'hsl(221, 70%, 80%)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '16px',
        'xl': '20px',
      },
      boxShadow: {
        'card':   '0 1px 4px rgba(34, 45, 66, 0.06), 0 4px 16px rgba(34, 45, 66, 0.06)',
        'raised': '0 4px 12px rgba(34, 45, 66, 0.10), 0 1px 3px rgba(34, 45, 66, 0.06)',
        'float':  '0 8px 32px rgba(34, 45, 66, 0.16), 0 2px 8px rgba(34, 45, 66, 0.08)',
        'accent': '0 4px 14px rgba(37, 99, 235, 0.25)',
      },
      transitionTimingFunction: {
        'out':    'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        'row-enter': {
          'from': { opacity: '0', transform: 'translateY(12px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        'skeleton-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1' },
        },
        'scan-pulse': {
          '0%':   { transform: 'scale(1)',   opacity: '0.8' },
          '50%':  { transform: 'scale(1.6)', opacity: '0.4' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'scan-deny': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-6px)' },
          '40%':      { transform: 'translateX(6px)' },
          '60%':      { transform: 'translateX(-4px)' },
          '80%':      { transform: 'translateX(4px)' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'row-enter':     'row-enter 280ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'skeleton-pulse':'skeleton-pulse 1.8s ease-in-out infinite',
        'scan-pulse':    'scan-pulse 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'scan-deny':     'scan-deny 400ms ease-in-out both',
        'fade-in':       'fade-in 150ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'slide-up':      'slide-up 200ms cubic-bezier(0.23, 1, 0.32, 1) both',
      },
    },
  },
  plugins: [],
}
