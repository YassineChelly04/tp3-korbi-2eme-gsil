const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Auth
  login(password, firstLaunch) {
    return ipcRenderer.invoke("auth:login", { password, firstLaunch });
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
  createFolder(name) {
    return ipcRenderer.invoke("folders:create", { name });
  },
  renameFolder(id, name) {
    return ipcRenderer.invoke("folders:rename", { id, name });
  },
  deleteFolder(id) {
    return ipcRenderer.invoke("folders:delete", { id });
  },

  // Speech
  listSpeechModels() {
    return ipcRenderer.invoke("speech:models");
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
