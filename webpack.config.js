'use strict';
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: 'app',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    watch: true,
    watchOptions: {
     aggregateTimeout: 100
    },
    module: {
        rules: [
        {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env']
                    // plugins: ['@babel/transform-runtime']
                }
            }
        }
        ]
    },
    resolve: {
        modules: [path.resolve(__dirname, "src"), "node_modules"]
    },
    plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
        title: 'BattleShip'
    })
    ]
};