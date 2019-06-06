const { app, BrowserWindow } = require('electron')
const path = require("path");

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    }

  })
  var htmlPath = path.join("html", "index.html");
  // and load the index.html of the app.
  win.setMenu(null);
  win.loadFile(htmlPath);
}

app.on('ready', createWindow);