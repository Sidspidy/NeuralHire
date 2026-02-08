/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0B0F19',
                primary: {
                    DEFAULT: '#6366F1', // Indigo 500
                    foreground: '#FFFFFF',
                },
                secondary: {
                    DEFAULT: '#22D3EE', // Cyan 400
                    foreground: '#0B0F19',
                },
                success: '#22C55E',
                warning: '#F59E0B',
                error: '#EF4444',
                text: {
                    primary: '#E5E7EB', // Gray 200
                    secondary: '#9CA3AF', // Gray 400
                },
                border: 'rgba(255, 255, 255, 0.1)',
                card: {
                    DEFAULT: 'rgba(17, 24, 39, 0.7)', // Gray 900 with opacity
                    hover: 'rgba(31, 41, 55, 0.8)', // Gray 800 with opacity
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
        },
    },
    plugins: [],
}
