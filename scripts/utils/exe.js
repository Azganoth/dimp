const assert = require('assert')
const chalk = require('chalk')
const path = require('path')

const TERMINATE_SIGNALS = ['SIGINT', 'SIGTERM']

/**
 * Normalizes the script process to:
 * - exit process if the cwd isn't the app root
 * - throw unhandled rejections
 * - emit SIGINT on windows
 * - exit process on terminate signals
 */
exports.guard = () => {
	// checks if the cwd is at the app root, if it isn't log an error message and exit process
	if (path.basename(process.cwd()) !== 'dimp') {
		console.log(chalk.red.bold('Error: This script must be executed from the app root'))
		process.exit(1)
	}

	// makes the script crash on unhandled rejections
	process.on('unhandledRejection', (err) => {
		throw err
	})

	// emit SIGINT on windows...
	if (process.platform === 'win32') {
		require('readline')
			.createInterface({
				input: process.stdin,
				output: process.stdout,
			})
			.on('SIGINT', () => {
				process.emit('SIGINT')
			})
	}

	// exit process on terminate signals
	TERMINATE_SIGNALS.forEach((sig) => {
		process.on(sig, () => {
			console.log(chalk.yellow.bold('script interrupted'))
			process.exit()
		})
	})
}

/**
 * Executes a script and logs the result then exit the process.
 *
 * @param {Promise<void>} script - The script.
 */
exports.execute = async (script) => {
	assert.ok(script, 'missing `script`')
	assert.equal(typeof script, 'function', '`script` must be a function')

	try {
		await script()

		console.log(chalk`\n{green.bold finished '{white ${script.name}}' script}`)
	} catch (error) {
		console.log(`\n${error.message}`)
		console.log(chalk`\n{red.bold finished '{white ${script.name}}' script with errors}`)
		process.exit(1)
	}

	process.exit()
}
