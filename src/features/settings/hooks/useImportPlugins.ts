import { importRegistry } from '@/src/services/import';
import { useMemo } from 'react';

export function useImportPlugins() {
    return useMemo(() => importRegistry.getAll(), []);
}
