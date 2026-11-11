import { DOCUMENT, PLATFORM_ID, Service, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { POCKETBASE } from '../../shared/pocketbase/pocketbase-client';

/** Синхронизация auth store с cookie только в браузере. */
@Service({ autoProvided: false })
export class AuthCookie {
    private readonly document = inject(DOCUMENT);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    private readonly pb = inject(POCKETBASE);

    load(): void {
        if (this.isBrowser) this.pb.authStore.loadFromCookie(this.document.cookie);
    }

    watch(): void {
        if (!this.isBrowser) return;
        this.pb.authStore.onChange(() => {
            this.document.cookie = this.pb.authStore.token
                ? this.pb.authStore.exportToCookie({
                      httpOnly: false,
                      secure: this.document.location.protocol === 'https:',
                      sameSite: 'Lax',
                      path: '/',
                  })
                : 'pb_auth=; Path=/; SameSite=Lax; Max-Age=0';
        });
    }
}
