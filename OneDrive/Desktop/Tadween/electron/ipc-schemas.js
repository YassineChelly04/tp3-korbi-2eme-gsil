const { z } = require("zod");

// Auth schemas
const LoginSchema = z.object({
  password: z.string().min(1),
  firstLaunch: z.boolean(),
});

// Notes schemas
const ListNotesSchema = z.object({
  filter: z.enum(["all", "pinned", "trash"]).default("all"),
  folderId: z.number().nullable().optional(),
}).optional().default({});

const GetNoteSchema = z.object({
  id: z.number().int().positive(),
});

const UpdateNoteSchema = z.object({
  id: z.number().int().positive(),
  patch: z.object({
    title: z.string().optional(),
    content: z.any().optional(),
  }),
});

const PinNoteSchema = z.object({
  id: z.number().int().positive(),
  isPinned: z.boolean(),
});

const NoteIdSchema = z.object({
  id: z.number().int().positive(),
});

// Folders schemas
const CreateFolderSchema = z.object({
  name: z.string().min(1).max(100),
});

const RenameFolderSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
});

const FolderIdSchema = z.object({
  id: z.number().int().positive(),
});

const SearchNotesSchema = z.object({
  query: z.string().min(1).max(500),
});

// Versions schemas
const ListVersionsSchema = z.object({
  noteId: z.number().int().positive(),
});

const CreateVersionSchema = z.object({
  noteId: z.number().int().positive(),
  title: z.string(),
  encryptedContent: z.string(),
  nonce: z.string(),
});

const RestoreVersionSchema = z.object({
  versionId: z.number().int().positive(),
});

module.exports = {
  LoginSchema,
  ListNotesSchema,
  GetNoteSchema,
  UpdateNoteSchema,
  PinNoteSchema,
  NoteIdSchema,
  CreateFolderSchema,
  RenameFolderSchema,
  FolderIdSchema,
  SearchNotesSchema,
  ListVersionsSchema,
  CreateVersionSchema,
  RestoreVersionSchema,
};
