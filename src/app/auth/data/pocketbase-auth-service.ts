import { Service, computed, inject, signal } from '@angular/core';
import { ClientResponseError } from 'pocketbase';
import type { User } from '../../users';
import {
    InvalidCredentialsError,
    NetworkError,
    UnauthorizedError,
} from '../../shared/errors/domain-errors';
import { toDomainError } from '../../shared/errors/to-domain-error';
import { POCKETBASE } from '../../shared/pocketbase/pocketbase-client';
import { AuthService } from '../domain/auth-service';
import { mapUser } from './user-mapper';

// Регистрируется только через provideAuth() под токеном AuthService: авторегистрация дала бы второй экземпляр.
@Service({ autoProvided: false })
export class PocketBaseAuthService extends AuthService {
    private readonly pb = inject(POCKETBASE);
    private readonly currentUser = signal<User | null>(mapUser(this.pb.authStore.record));
    readonly user = this.currentUser.asReadonly();

    readonly isAuthenticated = computed(() => this.user() !== null);

    constructor() {
        super();
        this.pb.authStore.onChange((_token, record) => this.currentUser.set(mapUser(record)));
    }

    async login(email: string, password: string): Promise<User> {
        try {
            const response = await this.pb.collection('users').authWithPassword(email, password);
            return mapUser(response.record)!;
        } catch (error) {
            if (error instanceof ClientResponseError && [400, 401].includes(error.status)) {
                throw new InvalidCredentialsError(undefined, { cause: error });
            }
            throw toDomainError(error);
        }
    }

    async register(data: { email: string; password: string; name?: string }): Promise<User> {
        try {
            await this.pb.collection('users').create({
                ...data,
                name: data.name ?? '',
                passwordConfirm: data.password,
            });
            return await this.login(data.email, data.password);
        } catch (error) {
            if (error instanceof InvalidCredentialsError) throw error;
            throw toDomainError(error);
        }
    }

    logout(): void {
        this.pb.authStore.clear();
    }

    async restore(): Promise<void> {
        if (!this.pb.authStore.token) return;
        try {
            const response = await this.pb.collection('users').authRefresh();
            this.pb.authStore.save(response.token, response.record);
        } catch (error) {
            const domainError = toDomainError(error);
            if (domainError instanceof UnauthorizedError) this.logout();
            else if (!(domainError instanceof NetworkError)) throw domainError;
        }
    }
}
