const { spawn } = require('child_process');
const electron = require('electron');
const webpack = require('webpack');
const { bold, green, magenta, red, yellow } = require('chalk');
const path = require('path');
const { promises: fs } = require('fs');

// throw unhandled rejections
process.on('unhandledRejection', (error) => {
	throw error;
});

process.env.NODE_ENV = 'development';

const webpackConfig = require('../webpack.config');

(async () => {
	await fs.rmdir(path.resolve(__dirname, '..', 'public'), { recursive: true });

	console.info(magenta('Starting development watcher...'));

	const config = webpackConfig(process.env.NODE_ENV);

	try {
		// Disabled because the watcher needs to be kept alive using a new promise
		// eslint-disable-next-line promise/avoid-new
		await new Promise((resolve, reject) => {
			let app;
			let lastHash;

			const watcher = webpack(config).watch({}, (error, stats) => {
				if (error) {
					reject(error);
				}

				const { hash, builtAt, time } = stats.toJson({
					all: false,
					hash: true,
					builtAt: true,
					timings: true,
				});

				// ignore build if no changes are made
				if (lastHash === hash) {
					return;
				}

				const localizedBuiltAt = new Date(builtAt).toLocaleTimeString();

				if (stats.hasErrors()) {
					console.error(stats.toString({ all: false, errors: true }));
					console.info(red('\nBuild failed to compile.'));
					return;
				}

				if (stats.hasWarnings()) {
					console.warn(stats.toString({ all: false, warnings: true }));
					console.info(yellow(`\nBuild compiled with warnings in ${bold(time)}ms at ${localizedBuiltAt}.`));
				} else {
					console.info(green(`\nBuild successfully compiled in ${bold(time)}ms at ${localizedBuiltAt}.`));
				}

				lastHash = hash;

				if (app) {
					app.send('reload');
				} else {
					app = spawn(electron, ['--require', path.resolve(__dirname, 'utils/electronHook.js'), '.'], {
						cwd: process.cwd(),
						stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
					});

					app.once('close', () => {
						app = null;
					});
				}
			});

			// close watcher and resolve on terminate signals
			['SIGINT', 'SIGTERM'].forEach((sig) => {
				process.on(sig, () => {
					watcher.close();
					resolve();
				});
			});
		});
	} catch (error) {
		console.info('\nThe compiler encountered an error.\n');
		throw error;
	}
})();
