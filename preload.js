const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getCsvData: (filename) => ipcRenderer.invoke('get_csv_data', filename),
    getTsvData: (filename) => ipcRenderer.invoke('get_tsv_data', filename),

    load_novel_data_from_address: (number, index) => ipcRenderer.invoke('load_novel_data_from_address', number, index),
    save_novel_data: (data) => ipcRenderer.invoke('save_novel_data', data),
    get_previous_translation_data: (title, index, author) => ipcRenderer.invoke('get_previous_translation_data', title, index, author),
});