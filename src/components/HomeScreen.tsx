import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type * as ExpoLocation from 'expo-location';

type Props = {
    onGetStarted: () => void;
};

export default function HomeScreen({ onGetStarted }: Props) {
    const [location, setLocation] = useState<ExpoLocation.LocationObject | null>(null);
    const [currentAddress, setCurrentAddress] = useState<ExpoLocation.LocationGeocodedAddress | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function getCurrentLocation() {
            try {
                const Location = await import('expo-location');
                if (typeof Location.requestForegroundPermissionsAsync !== 'function') {
                    setErrorMsg("Location module is not linked in this build. Reinstall the Android app.");
                    return;
                }
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    setErrorMsg("Permission to access location was denied");
                    return;
                }
                let loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);

                if (loc) {
                    const { latitude, longitude } = loc.coords;
                    const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
                    if (addressResponse.length > 0) {
                        setCurrentAddress(addressResponse[0]);
                    }
                }
            } catch (error) {
                setErrorMsg("Location module is unavailable. Rebuild the app to enable location.");
                console.error(error);
            }
        }
        getCurrentLocation();
    }, []);

    let displayAddress = 'Locating you...';
    if (errorMsg) {
        displayAddress = errorMsg;
    } else if (currentAddress) {
        // Format a readable address string
        const { streetNumber, street, city, region, postalCode, country } = currentAddress;
        displayAddress = [streetNumber, street, city, region, postalCode, country]
            .filter(Boolean)
            .join(', ');
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.content}>
                <View style={styles.heroSection}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="shield-checkmark" size={80} color="#4F46E5" />
                    </View>
                    <Text style={styles.title}>BiofaceMatch</Text>
                    <Text style={styles.subtitle}>
                        Secure Identity Verification using Face Recognition
                    </Text>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.infoItem}>
                        <MaterialCommunityIcons name="face-recognition" size={24} color="#6366F1" />
                        <Text style={styles.infoText}>Biometric Face Matching</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="location-sharp" size={24} color="#6366F1" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoText} ellipsizeMode="tail" numberOfLines={3}>
                                {displayAddress}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={onGetStarted}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 40,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    infoSection: {
        gap: 16,
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 20,
        marginHorizontal: 4,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    infoText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
        marginLeft: 12,
    },
    buttonContainer: {
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
