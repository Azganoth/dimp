const contextMenu = require('electron-context-menu');
const { BrowserWindow, app, shell } = require('electron');
const path = require('path');

if (process.platform === 'win32' && !process.env.OPENCV4NODEJS_DISABLE_AUTOBUILD) {
	// Disabled because the module is required or not depending on a condition
	// eslint-disable-next-line global-require
	process.env.path += `;${require('./node_modules/opencv-build').opencvBinDir}`;
}

contextMenu();

let win;
const createWindow = () => {
	win = new BrowserWindow({
		width: 1366,
		height: 768,
		minWidth: 600,
		minHeight: 270,
		useContentSize: true,
		autoHideMenuBar: true,
		icon: path.resolve(__dirname, `build/media/icon.${process.platform === 'win32' ? 'ico' : 'png'}`),
		webPreferences: {
			enableRemoteModule: true,
			nodeIntegration: true,
		},
	});

	win.loadFile(path.resolve(__dirname, 'build/index.html'));

	// prevent links from loading inside the app
	win.webContents.on('will-navigate', (event, url) => {
		event.preventDefault();
		shell.openExternal(url);
	});

	win.on('closed', () => {
		win = undefined;
	});
};

app.on('ready', () => {
	createWindow();
});

app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

app.allowRendererProcessReuse = false;
