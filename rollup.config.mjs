import terser from "@rollup/plugin-terser";

export default {
    input: "bt-arcaea-site-poller.user.js",
    output: {
        file: "bt-arcaea-site-poller.min.js",
        format: "iife"
    },
    plugins: [terser()]
};