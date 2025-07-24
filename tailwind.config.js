// tailwind.config.js
module.exports = {
    important: true,
    theme: {
        fontFamily: {
            sans: ['Montserrat', 'sans-serif'],
            display: ['Montserrat', 'sans-serif'],
            body: ['Montserrat', 'sans-serif'],
        },
        extend: {
            colors: {
                cyan: '#9cdbff',
            },
            margin: {
                '96': '24rem',
                '128': '32rem',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                },
            },
            animation: {
                fadeIn: 'fadeIn 0.6s ease-in-out forwards',
            },
        },
    },
    variants: {
        opacity: ['responsive', 'hover'],
    },
};
