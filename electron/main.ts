import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs-extra';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Pehchaan — Bulk ID Card & Document Generator',
    backgroundColor: '#020617',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true, // Secure mode enabled, using custom protocol
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  protocol.handle('pehchaan', (request) => {
    const urlPath = request.url.replace('pehchaan://', '');
    const userDir = app.getPath('userData');
    const fullPath = path.join(userDir, 'pehchaan-data', decodeURIComponent(urlPath));
    return net.fetch('file:///' + fullPath);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('dialog:openFile', async (_, options) => {
  return await dialog.showOpenDialog(mainWindow!, options);
});

ipcMain.handle('dialog:saveFile', async (_, options) => {
  return await dialog.showSaveDialog(mainWindow!, options);
});

ipcMain.handle('fs:getStorageDir', () => {
  const userDir = app.getPath('userData');
  const storageDir = path.join(userDir, 'pehchaan-data');
  fs.ensureDirSync(storageDir);
  return storageDir;
});

ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string | Buffer, encoding?: string) => {
  await fs.ensureDir(path.dirname(filePath));
  if (encoding) {
    await fs.writeFile(filePath, content, encoding as BufferEncoding);
  } else {
    await fs.writeFile(filePath, content);
  }
  return true;
});

ipcMain.handle('fs:readFile', async (_, filePath: string, encoding?: string) => {
  if (encoding === 'base64') {
    const buf = await fs.readFile(filePath);
    return buf.toString('base64');
  }
  return await fs.readFile(filePath, (encoding as BufferEncoding) || 'utf-8');
});

ipcMain.handle('fs:readBuffer', async (_, filePath: string) => {
  const buf = await fs.readFile(filePath);
  return buf.buffer;
});
