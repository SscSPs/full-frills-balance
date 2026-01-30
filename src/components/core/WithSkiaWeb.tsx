
import { useTheme } from '@/src/hooks/use-theme';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

/**
 * WithSkiaWeb - A generic HOC to lazy-load Skia on Web.
 * On Native, it renders the component immediately.
 * On Web, it waits for LoadSkiaWeb() to complete before rendering.
 */
export const WithSkiaWeb = <P extends object>(
    Component: React.ComponentType<P>,
    FallbackComponent?: React.ComponentType<any>
) => {
    return (props: P) => {
        const [ready, setReady] = useState(Platform.OS !== 'web');
        const { theme } = useTheme();

        useEffect(() => {
            if (Platform.OS === 'web' && !ready) {
                const loadSkia = async () => {
                    try {
                        // Dynamically import Skia for Web
                        const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
                        await LoadSkiaWeb({ locateFile: () => 'https://unpkg.com/canvaskit-wasm@0.40.0/bin/canvaskit.wasm' });
                        setReady(true);
                    } catch (e) {
                        console.error("Failed to load Skia Web:", e);
                    }
                };
                loadSkia();
            }
        }, []);

        if (!ready) {
            if (FallbackComponent) return <FallbackComponent />;
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                </View>
            );
        }

        return <Component {...props} />;
    };
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 100,
    }
});
