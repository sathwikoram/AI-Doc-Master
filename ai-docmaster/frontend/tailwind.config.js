/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // badge variants
    'badge-blue','badge-green','badge-amber','badge-red','badge-slate',
    // dynamic bg/text used in StatCard, Sidebar, etc.
    { pattern: /^(bg|text|border|ring)-(indigo|emerald|amber|red|green|slate|purple|blue|violet)-(50|100|200|300|400|500|600|700|800|900)$/ },
    { pattern: /^from-(indigo|emerald|slate|primary)-(600|700|800|900)$/ },
    { pattern: /^to-(indigo|emerald|slate|primary)-(600|700|800|900)$/ },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
          300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1',
          600: '#4f46e5', 700: '#4338ca', 800: '#3730a3',
          900: '#312e81', 950: '#1e1b4b',
        },
        accent: {
          300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706',
        },
        success: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
        warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
        danger:  { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      boxShadow: {
        card:     '0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06)',
        elevated: '0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -2px rgba(0,0,0,.06)',
        modal:    '0 20px 25px -5px rgba(0,0,0,.12), 0 8px 10px -6px rgba(0,0,0,.08)',
      },
    },
  },
  plugins: [],
}
