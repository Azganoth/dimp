const { spawn } = require('child_process');
const electron = require('electron');
const webpack = require('webpack');
const { bold, green, magenta, red, white, yellow } = require('chalk');
const path = require('path');
const { promises: fs } = require('fs');

const webpackConfig = require('../webpack.config');

// throw unhandled rejections
process.on('unhandledRejection', (error) => {
	throw error;
});

process.env.NODE_ENV = 'development';

(async () => {
	await fs.rmdir(path.resolve(__dirname, '../public'), { recursive: true });

	console.info('🚀', magenta('Starting development server'));

	try {
		// Disabled because the watcher needs to be kept alive
		// eslint-disable-next-line promise/avoid-new
		await new Promise((resolve, reject) => {
			let app;
			let lastHash;

			// compile a development build and watch for changes
			const watcher = webpack(webpackConfig(process.env.NODE_ENV)).watch({}, (error, stats) => {
				if (error) {
					reject(error);
				}

				const { hash, builtAt, time } = stats.toJson({
					all: false,
					builtAt: true,
					hash: true,
					timings: true,
				});

				// ignore build if no changes are made
				if (lastHash === hash) {
					return;
				}

				const buildTime = time < 59990 ? `${((time % 60000) / 1000).toFixed(2)}s` : `${(time / 60000).toFixed(2)}m`;
				const localizedBuiltAt = new Date(builtAt).toLocaleTimeString();

				if (stats.hasErrors()) {
					console.error(stats.toString({ all: false, errors: true }));
					console.info(red(`Build failed to compile at ${white(localizedBuiltAt)}.`));
					return;
				}

				if (stats.hasWarnings()) {
					console.warn(stats.toString({ all: false, warnings: true }));
					console.info(yellow(`Build compiled with warnings in ${bold(buildTime)} at ${white(localizedBuiltAt)}.`));
				} else {
					console.info(green(`Build successfully compiled in ${bold(buildTime)} at ${white(localizedBuiltAt)}.`));
				}

				lastHash = hash;

				if (app) {
					// reload all opened electron windows
					app.send('reload');
				} else {
					// start the electron app
					app = spawn(electron, ['--require', path.resolve(__dirname, 'utils/electronHook.js'), '.'], {
						stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
					});

					app.once('close', () => {
						app = undefined;
					});
				}
			});

			// cleanup process on terminate signals
			['SIGINT', 'SIGTERM'].forEach((sig) => {
				process.on(sig, () => {
					if (app && !app.killed) {
						app.kill(sig);
					}
					watcher.close();
					resolve();
				});
			});
		});
	} catch (error) {
		console.info('The compiler encountered an error.');
		throw error;
	}
})();
