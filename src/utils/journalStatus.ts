import { JournalStatus } from '@/src/data/models/Journal';

export const ACTIVE_JOURNAL_STATUSES = [JournalStatus.POSTED, JournalStatus.REVERSED] as const;
