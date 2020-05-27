const electron = require('electron');

/**
 * Reloads all opened electron windows.
 */
const reload = () => {
	electron.BrowserWindow.getAllWindows().forEach((win) => {
		win.webContents.reloadIgnoringCache();
	});
};

process.on('message', (msg) => {
	if (msg === 'reload') {
		return reload();
	}
});
