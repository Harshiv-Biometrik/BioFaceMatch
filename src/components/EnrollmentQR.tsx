import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type Props = {
    qrValue: string;
    manualPayload: string;
    onManualPayloadChange: (val: string) => void;
    onUsePastedPayload: () => void;
    onScanWithCamera: () => void;
    onStartOver: () => void;
    scanError: string | null;
};

export default function EnrollmentQR({
    qrValue,
    manualPayload,
    onManualPayloadChange,
    onUsePastedPayload,
    onScanWithCamera,
    onStartOver,
    scanError,
}: Props) {
    return (
        <View style={styles.result}>
            <View style={styles.card}>
                <Text style={styles.title}>Enrollment QR</Text>
                <QRCode value={qrValue} size={250} />
                <Text style={styles.caption}>Scan this on verifier device, or paste payload below for local test.</Text>
                <TextInput
                    style={styles.input}
                    value={manualPayload}
                    onChangeText={onManualPayloadChange}
                    placeholder="Paste scanned QR payload here"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity style={styles.button} onPress={onUsePastedPayload}>
                    <Text style={styles.buttonText}>Use Pasted Payload</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonSecondary} onPress={onScanWithCamera}>
                    <Text style={styles.buttonTextSecondary}>Scan QR with Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonSecondary} onPress={onStartOver}>
                    <Text style={styles.buttonTextSecondary}>Start Over</Text>
                </TouchableOpacity>
                {scanError ? <Text style={styles.error}>{scanError}</Text> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    title: { fontSize: 26, fontWeight: '800', marginBottom: 24, color: '#0f172a', letterSpacing: 0.5 },
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
        backgroundColor: '#4F46E5',
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#4F46E5',
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
        borderColor: '#e2e8f0',
    },
    buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
    buttonTextSecondary: { color: '#475569', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
    error: { marginTop: 16, color: '#ef4444', textAlign: 'center', fontWeight: '500', fontSize: 14 },
});
