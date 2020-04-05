const electron = require('electron')
const webpack = require('webpack')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')
const { spawn } = require('child_process')

const { guard, execute } = require('./utils/exe')
const config = require('../webpack.config')

guard()

process.env.NODE_ENV = 'development'

const rootDir = fs.realpathSync(process.cwd())

const start = async () => {
	const publicDir = path.join(rootDir, 'public')
	await fs.emptyDir(publicDir)

	console.log(chalk`Starting {magenta development} 'server', {cyan watching for changes}...`)

	const compiler = webpack(config(process.env.NODE_ENV))
	await new Promise((resolve, reject) => {
		let app
		let lastHash
		compiler.watch({}, (error, stats) => {
			if (error) {
				console.log(chalk`\n{red.bold The compiler encountered an error.}`)
				return reject(error)
			}

			const info = stats.toJson({
				all: false,
				hash: true,
				errors: true,
				warnings: true,
				builtAt: true,
				timings: true,
			})

			// ignore build if no changes are made
			if (lastHash === info.hash) {
				return
			}

			const builtAt = new Date(info.builtAt).toLocaleTimeString()

			if (stats.hasErrors()) {
				console.log(chalk`\n{red.bold Build failed to compile at ${builtAt}.}`)
				console.log(`\n${info.errors.join('\n\n')}`)
				return
			}

			if (stats.hasWarnings()) {
				console.log(chalk`\n{yellow.bold Build compiled with warnings in {white ${info.time}ms} at ${builtAt}.}`)
				console.log(`\n${info.warnings.join('\n\n')}`)
			} else {
				console.log(chalk`\n{green.bold Build successfully compiled in {white ${info.time}ms} at ${builtAt}.}`)
			}

			lastHash = info.hash

			if (app) {
				console.log('Reloading electron app to apply changes...')

				app.send('reload')
			} else {
				console.log('Initiating electron app...')

				app = spawn(electron, ['--require', path.resolve(__dirname, 'utils/hook.js'), '.'], {
					cwd: process.cwd(),
					stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
				})

				app.once('close', (code) => {
					process.exit(code)
				})
			}
		})
	})
}

execute(start)
