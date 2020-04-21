const path = require('path');
const { promises: fs } = require('fs');

// throw unhandled rejections
process.on('unhandledRejection', (error) => {
	throw error;
});

const OUTPUT_FOLDERS = ['public', 'dist'];

(async () => {
	await Promise.all(
		OUTPUT_FOLDERS.map(async (dirName) => {
			await fs.rmdir(path.resolve(__dirname, '..', dirName), { recursive: true });
		})
	);
})();
