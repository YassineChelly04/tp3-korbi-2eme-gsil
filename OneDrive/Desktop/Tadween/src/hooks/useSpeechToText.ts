import { useState, useRef, useCallback, useEffect } from 'react';
import { convertBlobToWav } from '../utils/audio.utils';

export type SpeechState =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'processing'
  | 'transcribing'
  | 'done'
  | 'error';

export interface UseSpeechToTextResult {
  state: SpeechState;
  transcript: string;
  error: string | null;
  duration: number;
  startRecording: () => void;
  stopRecording: () => void;
}

/**
 * Custom hook for the full speech-to-text recording pipeline.
 *
 * Flow: idle → requesting-permission → recording → processing → transcribing → done
 * On error at any stage, transitions to 'error' with a message.
 */
export function useSpeechToText(): UseSpeechToTextResult {
  const [state, setState] = useState<SpeechState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmountedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      cleanupRecording();
    };
  }, []);

  function cleanupRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
  }

  const startRecording = useCallback(() => {
    if (state === 'recording' || state === 'processing' || state === 'transcribing') {
      return;
    }

    setError(null);
    setTranscript('');
    setDuration(0);
    setState('requesting-permission');

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      .then((stream) => {
        if (unmountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        chunksRef.current = [];

        // Pick a supported MIME type
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : '';

        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          handleRecordingComplete();
        };

        recorder.onerror = () => {
          if (!unmountedRef.current) {
            setError('Recording failed unexpectedly');
            setState('error');
          }
          cleanupRecording();
        };

        recorder.start(250);
        setState('recording');

        // Start duration timer
        timerRef.current = setInterval(() => {
          if (!unmountedRef.current) {
            setDuration((d) => d + 1);
          }
        }, 1000);
      })
      .catch((err: Error) => {
        if (!unmountedRef.current) {
          const message =
            err.name === 'NotAllowedError'
              ? 'Microphone access denied. Please allow microphone access in your system settings.'
              : `Microphone error: ${err.message}`;
          setError(message);
          setState('error');
        }
      });
  }, [state]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  async function handleRecordingComplete() {
    // Stop timer and stream
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const chunks = chunksRef.current;
    chunksRef.current = [];

    if (chunks.length === 0) {
      if (!unmountedRef.current) setState('idle');
      return;
    }

    try {
      // Convert recorded audio to WAV
      if (!unmountedRef.current) setState('processing');
      const blob = new Blob(chunks, { type: chunks[0].type || 'audio/webm' });
      const wavBuffer = await convertBlobToWav(blob);

      if (unmountedRef.current) return;

      // Send to main process for Whisper transcription
      setState('transcribing');
      const text: string = await window.api.transcribeAudio(wavBuffer);

      if (unmountedRef.current) return;

      setTranscript(text);
      setState('done');
    } catch (err) {
      if (!unmountedRef.current) {
        setError(err instanceof Error ? err.message : 'Transcription failed');
        setState('error');
      }
    }
  }

  return { state, transcript, error, duration, startRecording, stopRecording };
}
