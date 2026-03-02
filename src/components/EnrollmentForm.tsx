import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type UserInfo = { name: string; mobile: string; email: string };

type Props = {
    userInfo: UserInfo;
    onUpdateUserInfo: (info: UserInfo) => void;
    onContinue: () => void;
};

export default function EnrollmentForm({ userInfo, onUpdateUserInfo, onContinue }: Props) {
    return (
        <View style={styles.result}>
            <View style={styles.card}>
                <Text style={styles.title}>Personal Info</Text>
                <TextInput
                    style={styles.input}
                    value={userInfo.name}
                    onChangeText={(val) => onUpdateUserInfo({ ...userInfo, name: val })}
                    placeholder="Full Name"
                    placeholderTextColor="#94a3b8"
                />
                <TextInput
                    style={styles.input}
                    value={userInfo.mobile}
                    onChangeText={(val) => onUpdateUserInfo({ ...userInfo, mobile: val })}
                    placeholder="Mobile Number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                />
                <TextInput
                    style={styles.input}
                    value={userInfo.email}
                    onChangeText={(val) => onUpdateUserInfo({ ...userInfo, email: val })}
                    placeholder="Email Address"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    style={[styles.button, !userInfo.name && styles.buttonDisabled]}
                    onPress={onContinue}
                    disabled={!userInfo.name}
                >
                    <Text style={styles.buttonText}>Continue to Photo</Text>
                </TouchableOpacity>
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
    buttonDisabled: {
        opacity: 0.5,
        backgroundColor: '#94a3b8',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
});
