/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'labs-black': '#161718',
        'labs-blue': '#1DA1F2',
        'labs-gray': '#8C8C8C',
        'labs-dark-gray': '#9AA0A6',
        'labs-gainsboro': '#DADCE0',
        'labs-crimson': '#E53838',
        'labs-lavender': '#E8EAED',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

