/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			fontFamily: {
				'nunito': ['Nunito Sans', 'sans-serif'],
			},
			colors: {
				// Healthcare Color Palette
				primary: {
					DEFAULT: '#5B9BD5', // Trustworthy Blue
					50: '#EBF4FD',
					100: '#D6E9FB',
					500: '#5B9BD5',
					600: '#4A8BC4',
					700: '#3A7BB3',
					foreground: '#FFFFFF',
				},
				secondary: {
					DEFAULT: '#A3D9A5', // Calming Green
					50: '#F1F9F1',
					100: '#E3F2E4',
					500: '#A3D9A5',
					600: '#92C994',
					700: '#81B983',
					foreground: '#333333',
				},
				accent: {
					DEFAULT: '#F8C471', // Warm Amber
					50: '#FEF9F0',
					100: '#FDF2E1',
					500: '#F8C471',
					600: '#F7B350',
					700: '#F6A22F',
					foreground: '#333333',
				},
				destructive: {
					DEFAULT: '#E77B7B', // Soft Red
					50: '#FDF2F2',
					100: '#FBE5E5',
					500: '#E77B7B',
					600: '#E26A6A',
					700: '#DD5959',
					foreground: '#FFFFFF',
				},
				// Neutral colors
				background: '#F8F9FA', // Off-White
				foreground: '#333333', // Charcoal Gray
				card: {
					DEFAULT: '#FFFFFF', // Pure White
					foreground: '#333333',
				},
				muted: {
					DEFAULT: '#F8F9FA',
					foreground: '#6C757D', // Light Gray
				},
				border: '#E0E0E0', // Very Light Gray
				input: '#FFFFFF',
				ring: '#5B9BD5',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}