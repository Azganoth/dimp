const { build } = require('electron-builder');
const webpack = require('webpack');
const { bold, cyan, green, red, yellow } = require('chalk');
const path = require('path');
const { promisify } = require('util');
const { promises: fs } = require('fs');

// throw unhandled rejections
process.on('unhandledRejection', (error) => {
	throw error;
});

process.env.NODE_ENV = 'production';

const webpackConfig = require('../webpack.config');

(async () => {
	await fs.rmdir(path.resolve(__dirname, '..', 'public'), { recursive: true });
	await fs.rmdir(path.resolve(__dirname, '..', 'dist'), { recursive: true });

	console.info(yellow('Creating a production build...'));

	const config = webpackConfig(process.env.NODE_ENV);

	try {
		const stats = await promisify(webpack)(config);

		const { time } = stats.toJson({
			all: false,
			timings: true,
		});

		if (stats.hasErrors()) {
			console.error(stats.toString({ all: false, errors: true }));
			console.info(red('\nBuild failed to compile.'));
		} else if (stats.hasWarnings()) {
			console.warn(stats.toString({ all: false, warnings: true }));
			console.info(
				yellow(`\nBuild compiled with warnings in ${bold(time)}ms. Resolve them to build distribution packages.`)
			);
		} else {
			console.info(green(`\nBuild successfully compiled in ${bold(time)}ms.`));

			console.info('\nBuilding distribution packages...');

			console.info(
				`\nBuilt packages: ${(await build(/* see 'build' at the package.json for build configuration */))
					.map((p) => cyan(path.basename(p)))
					.join(', ')}.`
			);
		}
	} catch (error) {
		console.info('\nThe compiler encountered an error.\n');
		throw error;
	}
})();
