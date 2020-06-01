const packager = require('electron-packager');
const { rebuild } = require('electron-rebuild');
const { exec } = require('child_process');
const webpack = require('webpack');
const { blue, bold, green, red, white, yellow } = require('chalk');
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
	console.info('⚙️', blue('Creating a production build'));

	await fs.rmdir(path.resolve(__dirname, '../build'), { recursive: true });
	await fs.rmdir(path.resolve(__dirname, '../dist'), { recursive: true });

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
			console.info(`${green(`Build successfully compiled in ${bold(buildTime)} at ${white(localizedBuiltAt)}`)}\n`);

			// create distribution packages
			await packager({
				dir: path.resolve(__dirname, '..'),
				out: path.resolve(__dirname, '../dist'),
				platform: ['darwin', 'linux', 'win32'],
				arch: 'all',
				icon: path.resolve(__dirname, '../build/media/icon'),
				afterCopy: [
					// cleanup package json
					async (buildPath, electronVersion, platform, arch, callback) => {
						const packageJson = JSON.parse(await fs.readFile(path.resolve(buildPath, 'package.json'), 'utf8'));

						delete packageJson.scripts;
						delete packageJson.devDependencies;

						await fs.writeFile(path.join(buildPath, 'package.json'), JSON.stringify(packageJson, null, 2));

						callback();
					},
					// install dependencies
					async (buildPath, electronVersion, platform, arch, callback) => {
						await promisify(exec)('npm install', { cwd: buildPath });

						callback();
					},
					// rebuild native node modules
					async (buildPath, electronVersion, platform, arch, callback) => {
						await rebuild({ buildPath, electronVersion, arch });

						callback();
					},
				],
				ignore: /^((?!\/package\.json|\/main\.js|\/build).)+/,
			});
		}
	} catch (error) {
		console.info('The compiler encountered an error.');
		throw error;
	}
})();
