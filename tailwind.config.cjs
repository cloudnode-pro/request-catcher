const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/frontend.js",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    25: "#fafbfd",
                    1000: "#0a0f1b"
                }
            },
            fontFamily: {
                sans: ["Inter var", "Inter", ...defaultTheme.fontFamily.sans],
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms')
    ],
}
