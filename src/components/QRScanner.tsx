import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

type Props = {
  onScanned: (payload: string) => void;
  onCancel: () => void;
};

export default function QRScanner({ onScanned, onCancel }: Props) {
  const device = useCameraDevice('back');
  const lockedRef = useRef(false);

  const codeScanner = useCodeScanner(
    useMemo(
      () => ({
        codeTypes: ['qr'] as const,
        onCodeScanned: (codes) => {
          if (lockedRef.current) return;
          const value = codes.find((code) => typeof code.value === 'string' && code.value.length > 0)?.value;
          if (!value) return;
          lockedRef.current = true;
          onScanned(value);
        },
      }),
      [onScanned]
    )
  );

  useEffect(() => {
    lockedRef.current = false;
  }, []);

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading scanner camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive codeScanner={codeScanner} />
      <View style={styles.guide} pointerEvents="none" />
      <View style={styles.overlay}>
        <Text style={styles.text}>Point camera at the biometric QR</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  overlay: { position: 'absolute', left: 20, right: 20, bottom: 50, alignItems: 'center', gap: 16 },
  guide: {
    position: 'absolute',
    width: '75%',
    aspectRatio: 1,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderStyle: 'dashed',
    borderRadius: 24,
    alignSelf: 'center',
    top: '20%',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.4 },
});
