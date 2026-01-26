/**
 * Import Hook
 * 
 * Shared logic for importing data from JSON files.
 */

import { useUI } from '@/src/contexts/UIContext';
import { ImportStats, importService } from '@/src/services/import-service';
import { ivyImportService } from '@/src/services/ivy-import-service';
import { logger } from '@/src/utils/logger';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';



// Helper to convert Base64 to Uint8Array
const base64ToBytes = (base64: string): Uint8Array => {
    const binaryString = Platform.OS === 'ios' || Platform.OS === 'android'
        ? atob(base64)
        : atob(base64);

    if (typeof atob === 'undefined') {
        throw new Error('atob not available for decoding');
    }

    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

// Helper to decode Uint8Array as UTF-16BE (Strict BE as per Ivy Wallet format)
// Reference: ivyWalletLink/createCategoryAccountsInBackup.js
const decodeUTF16Bytes = (bytes: Uint8Array): string => {
    // Strip BOM for UTF-16BE (0xFE 0xFF) if present
    let start = 0;
    if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
        start = 2;
    }

    // Manual BE Decode (High Byte First)
    let str = '';

    // Note: JS strings are UTF-16. `String.fromCharCode` creates a character from a code unit.
    for (let i = start; i < bytes.length; i += 2) {
        const high = bytes[i];
        const low = bytes[i + 1];
        if (low === undefined) break; // Should be even length

        const codePoint = (high << 8) | low;
        str += String.fromCharCode(codePoint);
    }

    return str;
};

export type ImportFormat = 'native' | 'ivy';

export function useImport() {
    const { requireRestart } = useUI();
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async (expectedType?: ImportFormat) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/json', 'application/octet-stream', '*/*'], // Allow loose types for better compat
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];

            // ... (rest of the code)

            const proceed = Platform.OS === 'web'
                ? confirm(`This will REPLACE all your current data with content from ${file.name}. This cannot be undone. Are you sure?`)
                : await new Promise<boolean>(resolve => {
                    Alert.alert(
                        'Import Data',
                        `This will REPLACE all your current data with content from ${file.name}. This cannot be undone. Are you sure?`,
                        [
                            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                            { text: 'Overwrite Everything', style: 'destructive', onPress: () => resolve(true) }
                        ]
                    );
                });

            if (!proceed) return;

            setIsImporting(true);

            // Read file content
            let content = '';

            try {
                // 1. Try Reading as UTF-8 (Fast Path for Standard JSON)
                if (Platform.OS === 'web') {
                    const response = await fetch(file.uri);
                    content = await response.text();
                } else {
                    content = await FileSystem.readAsStringAsync(file.uri);
                }

                // Check basics - valid JSON usually starts with { or [
                // Ivy Wallet (UTF-16) read as UTF-8 usually results in garbage or nulls at start
                if (!content.trim().startsWith('{') && !content.trim().startsWith('[')) {
                    throw new Error('Likely encoding issue');
                }
            } catch (error) {
                logger.info('Failed to read as UTF-8, attempting UTF-16BE decoding...', { error: error instanceof Error ? error.message : String(error) });

                // 2. Fallback: Read raw bytes and decode strict UTF-16BE
                try {
                    let bytes: Uint8Array;

                    if (Platform.OS === 'web') {
                        const response = await fetch(file.uri);
                        const buffer = await response.arrayBuffer();
                        bytes = new Uint8Array(buffer);
                    } else {
                        // Native: Read Base64 -> Bytes
                        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
                        bytes = base64ToBytes(base64);
                    }

                    content = decodeUTF16Bytes(bytes);
                } catch (decodeErr) {
                    logger.error('Failed to decode as UTF-16BE', decodeErr);
                    throw new Error('Could not read file. Unknown format or encoding.');
                }
            }

            let isIvy = false;
            try {
                // sanitize content - sometimes BOM or null bytes causing issues
                // remove BOM \uFEFF
                content = content.replace(/^\uFEFF/, '');

                const data = JSON.parse(content);
                isIvy = ivyImportService.isIvyBackup(data);
            } catch (e) {
                logger.warn('JSON Parse failed', { error: e instanceof Error ? e.message : String(e) });
                // We'll let it fail later if it's invalid
            }

            // Expected Format Validation
            if (expectedType) {
                if (expectedType === 'native' && isIvy) {
                    const confirmMismatch = Platform.OS === 'web'
                        ? confirm('Warning: You selected "Full Frills Backup" but this looks like an Ivy Wallet file. Continue?')
                        : await new Promise<boolean>(resolve => {
                            Alert.alert(
                                'Format Mismatch',
                                'You selected "Full Frills Backup" but this looks like an Ivy Wallet backup file.\n\nIt might not import correctly as a Native backup.',
                                [
                                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                                    { text: 'Try Anyway', style: 'default', onPress: () => resolve(true) }
                                ]
                            );
                        });
                    if (!confirmMismatch) {
                        setIsImporting(false);
                        return;
                    }
                } else if (expectedType === 'ivy' && !isIvy) {
                    const confirmMismatch = Platform.OS === 'web'
                        ? confirm('Warning: You selected "Ivy Wallet Backup" but this file doesn\'t look like one. Continue?')
                        : await new Promise<boolean>(resolve => {
                            Alert.alert(
                                'Format Mismatch',
                                'You selected "Ivy Wallet Backup" but this file doesn\'t look like a standard Ivy Wallet export.\n\nIt might not import correctly.',
                                [
                                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                                    { text: 'Try Anyway', style: 'default', onPress: () => resolve(true) }
                                ]
                            );
                        });
                    if (!confirmMismatch) {
                        setIsImporting(false);
                        return;
                    }
                }
            }

            let stats: ImportStats;
            if (isIvy) {
                logger.info('Detected Ivy Wallet backup format');
                stats = await ivyImportService.importFromIvyJSON(content);
            } else {
                logger.info('Assuming native backup format');
                stats = await importService.importFromJSON(content);
            }

            // Trigger blocking screen immediately with stats
            requireRestart(stats);

        } catch (error) {
            logger.error('Import failed', error);
            Alert.alert('Import Failed', 'Could not parse or import the selected file.');
        } finally {
            setIsImporting(false);
        }
    };

    return {
        handleImport,
        isImporting
    };
}
