const { BrowserWindow, app, shell } = require('electron');
const path = require('path');
const os = require('os');

let win;
app.once('ready', () => {
	win = new BrowserWindow({
		width: 1600,
		height: 900,
		minWidth: 600,
		minHeight: 270,
		useContentSize: true,
		autoHideMenuBar: true,
		icon: path.resolve(__dirname, `public/media/icon.${os.platform() === 'win32' ? 'ico' : 'png'}`),
		webPreferences: {
			enableRemoteModule: true,
			nodeIntegration: true,
		},
	});

	win.loadFile(path.resolve(__dirname, 'public/index.html'));

	// prevent links from loading inside the app
	win.webContents.on('will-navigate', (event, url) => {
		event.preventDefault();
		shell.openExternal(url);
	});

	win.once('closed', () => {
		win = undefined;
	});
});

app.on('window-all-closed', () => {
	app.quit();
});
