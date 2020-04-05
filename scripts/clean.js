const assert = require('assert')
const fs = require('fs-extra')

const { guard, execute } = require('./utils/exe')

guard()

/**
 * Deletes a directory.
 *
 * @param {string} path - The directory path.
 * @returns {Promise<string>} The operation result.
 */
const deldir = async (dirPath) => {
	assert.ok(dirPath, 'missing `path`')
	assert.strictEqual(typeof dirPath, 'string', '`path` should be a string')

	const exists = await fs.pathExists(dirPath)

	await fs.remove(dirPath)

	return exists
		? `'${dirPath}' directory was deleted`
		: `'${dirPath}' directory wasn't deleted cuz the path don't exist`
}

const clean = async () => {
	console.log(await deldir('public'))
	console.log(await deldir('dist'))
}

execute(clean)
