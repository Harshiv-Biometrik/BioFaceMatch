import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import CameraScanner from '../src/components/CameraScanner';
import QRScanner from '../src/components/QRScanner';
import { matchEmbeddings } from '../src/services/biometric';
import { decompressVector } from '../src/services/compression';
import { decryptPayload } from '../src/services/encryption';
type Stage = 'enroll' | 'showQr' | 'scanQr' | 'verifyCapture' | 'result';

const MATCH_THRESHOLD = 0.78;

export default function Home() {
  const [stage, setStage] = useState<Stage>('enroll');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [referenceEmbedding, setReferenceEmbedding] = useState<number[] | null>(null);
  const [manualPayload, setManualPayload] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [lastDecision, setLastDecision] = useState<boolean | null>(null);

  const scorePercent = useMemo(() => {
    if (lastScore == null) return null;
    return Math.max(0, Math.min(100, Math.round(lastScore * 10000) / 100));
  }, [lastScore]);

  const resetAll = () => {
    setStage('enroll');
    setQrValue(null);
    setReferenceEmbedding(null);
    setManualPayload('');
    setScanError(null);
    setLastScore(null);
    setLastDistance(null);
    setLastDecision(null);
  };

  const parseQrPayload = (payload: string) => {
    console.log(`\n--- [Verification Process] ---`);
    console.log(`1. Scanned QR Encrypted Payload (Length: ${payload.trim().length})`);
    console.log(`   Preview: ${payload.trim().slice(0, 30)}...`);

    const decryptedStr = decryptPayload(payload.trim());
    if (!decryptedStr) {
      console.log(`[Scan Error] Failed to decrypt QR payload.`);
      setScanError('Failed to decrypt QR payload. Ensure key is correct.');
      return;
    }

    console.log(`2. Decrypted Base64 String (Length: ${decryptedStr.length})`);
    console.log(`   Preview: ${decryptedStr.slice(0, 30)}...`);

    const vector = decompressVector(decryptedStr);
    console.log(`3. Decompressed Vector Length: ${vector.length}`);
    if (vector.length === 0) {
      console.log(`[Scan Error] Invalid QR payload. Unable to decode biometric vector.`);
      setScanError('Invalid QR payload. Unable to decode biometric vector.');
      return;
    }

    console.log(`   Sample: [${vector.slice(0, 3).map(n => n.toFixed(4)).join(', ')}...]`);
    console.log(`------------------------------\n`);

    setReferenceEmbedding(vector);
    setScanError(null);
    setStage('verifyCapture');
  };

  const runVerification = (liveEmbedding: number[]) => {
    console.log(`[Verification] Captured live embedding. Length: ${liveEmbedding.length}`);
    if (!referenceEmbedding || referenceEmbedding.length === 0) {
      console.log(`[Verification] Missing reference embedding!`);
      return;
    }
    const result = matchEmbeddings(referenceEmbedding, liveEmbedding, MATCH_THRESHOLD);
    setLastScore(result.similarity);
    setLastDistance(result.distance);
    setLastDecision(result.isMatch);
    setStage('result');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Biometric QR Pass' }} />
      {stage === 'enroll' ? <CameraScanner onResult={(data) => {
        setQrValue(data);
        setStage('showQr');
      }}
        buttonLabel="Capture Enrollment"
      /> : null}

      {stage === 'showQr' && qrValue ? (
        <View style={styles.result}>
          <View style={styles.card}>
            <Text style={styles.title}>Enrollment QR</Text>
            <QRCode value={qrValue} size={250} />
            <Text style={styles.caption}>Scan this on verifier device, or paste payload below for local test.</Text>
            <TextInput
              style={styles.input}
              value={manualPayload}
              onChangeText={setManualPayload}
              placeholder="Paste scanned QR payload here"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.button} onPress={() => parseQrPayload(manualPayload)}>
              <Text style={styles.buttonText}>Use Pasted Payload</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => setStage('scanQr')}>
              <Text style={styles.buttonTextSecondary}>Scan QR with Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={resetAll}>
              <Text style={styles.buttonTextSecondary}>Start Over</Text>
            </TouchableOpacity>
            {scanError ? <Text style={styles.error}>{scanError}</Text> : null}
          </View>
        </View>
      ) : null}

      {stage === 'scanQr' ? <QRScanner onScanned={parseQrPayload} onCancel={() => setStage('showQr')} /> : null}

      {stage === 'verifyCapture' ? <CameraScanner
        onEmbedding={runVerification}
        buttonLabel="Capture Verification"
      /> : null}

      {stage === 'result' ? (
        <View style={styles.result}>
          <View style={styles.card}>
            <Text style={[styles.title, { color: lastDecision ? '#16a34a' : '#dc2626', marginBottom: 16 }]}>
              {lastDecision ? 'VERIFIED' : 'ACCESS DENIED'}
            </Text>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Cosine Similarity</Text>
              <Text style={styles.metricValue}>{scorePercent ?? '-'}%</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Euclidean Distance</Text>
              <Text style={styles.metricValue}>{lastDistance?.toFixed(4) ?? '-'}</Text>
            </View>
            <Text style={styles.caption}>Threshold: {(MATCH_THRESHOLD * 100).toFixed(1)}%</Text>

            <View style={{ marginTop: 12, width: '100%' }}>
              <TouchableOpacity style={styles.button} onPress={() => setStage('verifyCapture')}>
                <Text style={styles.buttonText}>Re-verify</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSecondary} onPress={resetAll}>
                <Text style={styles.buttonTextSecondary}>New Enrollment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  result: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 20 },
  card: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 24, color: '#0f172a', letterSpacing: 0.5 },
  caption: { marginTop: 16, color: '#64748b', textAlign: 'center', fontSize: 13, lineHeight: 18 },
  input: {
    width: '100%',
    marginTop: 24,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    fontSize: 15,
    color: '#334155',
  },
  button: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonSecondary: {
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  buttonTextSecondary: { color: '#475569', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  error: { marginTop: 16, color: '#ef4444', textAlign: 'center', fontWeight: '500', fontSize: 14 },

  metricContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricLabel: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  metricValue: { fontSize: 16, color: '#0f172a', fontWeight: '700' },
});
