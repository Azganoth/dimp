const webpack = require('webpack');
const { bold, green, red, white, yellow } = require('chalk');
const path = require('path');
const { promisify } = require('util');
const { promises: fs } = require('fs');

const webpackConfig = require('../webpack.config');

// throw unhandled rejections
process.on('unhandledRejection', (error) => {
	throw error;
});

process.env.NODE_ENV = 'production';

(async () => {
	console.info('⚙️', yellow('Creating a production build'));

	await fs.rmdir(path.resolve(__dirname, '../build'), { recursive: true });

	try {
		// compile a production build
		const stats = await promisify(webpack)(webpackConfig(process.env.NODE_ENV));

		const { builtAt, time } = stats.toJson({
			all: false,
			builtAt: true,
			timings: true,
		});

		const buildTime = time < 59990 ? `${((time % 60000) / 1000).toFixed(2)}s` : `${(time / 60000).toFixed(2)}m`;
		const localizedBuiltAt = new Date(builtAt).toLocaleTimeString();

		if (stats.hasErrors()) {
			console.error(stats.toString({ all: false, errors: true }));
			console.info(red(`Build failed to compile at ${white(localizedBuiltAt)}.`));
		} else if (stats.hasWarnings()) {
			console.warn(stats.toString({ all: false, warnings: true }));
			console.info(red(`Build failed to compile ${yellow('with warnings')} at ${white(localizedBuiltAt)}.`));
		} else {
			console.info(green(`Build successfully compiled in ${bold(buildTime)} at ${white(localizedBuiltAt)}.`));
		}
	} catch (error) {
		console.info('The compiler encountered an error.');
		throw error;
	}
})();
