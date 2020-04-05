const builder = require('electron-builder')
const webpack = require('webpack')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')

const { guard, execute } = require('./utils/exe')
const webpackConfig = require('../webpack.config')

guard()

process.env.NODE_ENV = 'production'

const rootDir = fs.realpathSync(process.cwd())

const dist = async () => {
	const publicDir = path.join(rootDir, 'public')
	const distDir = path.join(rootDir, 'dist')
	await fs.emptyDir(publicDir)
	await fs.emptyDir(distDir)

	console.log(chalk`Creating a {yellow production} build...`)

	const compiler = webpack(webpackConfig(process.env.NODE_ENV))
	await new Promise((resolve, reject) => {
		compiler.run((error, stats) => {
			if (error) {
				console.log(chalk`\n{red.bold The compiler encountered an error.}`)
				return reject(error)
			}

			const info = stats.toJson({
				all: false,
				errors: true,
				warnings: true,
				timings: true,
			})

			if (stats.hasErrors()) {
				console.log(chalk`\n{red.bold Build failed to compile.}`)
				return reject(new Error(info.errors.join('\n\n')))
			}

			if (stats.hasWarnings()) {
				console.log(info.warnings.join('\n\n'))
				console.log(chalk`\n{yellow.bold Build compiled with warnings in {white ${info.time}ms}.}`)
			} else {
				console.log(chalk`\n{green.bold Build successfully compiled in {white ${info.time}ms}.}`)
			}

			return resolve()
		})
	})

	console.log(chalk`\nBuilding {green distribution} packages...`)

	const packagesBuilt = await builder.build(/* config is at package.json under 'build' */)
	console.log(`Packages built: ${packagesBuilt.map((f) => chalk.cyan(path.relative(distDir, f))).join(', ')}.`)
}

execute(dist)
