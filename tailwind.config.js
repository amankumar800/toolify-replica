/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                // AI Tools Book Custom Tokens
                toolify: {
                    white: "#FFFFFF",
                    bg: "#F8F9FB",
                    black: "#171717",
                    purple: {
                        50: "#F5F3FF",
                        100: "#EDE9FE",
                        500: "#8B5CF6",
                        600: "#7C3AED",
                        700: "#7A40F2", // Target Brand Color
                    },
                    gray: {
                        50: "#F9FAFB",
                        100: "#F3F4F6",
                        200: "#E5E7EB",
                        400: "#9CA3AF",
                        500: "#6B7280",
                        600: "#4B5563",
                        900: "#111827",
                    }
                },
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            // Z-index Registry to prevent Stacking Wars
            zIndex: {
                'navbar': '50',
                'mobile-nav': '40',
                'sidebar': '30',
                'dropdown': '20',
                'card-hover': '10',
                'base': '0',
            },
            // Breakpoints for 4-column layout
            screens: {
                '2xl': '1440px',
            },
        },
    },
    plugins: [],
}
