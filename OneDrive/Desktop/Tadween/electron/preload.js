const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Auth
  login(username, password) {
    return ipcRenderer.invoke("auth:login", { username, password });
  },
  lock() {
    return ipcRenderer.invoke("session:lock");
  },
  onLocked(callback) {
    ipcRenderer.removeAllListeners("locked");
    ipcRenderer.on("locked", () => callback());
  },

  // Notes
  listNotes(opts = {}) {
    return ipcRenderer.invoke("notes:list", opts);
  },
  getNote(id) {
    return ipcRenderer.invoke("notes:get", { id });
  },
  createNote() {
    return ipcRenderer.invoke("notes:create");
  },
  updateNote(id, patch) {
    return ipcRenderer.invoke("notes:update", { id, patch });
  },
  pinNote(id, isPinned) {
    return ipcRenderer.invoke("notes:pin", { id, isPinned });
  },
  trashNote(id) {
    return ipcRenderer.invoke("notes:trash", { id });
  },
  restoreNote(id) {
    return ipcRenderer.invoke("notes:restore", { id });
  },
  deleteNote(id) {
    return ipcRenderer.invoke("notes:delete", { id });
  },
  searchNotes(query) {
    return ipcRenderer.invoke("notes:search", { query });
  },
  rebuildSearchIndex() {
    return ipcRenderer.invoke("notes:rebuild-index");
  },

  // Folders
  listFolders() {
    return ipcRenderer.invoke("folders:list");
  },
  createFolder(name, parentId) {
    return ipcRenderer.invoke("folders:create", { name, parentId });
  },
  renameFolder(id, name) {
    return ipcRenderer.invoke("folders:rename", { id, name });
  },
  deleteFolder(id) {
    return ipcRenderer.invoke("folders:delete", { id });
  },
  updateFolderColor(id, color) {
    return ipcRenderer.invoke("folders:updateColor", { id, color });
  },
  updateFolderParent(id, parentId) {
    return ipcRenderer.invoke("folders:updateParent", { id, parentId });
  },
  moveNoteToFolder(noteId, folderId) {
    return ipcRenderer.invoke("folders:moveNote", { noteId, folderId });
  },
  getFolderNoteCounts() {
    return ipcRenderer.invoke("folders:noteCounts");
  },

  // Speech
  listSpeechModels() {
    return ipcRenderer.invoke("speech:models");
  },
  getSpeechModelInfo() {
    return ipcRenderer.invoke("speech:model-info");
  },
  downloadSpeechModel(modelName) {
    return ipcRenderer.invoke("speech:download-model", { modelName });
  },
  onModelDownloadProgress(callback) {
    ipcRenderer.removeAllListeners("speech:download-progress");
    ipcRenderer.on("speech:download-progress", (_event, progress) => callback(progress));
  },
  transcribeAudio(audioBuffer) {
    // Convert ArrayBuffer to a plain array for safe IPC serialization
    const bytes = new Uint8Array(audioBuffer);
    return ipcRenderer.invoke("speech:transcribe-buffer", { audio: Array.from(bytes) });
  },

  // Settings
  getSetting(key) {
    return ipcRenderer.invoke("settings:get", key);
  },
  setSetting(key, value) {
    return ipcRenderer.invoke("settings:set", key, value);
  },
  getAllSettings() {
    return ipcRenderer.invoke("settings:getAll");
  },

  // Versions
  listVersions(noteId) {
    return ipcRenderer.invoke("versions:list", { noteId });
  },
  createVersion(noteId, title, encryptedContent, nonce) {
    return ipcRenderer.invoke("versions:create", { noteId, title, encryptedContent, nonce });
  },
  restoreVersion(versionId) {
    return ipcRenderer.invoke("versions:restore", { versionId });
  },
});
