/**
 * Import Hook
 * 
 * Shared logic for importing data from JSON files.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useUI } from '../contexts/UIContext';
import { importService } from '../services/import-service';
import { logger } from '../utils/logger';

export function useImport() {
    const { requireRestart } = useUI();
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
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

            // Read file content
            let content;
            if (Platform.OS === 'web') {
                const response = await fetch(file.uri);
                content = await response.text();
            } else {
                content = await FileSystem.readAsStringAsync(file.uri);
            }

            await importService.importFromJSON(content);

            // Trigger blocking screen immediately
            requireRestart();

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
