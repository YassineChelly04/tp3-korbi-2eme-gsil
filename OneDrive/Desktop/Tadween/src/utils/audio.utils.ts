/**
 * Audio utilities for converting recorded audio to WAV format
 * compatible with Whisper.cpp (16kHz, mono, PCM 16-bit).
 */

const WHISPER_SAMPLE_RATE = 16000;

/**
 * Downsample a Float32Array audio buffer from one sample rate to another.
 * Uses linear interpolation for basic resampling.
 */
export function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }
  if (inputSampleRate < outputSampleRate) {
    throw new Error('Output sample rate must be less than or equal to input sample rate');
  }

  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, buffer.length - 1);
    const frac = srcIndex - low;
    result[i] = buffer[low] * (1 - frac) + buffer[high] * frac;
  }

  return result;
}

/**
 * Encode raw PCM float samples into a WAV file ArrayBuffer.
 * Output: PCM 16-bit little-endian WAV.
 */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = samples.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM samples (clamp to [-1, 1] then scale to 16-bit)
  let offset = headerLength;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Convert any audio Blob (e.g. audio/webm from MediaRecorder) to a
 * 16kHz mono WAV ArrayBuffer suitable for Whisper.cpp.
 *
 * Uses OfflineAudioContext for decoding and resampling.
 */
export async function convertBlobToWav(blob: Blob): Promise<ArrayBuffer> {
  const arrayBuffer = await blob.arrayBuffer();

  // Decode the audio data using an OfflineAudioContext at the target sample rate
  const audioCtx = new OfflineAudioContext(1, 1, WHISPER_SAMPLE_RATE);
  let audioBuffer: AudioBuffer;

  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    // Fallback: decode at original rate, then downsample manually
    const tempCtx = new OfflineAudioContext(1, 1, 44100);
    audioBuffer = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
  }

  // Extract mono channel (use first channel, mix down if stereo)
  let monoSamples: Float32Array;
  if (audioBuffer.numberOfChannels === 1) {
    monoSamples = audioBuffer.getChannelData(0);
  } else {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    monoSamples = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      monoSamples[i] = (left[i] + right[i]) / 2;
    }
  }

  // Downsample to 16kHz if needed
  const downsampled = downsampleBuffer(monoSamples, audioBuffer.sampleRate, WHISPER_SAMPLE_RATE);

  return encodeWav(downsampled, WHISPER_SAMPLE_RATE);
}
