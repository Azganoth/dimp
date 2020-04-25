const { BrowserWindow, app, shell } = require('electron');
const path = require('path');

let win;
app.once('ready', () => {
	win = new BrowserWindow({
		width: 1600,
		height: 900,
		minWidth: 600,
		minHeight: 270,
		useContentSize: true,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true,
		},
		icon: path.resolve(__dirname, 'public/media/icon.ico'),
	});

	win.loadFile(path.resolve(__dirname, 'public/index.html'));

	// prevent links from loading inside the app
	win.webContents.on('will-navigate', (e, url) => {
		e.preventDefault();
		shell.openExternal(url);
	});

	win.once('closed', () => {
		win = undefined;
	});
});

app.on('window-all-closed', () => {
	app.quit();
});

// remove when updating to electron 9
app.allowRendererProcessReuse = false;
