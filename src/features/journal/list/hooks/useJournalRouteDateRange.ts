import { DateRange } from '@/src/utils/dateUtils';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

export function useJournalRouteDateRange(): DateRange | undefined {
    const { startDate, endDate } = useLocalSearchParams<{ startDate: string; endDate: string }>();

    return useMemo(() => {
        if (startDate && endDate) {
            const start = parseInt(startDate, 10);
            const end = parseInt(endDate, 10);
            if (!isNaN(start) && !isNaN(end)) {
                return { startDate: start, endDate: end };
            }
        }
        return undefined;
    }, [startDate, endDate]);
}
