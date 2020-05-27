const { cyan } = require('chalk');
const path = require('path');
const { promises: fs } = require('fs');

// throw unhandled rejections
process.on('unhandledRejection', (error) => {
	throw error;
});

const OUTPUT_DIRS = ['public', 'dist'];

(async () => {
	console.info('🧹', cyan(`Deleting output directories (${OUTPUT_DIRS.join(', ')})`));

	await Promise.all(
		OUTPUT_DIRS.map(async (dirName) => {
			await fs.rmdir(path.resolve(__dirname, `../${dirName}`), { recursive: true });
		})
	);
})();
