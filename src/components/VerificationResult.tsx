import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

type UserInfo = { name: string; mobile: string; email: string };

type Props = {
    lastDecision: boolean;
    matchedUserInfo: UserInfo | null;
    scorePercent: number | null;
    lastDistance: number | null;
    threshold: number;
    onReverify: () => void;
    onNewEnrollment: () => void;
};

export default function VerificationResult({
    lastDecision,
    matchedUserInfo,
    scorePercent,
    lastDistance,
    threshold,
    onReverify,
    onNewEnrollment,
}: Props) {
    return (
        <View style={styles.result}>
            <View style={styles.card}>
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                    {lastDecision ? (
                        <Feather name="check-circle" size={55} color="#16a34a" />
                    ) : (
                        <Feather name="x-circle" size={55} color="#dc2626" />
                    )}
                    <Text style={[styles.title, { color: lastDecision ? '#16a34a' : '#dc2626' }]}>
                        {lastDecision ? 'VERIFIED' : 'NOT MATCHED'}
                    </Text>
                </View>

                {lastDecision && matchedUserInfo && (
                    <Text style={styles.matchedName}>{matchedUserInfo.name}</Text>
                )}

                {lastDecision && matchedUserInfo?.mobile && (
                    <>
                        <Text style={styles.matchedSub}>Phone: {matchedUserInfo.mobile}</Text>
                        <Text style={styles.matchedSub}>Email: {matchedUserInfo.email}</Text>
                    </>
                )}

                <View style={{ height: 16 }} />

                <View style={styles.metricContainer}>
                    <Text style={styles.metricLabel}>Cosine Similarity</Text>
                    <Text style={styles.metricValue}>{scorePercent ?? '-'}%</Text>
                </View>
                <View style={styles.metricContainer}>
                    <Text style={styles.metricLabel}>Euclidean Distance</Text>
                    <Text style={styles.metricValue}>{lastDistance?.toFixed(4) ?? '-'}</Text>
                </View>
                <Text style={styles.caption}>Threshold: {threshold.toFixed(1)}%</Text>

                <View style={{ marginTop: 12, width: '100%' }}>
                    <TouchableOpacity style={styles.button} onPress={onReverify}>
                        <Text style={styles.buttonText}>Re-verify</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonSecondary} onPress={onNewEnrollment}>
                        <Text style={styles.buttonTextSecondary}>New Enrollment</Text>
                    </TouchableOpacity>
                </View>
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
    matchedName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 4,
    },
    matchedSub: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 18,
        includeFontPadding: true,
    },
});
