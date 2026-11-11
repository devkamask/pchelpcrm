import { computed, signal } from '@angular/core';
import type { User } from '../../users';
import { InvalidCredentialsError, ValidationError } from '../../shared/errors/domain-errors';
import { AuthService } from '../domain/auth-service';

/** Фейк `AuthService` в памяти для тестов других слоёв и фич. */
export class InMemoryAuthService extends AuthService {
    private readonly currentUser = signal<User | null>(null);
    private readonly accounts = new Map<string, { user: User; password: string }>();
    private nextError: Error | null = null;
    readonly user = this.currentUser.asReadonly();

    readonly isAuthenticated = computed(() => this.user() !== null);

    async login(email: string, password: string): Promise<User> {
        this.throwNextError();
        const account = this.accounts.get(email);
        if (!account || account.password !== password) throw new InvalidCredentialsError();
        this.currentUser.set(account.user);
        return account.user;
    }

    async register(data: { email: string; password: string; name?: string }): Promise<User> {
        this.throwNextError();
        if (this.accounts.has(data.email)) {
            throw new ValidationError({ email: 'validation_unique' });
        }
        const user = { id: crypto.randomUUID(), email: data.email, name: data.name ?? '' };
        this.accounts.set(data.email, { user, password: data.password });
        this.currentUser.set(user);
        return user;
    }

    logout(): void {
        this.currentUser.set(null);
    }

    async restore(): Promise<void> {
        this.throwNextError();
    }

    /** Сразу делает пользователя вошедшим, без регистрации. */
    signInAs(user: User): void {
        this.currentUser.set(user);
    }

    /** Следующий вызов `login`, `register` или `restore` отклоняется этой ошибкой. */
    failNextWith(error: Error): void {
        this.nextError = error;
    }

    private throwNextError(): void {
        if (!this.nextError) return;
        const error = this.nextError;
        this.nextError = null;
        throw error;
    }
}
