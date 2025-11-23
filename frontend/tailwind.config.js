/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dark-bg': {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
        },
        'dark-text': {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        'dark-border': {
          primary: 'var(--color-border-primary)',
          secondary: 'var(--color-border-secondary)',
        },
        'dark-input': {
          bg: 'var(--color-input-bg)',
          border: 'var(--color-input-border)',
          text: 'var(--color-input-text)',
          placeholder: 'var(--color-input-placeholder)',
        },
      },
    },
  },
  plugins: [],
}

