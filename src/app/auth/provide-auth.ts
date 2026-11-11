import {
    PLATFORM_ID,
    provideAppInitializer,
    inject,
    makeEnvironmentProviders,
    type EnvironmentProviders,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './domain/auth-service';
import { PocketBaseAuthService } from './data/pocketbase-auth-service';
import { AuthCookie } from './data/auth-cookie';

export function provideAuth(): EnvironmentProviders {
    return makeEnvironmentProviders([
        PocketBaseAuthService,
        AuthCookie,
        { provide: AuthService, useExisting: PocketBaseAuthService },
        provideAppInitializer(async () => {
            const cookie = inject(AuthCookie);
            const auth = inject(AuthService);
            const browser = isPlatformBrowser(inject(PLATFORM_ID));
            cookie.load();
            cookie.watch();
            if (browser) await Promise.resolve().then(() => auth.restore());
        }),
    ]);
}
