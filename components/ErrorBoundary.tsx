/**
 * Error Boundary Component
 * 
 * Catches React component errors and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { logger } from '../src/utils/logger'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        }
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('React Error Boundary caught error', error, {
            componentStack: errorInfo.componentStack,
        })

        this.setState({
            error,
            errorInfo,
        })
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Text>
                    {__DEV__ && this.state.errorInfo && (
                        <View style={styles.debugInfo}>
                            <Text style={styles.debugText}>
                                {this.state.errorInfo.componentStack}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            )
        }

        return this.props.children
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#000',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    debugInfo: {
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginBottom: 24,
        maxHeight: 200,
    },
    debugText: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
