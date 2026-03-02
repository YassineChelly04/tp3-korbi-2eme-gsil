const path = require("path");
const fs = require("fs");
const os = require("os");
const { app } = require("electron");

/**
 * WhisperService — Local speech-to-text using Whisper.cpp
 *
 * Models are stored in: %APPDATA%/Tadween/models/
 * Supported models: tiny (75MB), base (142MB), small (466MB), medium (1.5GB)
 *
 * NOTE: Requires whisper-node package to be installed for actual transcription.
 * This service gracefully degrades if whisper-node is not available.
 */

const MODELS_DIR = app ? path.join(app.getPath("userData"), "models") : path.join(process.cwd(), "models");

// Minimum expected file sizes (bytes) for integrity checks
const MODEL_INFO = {
  tiny:   { file: "ggml-tiny.bin",   size: "75 MB",   sizeBytes: 75_000_000,   url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin" },
  base:   { file: "ggml-base.bin",   size: "142 MB",  sizeBytes: 142_000_000,  url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin" },
  small:  { file: "ggml-small.bin",  size: "466 MB",  sizeBytes: 466_000_000,  url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin" },
  medium: { file: "ggml-medium.bin", size: "1.5 GB",  sizeBytes: 1_500_000_000, url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin" },
};

let whisperModule = null;
let currentModel = null;

function ensureModelsDir() {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }
}

function getModelPath(modelName) {
  const info = MODEL_INFO[modelName];
  if (!info) return null;
  return path.join(MODELS_DIR, info.file);
}

function isModelAvailable(modelName) {
  const modelPath = getModelPath(modelName);
  return modelPath && fs.existsSync(modelPath);
}

function listAvailableModels() {
  ensureModelsDir();
  return Object.entries(MODEL_INFO).map(([name, info]) => ({
    name,
    file: info.file,
    size: info.size,
    available: isModelAvailable(name),
    path: getModelPath(name),
  }));
}

async function loadWhisperModule() {
  if (whisperModule) return whisperModule;
  try {
    whisperModule = require("whisper-node");
    return whisperModule;
  } catch {
    console.warn("[Whisper] whisper-node not installed. Speech-to-text unavailable.");
    return null;
  }
}

/**
 * Download a Whisper GGML model from Hugging Face.
 * @param {string} modelName - One of: tiny, base, small, medium
 * @param {(progress: {percent: number, downloadedBytes: number, totalBytes: number}) => void} onProgress
 * @returns {Promise<string>} Path to the downloaded model file
 */
async function downloadModel(modelName, onProgress) {
  const info = MODEL_INFO[modelName];
  if (!info) {
    throw new Error(`Unknown model '${modelName}'. Available: ${Object.keys(MODEL_INFO).join(", ")}`);
  }

  ensureModelsDir();

  const destPath = path.join(MODELS_DIR, info.file);
  const tempPath = destPath + ".download";

  // If already downloaded and valid, skip
  if (fs.existsSync(destPath)) {
    const stat = fs.statSync(destPath);
    if (stat.size >= info.sizeBytes * 0.9) {
      if (onProgress) onProgress({ percent: 100, downloadedBytes: stat.size, totalBytes: stat.size });
      return destPath;
    }
    // Incomplete file, remove and re-download
    fs.unlinkSync(destPath);
  }

  // Clean up any previous partial download
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }

  // Use dynamic import for the built-in https/http modules (follow redirects)
  const { net } = require("electron");

  return new Promise((resolve, reject) => {
    const request = net.request(info.url);

    request.on("response", (response) => {
      // Handle redirects (net module follows them automatically)
      if (response.statusCode >= 400) {
        reject(new Error(`Download failed: HTTP ${response.statusCode}`));
        return;
      }

      const totalBytes = parseInt(response.headers["content-length"] || "0", 10) || info.sizeBytes;
      let downloadedBytes = 0;
      const writeStream = fs.createWriteStream(tempPath);

      response.on("data", (chunk) => {
        writeStream.write(chunk);
        downloadedBytes += chunk.length;
        if (onProgress) {
          const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
          onProgress({ percent, downloadedBytes, totalBytes });
        }
      });

      response.on("end", () => {
        writeStream.end(() => {
          // Verify file integrity: check file size is reasonable (>= 90% of expected)
          const stat = fs.statSync(tempPath);
          if (stat.size < info.sizeBytes * 0.9) {
            fs.unlinkSync(tempPath);
            reject(new Error(
              `Downloaded file is too small (${stat.size} bytes, expected ~${info.sizeBytes}). Download may be corrupted.`
            ));
            return;
          }

          fs.renameSync(tempPath, destPath);
          resolve(destPath);
        });
      });

      response.on("error", (err) => {
        writeStream.destroy();
        try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
        reject(new Error(`Download error: ${err.message}`));
      });
    });

    request.on("error", (err) => {
      try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
      reject(new Error(`Request failed: ${err.message}`));
    });

    request.end();
  });
}

/**
 * Transcribe an audio file using Whisper.cpp.
 * @param {string} audioPath - Path to 16kHz mono WAV file
 * @param {object} options
 * @param {string} [options.model='base'] - Model name
 * @param {string} [options.language='auto'] - Language code or 'auto'
 * @param {boolean} [options.translate=false] - Translate to English
 * @param {number} [options.threads] - Number of CPU threads (default: cpus - 1)
 * @returns {Promise<{text: string, language: string, segments: Array<{start: number, end: number, text: string}>}>}
 */
async function transcribe(audioPath, options = {}) {
  const whisper = await loadWhisperModule();
  if (!whisper) {
    throw new Error("Speech-to-text is not available. Install whisper-node to enable this feature.");
  }

  const modelName = options.model || "base";
  if (!isModelAvailable(modelName)) {
    throw new Error(`Model '${modelName}' is not downloaded. Please download it from Settings.`);
  }

  const modelPath = getModelPath(modelName);
  const language = options.language || "auto";
  const translate = options.translate || false;
  const threads = options.threads || Math.max(1, os.cpus().length - 1);

  try {
    const whisperFn = whisper.whisper || whisper.default || whisper;
    const result = await whisperFn(audioPath, {
      modelPath,
      language: language === "auto" ? undefined : language,
      word_timestamps: true,
      translate,
      threads,
    });

    // Parse result into structured format
    const segments = [];
    let fullText = "";
    let detectedLanguage = language === "auto" ? "unknown" : language;

    if (Array.isArray(result)) {
      for (const seg of result) {
        const text = (seg.speech || seg.text || "").trim();
        if (!text) continue;

        segments.push({
          start: seg.start != null ? seg.start : 0,
          end: seg.end != null ? seg.end : 0,
          text,
        });
      }
      fullText = segments.map((s) => s.text).join(" ");

      // Some whisper-node versions include language in result metadata
      if (result.language) detectedLanguage = result.language;
    } else if (typeof result === "string") {
      fullText = result.trim();
      segments.push({ start: 0, end: 0, text: fullText });
    } else if (result && typeof result === "object") {
      fullText = (result.text || result.speech || "").trim();
      if (result.language) detectedLanguage = result.language;
      if (result.segments && Array.isArray(result.segments)) {
        for (const seg of result.segments) {
          segments.push({
            start: seg.start || 0,
            end: seg.end || 0,
            text: (seg.text || seg.speech || "").trim(),
          });
        }
      } else {
        segments.push({ start: 0, end: 0, text: fullText });
      }
    }

    return { text: fullText, language: detectedLanguage, segments };
  } catch (err) {
    throw new Error(`Transcription failed: ${err.message}`);
  }
}

/**
 * Get information about all available models and their download status.
 * @returns {Array<{name: string, file: string, size: string, sizeBytes: number, available: boolean, path: string}>}
 */
function getModelInfo() {
  ensureModelsDir();
  return Object.entries(MODEL_INFO).map(([name, info]) => {
    const modelPath = getModelPath(name);
    const available = isModelAvailable(name);
    let downloadedSize = 0;
    if (available) {
      try { downloadedSize = fs.statSync(modelPath).size; } catch { /* ignore */ }
    }
    return {
      name,
      file: info.file,
      size: info.size,
      sizeBytes: info.sizeBytes,
      available,
      downloadedSize,
      path: modelPath,
    };
  });
}

module.exports = {
  listAvailableModels,
  isModelAvailable,
  transcribe,
  downloadModel,
  getModelInfo,
  getModelPath,
  MODEL_INFO,
  MODELS_DIR,
};
