const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: {
        main: './src/index.js',
    },
    devServer: {
        contentBase: './dist',
    },
    // devtool:'cheap-module-source-map',
    module: {
        rules: [
            {
                test: /\.html$/i,
                use: [
                    {
                        loader: 'html-loader',
                        options: {
                            attributes: {
                                list: ['...'],
                            }
                        }
                    },
                    {
                        loader: '@kmaraz/replace-svg-in-html-loader',
                        options: {
                            iconPath: './src/assets/'
                        }
                    },
                ],
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Squashish!',
            template: './src/page.html'
        }),
        new CleanWebpackPlugin()
    ],
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js'
    },
}