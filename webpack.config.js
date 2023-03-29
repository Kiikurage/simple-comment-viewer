const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const plugins = [
    new HtmlWebpackPlugin({
        inlineSource: '.js$',
        template: path.resolve(__dirname, './src/CommentSubscriber/OBSOverlay/OBSOverlay.html'),
    }),
    new HtmlInlineScriptPlugin(),
];

if (process.env.NODE_ENV === 'production') {
    plugins.push(new ForkTsCheckerWebpackPlugin());
}

module.exports = {
    cache: true,
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: {
        index: path.resolve(__dirname, './src/CommentSubscriber/OBSOverlay/OBSOverlay.tsx'),
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].[hash].js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [{ loader: 'babel-loader' }],
            },
        ],
    },
    plugins,
};
