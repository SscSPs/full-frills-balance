/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors in child component tree and displays fallback UI.
 * Logs errors via the logger utility.
 */

import { logger } from '@/src/utils/logger';
import React, { Component, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        logger.error('Uncaught error in component tree', error, {
            componentStack: errorInfo.componentStack,
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <Text style={styles.emoji}>😕</Text>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        An unexpected error occurred. Please try again.
                    </Text>
                    {__DEV__ && this.state.error && (
                        <Text style={styles.errorDetails}>
                            {this.state.error.message}
                        </Text>
                    )}
                    <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#1a1a1a',
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#a0a0a0',
        textAlign: 'center',
        marginBottom: 24,
    },
    errorDetails: {
        fontSize: 12,
        color: '#ff6b6b',
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: 'monospace',
        padding: 12,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        maxWidth: '100%',
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
