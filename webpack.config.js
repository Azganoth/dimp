const { ContextReplacementPlugin } = require('webpack');
const path = require('path');

const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = (webpackEnv) => {
	const isDevelopmentEnv = webpackEnv === 'development';
	const isProductionEnv = webpackEnv === 'production';

	const getBasicCssLoaders = (cssOptions) =>
		[
			isDevelopmentEnv && require.resolve('style-loader'),
			isProductionEnv && { loader: MiniCssExtractPlugin.loader },
			{ loader: require.resolve('css-loader'), options: { sourceMap: isProductionEnv, ...cssOptions } },
		].filter(Boolean);

	return {
		mode: isProductionEnv ? 'production' : 'development',

		devtool: isProductionEnv ? 'source-map' : 'inline-source-map',

		target: 'electron-renderer',

		externals: [
			nodeExternals({
				modulesFromFile: {
					include: ['dependencies'],
				},
			}),
		],

		context: path.join(__dirname, 'app'),

		entry: './index.tsx',

		output: {
			path: path.join(__dirname, 'build'),
			filename: 'js/[name].bundle.js',
			chunkFilename: 'js/[name].chunk.js',
		},

		optimization: {
			minimize: isProductionEnv,
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						ecma: 2020,
						output: {
							ascii_only: true,
						},
					},
					extractComments: {
						condition: true,
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
						test: /[/\\]node_modules[/\\](antd|@ant-design)/,
						priority: 10,
					},
				},
			},
		},

		plugins: [
			new ContextReplacementPlugin(/moment[/\\]locale$/, /en|pt-br/),
			new CopyPlugin({
				patterns: [
					{
						from: 'media',
						to: 'media',
					},
				],
			}),
			new HtmlPlugin({
				inject: true,
				template: 'index.html',
			}),
			isProductionEnv &&
				new MiniCssExtractPlugin({
					filename: 'css/[name].css',
					chunkFilename: 'css/[name].chunk.css',
				}),
			new ForkTsCheckerPlugin({
				async: isDevelopmentEnv,
				silent: true,
			}),
		].filter(Boolean),

		module: {
			rules: [
				{
					enforce: 'pre',
					test: /\.tsx?$/,
					loader: require.resolve('eslint-loader'),
					options: {
						emitWarning: isDevelopmentEnv,
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
							test: /\.less$/,
							use: [
								...getBasicCssLoaders({ importLoaders: 1 }),
								{
									loader: require.resolve('less-loader'),
									options: {
										sourceMap: isProductionEnv,
										lessOptions: {
											javascriptEnabled: true,
										},
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
			extensions: ['.js', '.jsx', '.ts', '.tsx', '.html', '.json'],
			alias: {
				app: path.resolve(__dirname, 'app'),
			},
		},
	};
};
