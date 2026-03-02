import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import CameraScanner from '../src/components/CameraScanner';
import QRScanner from '../src/components/QRScanner';
import EnrollmentForm from '../src/components/EnrollmentForm';
import EnrollmentQR from '../src/components/EnrollmentQR';
import VerificationResult from '../src/components/VerificationResult';
import HomeScreen from '../src/components/HomeScreen';
import { matchEmbeddings } from '../src/services/biometric';
import { decompressVector } from '../src/services/compression';
import { decryptPayload } from '../src/services/encryption';

type Stage = 'home' | 'enrollInfo' | 'enrollPhoto' | 'showQr' | 'scanQr' | 'verifyCapture' | 'result';
type UserInfo = { name: string; mobile: string; email: string };

const MATCH_THRESHOLD = 0.85;

export default function Home() {
  const [stage, setStage] = useState<Stage>('home');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', mobile: '', email: '' });
  const [matchedUserInfo, setMatchedUserInfo] = useState<UserInfo | null>(null);
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
    setStage('home');
    setQrValue(null);
    setUserInfo({ name: '', mobile: '', email: '' });
    setMatchedUserInfo(null);
    setReferenceEmbedding(null);
    setManualPayload('');
    setScanError(null);
    setLastScore(null);
    setLastDistance(null);
    setLastDecision(null);
  };

  const parseQrPayload = (payload: string) => {
    console.log(`\n--- [Verification Process] ---`);
    const decryptedStr = decryptPayload(payload.trim());
    if (!decryptedStr) {
      setScanError('Failed to decrypt QR payload.');
      return;
    }

    let vector: number[] = [];
    let info: UserInfo | null = null;

    try {
      if (decryptedStr.startsWith('{')) {
        const parsed = JSON.parse(decryptedStr);
        info = {
          name: parsed.name || 'Unknown',
          mobile: parsed.mobile || '',
          email: parsed.email || '',
        };
        vector = decompressVector(parsed.bio);
      } else {
        vector = decompressVector(decryptedStr);
      }
    } catch (e) {
      setScanError('Failed to parse decrypted payload.');
      return;
    }

    if (vector.length === 0) {
      setScanError('Invalid biometric vector.');
      return;
    }

    setMatchedUserInfo(info);
    setReferenceEmbedding(vector);
    setScanError(null);
    setStage('verifyCapture');
  };

  const runVerification = (liveEmbedding: number[]) => {
    if (!referenceEmbedding) return;
    const result = matchEmbeddings(referenceEmbedding, liveEmbedding, MATCH_THRESHOLD);
    setLastScore(result.similarity);
    setLastDistance(result.distance);
    setLastDecision(result.isMatch);
    setStage('result');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {stage === 'home' && (
        <HomeScreen onGetStarted={() => setStage('enrollInfo')} />
      )}

      {stage === 'enrollInfo' && (
        <EnrollmentForm
          userInfo={userInfo}
          onUpdateUserInfo={setUserInfo}
          onContinue={() => setStage('enrollPhoto')}
        />
      )}

      {stage === 'enrollPhoto' && (
        <CameraScanner
          onResult={(data) => {
            setQrValue(data);
            setStage('showQr');
          }}
          metadata={userInfo}
        />
      )}

      {stage === 'showQr' && qrValue && (
        <EnrollmentQR
          qrValue={qrValue}
          manualPayload={manualPayload}
          onManualPayloadChange={setManualPayload}
          onUsePastedPayload={() => parseQrPayload(manualPayload)}
          onScanWithCamera={() => setStage('scanQr')}
          onStartOver={resetAll}
          scanError={scanError}
        />
      )}

      {stage === 'scanQr' && (
        <QRScanner
          onScanned={parseQrPayload}
          onCancel={() => setStage('showQr')}
        />
      )}

      {stage === 'verifyCapture' && (
        <CameraScanner
          onEmbedding={runVerification}
          buttonLabel="Capture Verification"
        />
      )}

      {stage === 'result' && lastDecision !== null && (
        <VerificationResult
          lastDecision={lastDecision}
          matchedUserInfo={matchedUserInfo}
          scorePercent={scorePercent}
          lastDistance={lastDistance}
          threshold={MATCH_THRESHOLD * 100}
          onReverify={() => setStage('verifyCapture')}
          onNewEnrollment={resetAll}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
});
