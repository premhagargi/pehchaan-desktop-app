import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (options: any) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options: any) => ipcRenderer.invoke('dialog:saveFile', options),
  getStorageDir: () => ipcRenderer.invoke('fs:getStorageDir'),
  writeFile: (filePath: string, content: any, encoding?: string) => ipcRenderer.invoke('fs:writeFile', filePath, content, encoding),
  readFile: (filePath: string, encoding?: string) => ipcRenderer.invoke('fs:readFile', filePath, encoding),
  readBuffer: (filePath: string) => ipcRenderer.invoke('fs:readBuffer', filePath),
  isDesktop: true,
});
