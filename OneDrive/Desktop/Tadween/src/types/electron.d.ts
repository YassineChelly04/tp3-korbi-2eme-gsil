// ── Note Types ───────────────────────────────────────────────────
export interface NoteListItem {
  id: number;
  title: string;
  is_pinned: number;
  is_deleted: number;
  folder_id: number | null;
  created_at: string;
  updated_at: string;
  preview: string;
}

export interface NoteDetail {
  id: number;
  title: string;
  content: unknown;
  is_pinned: number;
}

export interface NotePatch {
  title?: string;
  content?: unknown;
}

export interface ListNotesOptions {
  filter?: "all" | "pinned" | "trash";
  folderId?: number | null;
}

// ── Folder Types ─────────────────────────────────────────────────
export interface Folder {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

// ── Speech Types ─────────────────────────────────────────────────
export interface SpeechModel {
  name: string;
  file: string;
  size: string;
  available: boolean;
  path: string;
}

export interface SpeechModelInfo {
  name: string;
  file: string;
  size: string;
  sizeBytes: number;
  available: boolean;
  downloadedSize: number;
  path: string;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  segments: TranscriptionSegment[];
}

export interface ModelDownloadProgress {
  modelName: string;
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
}

export interface ModelDownloadResult {
  success: boolean;
  path?: string;
  error?: string;
}

// ── Electron API ─────────────────────────────────────────────────
export interface ElectronAPI {
  // Auth
  login(password: string, firstLaunch: boolean): Promise<boolean>;
  lock(): Promise<boolean>;
  onLocked(callback: () => void): void;

  // Notes
  listNotes(opts?: ListNotesOptions): Promise<NoteListItem[]>;
  getNote(id: number): Promise<NoteDetail | null>;
  createNote(): Promise<NoteListItem>;
  updateNote(id: number, patch: NotePatch): Promise<boolean>;
  pinNote(id: number, isPinned: boolean): Promise<boolean>;
  trashNote(id: number): Promise<boolean>;
  restoreNote(id: number): Promise<boolean>;
  deleteNote(id: number): Promise<boolean>;

  // Folders
  listFolders(): Promise<Folder[]>;
  createFolder(name: string): Promise<Folder>;
  renameFolder(id: number, name: string): Promise<boolean>;
  deleteFolder(id: number): Promise<boolean>;

  // Speech
  listSpeechModels(): Promise<SpeechModel[]>;
  getSpeechModelInfo(): Promise<SpeechModelInfo[]>;
  downloadSpeechModel(modelName: string): Promise<ModelDownloadResult>;
  onModelDownloadProgress(callback: (progress: ModelDownloadProgress) => void): void;
  transcribeAudio(audioBuffer: ArrayBuffer): Promise<TranscriptionResult>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export {};
