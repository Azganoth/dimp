const { app, BrowserWindow } = require('electron')
const path = require('path')

let win
app.once('ready', () => {
	win = new BrowserWindow({
		width: 1600,
		height: 900,
		minWidth: 600,
		minHeight: 270,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true,
		},
		icon: path.resolve(__dirname, 'public/media/icon.ico'),
	})

	win.loadFile(path.resolve(__dirname, 'public/index.html'))

	win.once('closed', () => {
		win = undefined
	})
})

app.on('window-all-closed', () => {
	app.quit()
})

// remove when updating to electron 9
app.allowRendererProcessReuse = false
