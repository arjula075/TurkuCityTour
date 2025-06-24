// tailwind.config.js
module.exports = {
    important: true,
    theme: {
        fontFamily: {
            sans: ['Montserrat', 'sans-serif'], // Global default
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
        },
    },
    variants: {
        opacity: ['responsive', 'hover'],
    },
};
