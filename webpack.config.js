const webpack = require('webpack')
const path = require('path')

const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

module.exports = (webpackEnv) => {
	const isDevEnv = webpackEnv === 'development'
	const isProdEnv = webpackEnv === 'production'

	const getBasicCssLoaders = (cssOptions) =>
		[
			isDevEnv && require.resolve('style-loader'),
			isProdEnv && { loader: MiniCssExtractPlugin.loader },
			{ loader: require.resolve('css-loader'), options: { sourceMap: isProdEnv, ...cssOptions } },
		].filter(Boolean)

	return {
		mode: isProdEnv ? 'production' : 'development',

		devtool: isProdEnv ? 'source-map' : 'inline-source-map',

		target: 'electron-renderer',

		context: path.join(__dirname, 'app'),

		entry: './index.tsx',

		output: {
			path: path.join(__dirname, 'public'),
			filename: 'js/[name].bundle.js',
			chunkFilename: 'js/[name].chunk.js',
		},

		optimization: {
			minimize: isProdEnv,
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						ecma: 2020,
						output: {
							ascii_only: true,
						},
					},
					extractComments: {
						filename: '[file].LICENSE',
					},
				}),
				new OptimizeCssAssetsPlugin({
					cssProcessorOptions: {
						map: {
							inline: false,
							annotation: true,
						},
					},
				}),
			],
			splitChunks: {
				chunks: 'all',
				maxInitialRequests: Infinity,
				minSize: 0,
				cacheGroups: {
					react: {
						test: /[/\\]node_modules[/\\](react|react-dom)/,
						priority: 20,
					},
					antd: {
						test: /[/\\]node_modules[/\\]antd/,
						priority: 10,
					},
				},
			},
		},

		plugins: [
			new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en|pt-br/),
			new ForkTsCheckerPlugin({
				async: isDevEnv,
				silent: true,
			}),
			new CopyPlugin([
				{
					from: 'media',
					to: 'media',
				},
			]),
			new HtmlPlugin({
				inject: true,
				template: 'index.html',
			}),
			isProdEnv &&
				new MiniCssExtractPlugin({
					filename: 'css/[name].css',
					chunkFilename: 'css/[name].chunk.css',
				}),
		].filter(Boolean),

		module: {
			rules: [
				{
					enforce: 'pre',
					test: /\.tsx?$/,
					loader: require.resolve('eslint-loader'),
					options: {
						emitWarning: isDevEnv,
					},
					exclude: /node_modules/,
				},
				{
					test: /\.tsx?$/,
					loader: require.resolve('ts-loader'),
					options: {
						transpileOnly: true,
					},
					exclude: /node_modules/,
				},
				{
					oneOf: [
						{
							test: /\.css$/,
							use: getBasicCssLoaders(),
						},
						{
							test: /\.s[ac]ss$/,
							use: [
								...getBasicCssLoaders({ importLoaders: 1 }),
								{
									loader: require.resolve('sass-loader'),
									options: {
										sourceMap: isProdEnv,
									},
								},
							],
						},
						{
							test: /\.less$/,
							use: [
								...getBasicCssLoaders({ importLoaders: 1 }),
								{
									loader: require.resolve('less-loader'),
									options: {
										sourceMap: isProdEnv,
										javascriptEnabled: true,
									},
								},
							],
						},
						{
							loader: require.resolve('file-loader'),
							options: {
								name: 'media/[name].[ext]',
							},
							exclude: [/\.[jt]sx?$/, /\.html$/, /\.json$/],
						},
					],
				},
			],
		},

		resolve: {
			extensions: ['.js', '.jsx', '.ts', '.tsx'],
			alias: {
				app: path.resolve(__dirname, 'app'),
			},
		},
	}
}
