const typescript = require('@rollup/plugin-typescript');

module.exports = {
    input: 'src/index.ts',
    output: {
        file: './build/simple-comment-viewer.js',
        format: 'cjs',
    },
    plugins: [typescript()],
};
