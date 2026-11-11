# Аутентификация

Фича `auth` управляет входом, регистрацией и текущей сессией пользователя. Профиль `User` принадлежит фиче `users`; PocketBase записи остаются внутри слоя `data`.

## Где лежит

```
src/app/auth/
├── domain/auth-service.ts
├── data/auth-cookie.ts
├── data/pocketbase-auth-service.ts
├── data/user-mapper.ts
├── provide-auth.ts
└── testing/in-memory-auth-service.ts
```

## Публичный API

- `AuthService` — абстрактный контракт и DI-токен с сигналами `user` и `isAuthenticated`.
- `provideAuth()` — регистрирует PocketBase-реализацию и инициализацию браузерной сессии.
- `InMemoryAuthService` — фейк для тестов; `signInAs()` задаёт пользователя, `failNextWith()` — ошибку следующего вызова.
- Тип `User` экспортируется фичей `users`.

## Как пользоваться

Получай `AuthService` через Angular DI. Вызовы `login()` и `register()` возвращают `User`; ошибки преобразуются в доменные типы из `shared/errors`.

## Как расширить или заменить

Чтобы заменить PocketBase, предоставь другую реализацию `AuthService` через DI. Маппинг PocketBase `RecordModel` в `User` находится в `auth/data/user-mapper.ts`, поскольку сейчас нужен только аутентификации.

## Тесты

Контракт сервиса описан в `auth/testing/auth-service.contract.ts`; PocketBase-интеграционные и cookie-тесты лежат рядом с реализацией.

## Подводные камни

- Cookie `pb_auth` читается и записывается только в браузере; серверный рендер не использует эту cookie.
- При старте браузера cookie загружается до `restore()`. Сетевой сбой сохраняет текущую сессию, отказ авторизации очищает её.
- PocketBase auth store принадлежит экземпляру клиента из DI и не разделяется между SSR-запросами.
