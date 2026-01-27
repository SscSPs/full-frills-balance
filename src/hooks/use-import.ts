/**
 * Import Hook
 * 
 * Shared logic for importing data from JSON files and ZIP archives.
 */

import { useUI } from '@/src/contexts/UIContext';
import { importService } from '@/src/services/import-service';
import { ivyImportService } from '@/src/services/ivy-import-service';
import { logger } from '@/src/utils/logger';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
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

// Magic bytes for ZIP files (PK\x03\x04)
const isZipFile = (bytes: Uint8Array): boolean => {
    return bytes.length >= 4 &&
        bytes[0] === 0x50 &&
        bytes[1] === 0x4B &&
        bytes[2] === 0x03 &&
        bytes[3] === 0x04;
};

export type ImportFormat = 'native' | 'ivy';

export function useImport() {
    const { requireRestart } = useUI();
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async (expectedType?: ImportFormat) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/json',
                    'application/zip',
                    'application/x-zip-compressed',
                    'application/octet-stream',
                    '*/*'
                ],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];

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

            // 1. READ RAW BYTES (Unified for JSON and ZIP)
            let rawBytes: Uint8Array;
            try {
                if (Platform.OS === 'web') {
                    const response = await fetch(file.uri);
                    const buffer = await response.arrayBuffer();
                    rawBytes = new Uint8Array(buffer);
                } else {
                    const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
                    rawBytes = base64ToBytes(base64);
                }
            } catch (readError) {
                logger.error('Failed to read file', readError);
                throw new Error('Could not read file from device.');
            }

            // 2. CHECK & EXTRACT ZIP
            if (isZipFile(rawBytes)) {
                setIsImporting(true);
                logger.info('Detected ZIP file, attempting extraction...');
                try {
                    const zip = await JSZip.loadAsync(rawBytes);
                    const files = Object.keys(zip.files);

                    // Filter out MACOSX metadata which often pollutes zips from Macs
                    // User confirmed: "there will only ever be just a single file in it."
                    // So we pick the first non-junk file we find.
                    const validFile = files.find(name => !name.includes('__MACOSX') && !zip.files[name].dir);

                    if (!validFile) {
                        throw new Error('No valid files found in ZIP archive.');
                    }

                    logger.info(`Extracting file from ZIP: ${validFile}`);
                    rawBytes = await zip.files[validFile].async('uint8array');

                } catch (zipError) {
                    logger.error('ZIP extraction failed', zipError);
                    Alert.alert('Archive Error', 'Failed to extract file from ZIP archive.');
                    setIsImporting(false);
                    return;
                }
            }

            // 3. DECODE TEXT (Try UTF-8 -> Fallback UTF-16BE)
            setIsImporting(true);
            let content = '';
            try {
                // Try UTF-8 first (Fast path for standard JSON)
                const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
                content = utf8Decoder.decode(rawBytes);

                // Basic check if it looks like JSON
                if (!content.trim().startsWith('{') && !content.trim().startsWith('[')) {
                    throw new Error('Likely encoding issue (not UTF-8)');
                }
            } catch (e) {
                logger.info('UTF-8 decode failed or invalid JSON start, attempting UTF-16BE...', { error: String(e) });
                try {
                    content = decodeUTF16Bytes(rawBytes);
                } catch (decodeErr) {
                    logger.error('Failed to decode as UTF-16BE', decodeErr);
                    throw new Error('Unknown file encoding.');
                }
            }

            // 4. ANALYZE JSON
            setIsImporting(true);
            let isIvy = false;
            try {
                // sanitize content - sometimes BOM or null bytes causing issues
                content = content.replace(/^\uFEFF/, ''); // Remove BOM

                const data = JSON.parse(content);
                isIvy = ivyImportService.isIvyBackup(data);
            } catch (e) {
                logger.warn('JSON Parse failed', { error: e instanceof Error ? e.message : String(e) });
                // We'll let it fail later if it's invalid during the actual import pass
            }

            // 5. VALIDATIONS (Type Mismatch Warnings)
            if (expectedType) {
                if (expectedType === 'native' && isIvy) {
                    const confirmMismatch = Platform.OS === 'web'
                        ? confirm('Warning: You selected "Full Frills Backup" but this looks like an Ivy Wallet file. Continue?')
                        : await new Promise<boolean>(resolve => {
                            Alert.alert('Format Mismatch', 'Looks like an Ivy Wallet file. Import anyway?',
                                [{ text: 'Cancel', onPress: () => resolve(false) }, { text: 'Continue', onPress: () => resolve(true) }]);
                        });
                    if (!confirmMismatch) { setIsImporting(false); return; }

                } else if (expectedType === 'ivy' && !isIvy) {
                    const confirmMismatch = Platform.OS === 'web'
                        ? confirm('Warning: You selected "Ivy Wallet Backup" but this file doesn\'t look like one. Continue?')
                        : await new Promise<boolean>(resolve => {
                            Alert.alert('Format Mismatch', 'Does not look like an Ivy Wallet file. Import anyway?',
                                [{ text: 'Cancel', onPress: () => resolve(false) }, { text: 'Continue', onPress: () => resolve(true) }]);
                        });
                    if (!confirmMismatch) { setIsImporting(false); return; }
                }
            }

            setIsImporting(true);

            // 6. EXECUTE VIA UICONTEXT (Delays execution to prevent DB locks)
            const operation = async () => {
                if (isIvy) {
                    logger.info('Detected Ivy Wallet backup format');
                    return await ivyImportService.importFromIvyJSON(content);
                } else {
                    logger.info('Assuming native backup format');
                    return await importService.importFromJSON(content);
                }
            };

            requireRestart(await operation());

        } catch (error) {
            logger.error('Import failed', error);
            Alert.alert('Import Failed', 'Could not parse or import the selected file.');
            setIsImporting(false);
        }
    };

    return {
        handleImport,
        isImporting
    };
}
