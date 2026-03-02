import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import { compressVector } from '../services/compression';
import { encryptPayload } from '../services/encryption';

type Props = {
  onResult?: (payload: string) => void;
  onEmbedding?: (embedding: number[]) => void;
  buttonLabel?: string;
  metadata?: Record<string, any>;
};

const DEFAULT_MODEL_SIZE = 160;
const EMBEDDING_SIZE = 128;
const CENTER_CROP_RATIO = 0.85;

export default function CameraScanner({ onResult, onEmbedding, buttonLabel, metadata }: Props) {
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(cameraPosition);
  const { resize } = useResizePlugin();
  const shouldProcess = useSharedValue(false);
  const processingLock = useSharedValue(false);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [working, setWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tflite = useTensorflowModel(require('../../assets/facenet.tflite'), 'default');
  const model = tflite.state === 'loaded' ? tflite.model : undefined;

  const modelInput = useMemo(() => {
    const shape = model?.inputs?.[0]?.shape ?? [];
    let height = DEFAULT_MODEL_SIZE;
    let width = DEFAULT_MODEL_SIZE;

    // Supports both NHWC [1, h, w, 3] and NCHW [1, 3, h, w].
    if (shape.length >= 4) {
      const isChannelsLast = Number(shape[3]) === 3;
      const isChannelsFirst = Number(shape[1]) === 3;
      if (isChannelsLast) {
        height = Number(shape[1]);
        width = Number(shape[2]);
      } else if (isChannelsFirst) {
        height = Number(shape[2]);
        width = Number(shape[3]);
      }
    }

    return {
      width: Number.isFinite(width) && width > 0 ? width : DEFAULT_MODEL_SIZE,
      height: Number.isFinite(height) && height > 0 ? height : DEFAULT_MODEL_SIZE,
      dataType: model?.inputs?.[0]?.dataType ?? 'float32',
    };
  }, [model]);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const finalizeEmbedding = useRunOnJS(
    (embedding: number[]) => {
      console.log(`\n--- [Enrollment Process] ---`);
      console.log(`1. Raw Embedding Length: ${embedding.length} (${typeof embedding[0]})`);
      console.log(`   Sample: [${embedding.slice(0, 3).map(n => n.toFixed(4)).join(', ')}...]`);

      onEmbedding?.(embedding);
      if (!onResult) {
        setErrorMessage(null);
        setWorking(false);
        return;
      }

      const compressedBase64 = compressVector(embedding);
      if (!compressedBase64) {
        setErrorMessage('Failed to compress embedding payload.');
        setWorking(false);
        return;
      }

      console.log(`2. Compressed Base64 String (Length: ${compressedBase64.length})`);
      console.log(`   Preview: ${compressedBase64.slice(0, 30)}...`);

      const finalPayloadObj = metadata
        ? JSON.stringify({ ...metadata, bio: compressedBase64 })
        : compressedBase64;

      const encryptedPayload = encryptPayload(finalPayloadObj);
      if (!encryptedPayload) {
        setErrorMessage('Failed to encrypt embedding payload.');
        setWorking(false);
        return;
      }

      console.log(`3. Encrypted Payload (Length: ${encryptedPayload.length})`);
      console.log(`   Preview: ${encryptedPayload.slice(0, 30)}...`);
      console.log(`----------------------------\n`);

      setErrorMessage(null);
      setWorking(false);
      onResult(encryptedPayload); // Send the encrypted payload to the QR code
    },
    [onEmbedding, onResult, metadata]
  );

  const failInference = useRunOnJS(
    (message: string) => {
      setErrorMessage(message);
      setWorking(false);
    },
    []
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      if (model == null || !shouldProcess.value || processingLock.value) return;

      shouldProcess.value = false;
      processingLock.value = true;

      try {
        // Native face detection inside frame processors can be unstable on some Android builds.
        // Use a centered square crop as a robust fallback for capture-time inference.
        const cropSize = Math.max(
          1,
          Math.floor(Math.min(frame.width, frame.height) * CENTER_CROP_RATIO)
        );
        const cropX = Math.max(0, Math.floor((frame.width - cropSize) / 2));
        const cropY = Math.max(0, Math.floor((frame.height - cropSize) / 2));

        const resizeDataType = modelInput.dataType === 'float32' ? 'float32' : 'uint8';
        const resized = resize(frame, {
          crop: {
            x: cropX,
            y: cropY,
            width: cropSize,
            height: cropSize,
          },
          scale: {
            width: modelInput.width,
            height: modelInput.height,
          },
          pixelFormat: 'rgb',
          dataType: resizeDataType,
        });

        const inputTensor = resized as Uint8Array | Float32Array;

        const outputs = model.runSync([inputTensor]);
        if (outputs.length === 0) {
          failInference('Model returned no output tensor.');
          return;
        }

        const rawEmbedding = outputs[0] as Float32Array | Uint8Array;
        const embeddingLength = Math.min(rawEmbedding.length, EMBEDDING_SIZE);
        const embedding = new Array<number>(embeddingLength);
        for (let i = 0; i < embeddingLength; i += 1) {
          embedding[i] = rawEmbedding[i];
        }
        finalizeEmbedding(embedding);
      } catch (error) {
        failInference(String(error));
      } finally {
        processingLock.value = false;
      }
    },
    [model, modelInput.height, modelInput.width, processingLock, resize, shouldProcess]
  );

  const handleCapture = () => {
    if (!device || !hasPermission || model == null) return;

    setErrorMessage(null);
    setWorking(true);
    shouldProcess.value = true;
  };

  const toggleCamera = () => {
    setCameraPosition((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission is required.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.text}>Loading camera…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />

      <View style={styles.faceGuide} pointerEvents="none" />

      <View style={styles.overlay}>
        <Text style={styles.hint}>
          {tflite.state === 'error'
            ? `Model load failed: ${tflite.error.message}`
            : tflite.state === 'loaded'
              ? `Center your face and tap capture`
              : 'Loading FaceNet model...'}
        </Text>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <View style={styles.controlsRow}>
          <View style={styles.controlPlaceholder} />

          <TouchableOpacity
            style={[styles.captureButton, working && styles.buttonDisabled]}
            onPress={handleCapture}
            disabled={working || tflite.state !== 'loaded'}
          >
            <Ionicons
              name="radio-button-on-sharp"
              size={100}
              color={working ? "#94a3b8" : "#ffffff"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={toggleCamera}
            disabled={working}
          >
            <Ionicons name="camera-reverse-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  text: { color: '#f8fafc', marginTop: 12, fontSize: 16 },
  overlay: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 16,
  },
  faceGuide: {
    position: 'absolute',
    width: '80%',
    aspectRatio: 1,
    top: '20%',
    alignSelf: 'center',
    borderRadius: 999, // Perfect circle
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderStyle: 'dashed',
  },
  hint: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.4 },
  error: {
    color: '#fca5a5',
    textAlign: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 8,
    borderRadius: 8,
    overflow: 'hidden'
  },
  switchButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  controlPlaceholder: {
    width: 56, // Same as switchButton to keep captureButton centered
  },
});
