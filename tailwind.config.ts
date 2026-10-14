import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#0F172A",
        surface: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          card: "#FFFFFF",
        },
        brand: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          500: "#FF5B22", // Flame Orange (Warm canteen appetite accent)
          600: "#EA4A12",
          700: "#C2370A",
          dark: "#0F172A", // Deep Slate
        },
        rush: {
          low: "#10B981", // Emerald
          moderate: "#F59E0B", // Amber
          high: "#EF4444", // Crimson
        },
        counter: {
          1: "#4F46E5", // Indigo (Counter 1: Biryani / Rice)
          2: "#0D9488", // Teal (Counter 2: Meals / Chapati)
          3: "#E11D48", // Rose (Counter 3: Snacks / Drinks / Cashier)
        }
      },
      boxShadow: {
        'glass': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'glass-hover': '0 8px 30px -4px rgba(15, 23, 42, 0.08)',
        'elevated': '0 12px 36px -4px rgba(15, 23, 42, 0.10)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
