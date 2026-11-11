import type { RecordModel } from 'pocketbase';
import type { User } from '../../users';

/** Преобразует auth-запись PocketBase в публичную модель пользователя. */
export function mapUser(record: RecordModel | null): User | null {
    return record
        ? {
              id: record.id,
              email: String(record['email'] ?? ''),
              name: String(record['name'] ?? ''),
          }
        : null;
}
