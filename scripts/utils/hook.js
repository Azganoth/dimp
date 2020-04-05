const electron = require('electron')

// reloads all electron windows
const reload = () => {
	for (const win of electron.BrowserWindow.getAllWindows()) {
		win.webContents.reloadIgnoringCache()
	}
}

process.on('message', (msg) => {
	if (msg === 'reload') {
		return reload()
	}
})
