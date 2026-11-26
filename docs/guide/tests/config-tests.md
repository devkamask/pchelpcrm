# Тесты конфигов (ESLint, dev-прокси, Playwright)

Проверки конфигурации, поломка которой иначе остаётся незамеченной. Общие правила — в [testing.md](../../testing.md).

`pnpm test:lint` проверяет типы через `tsconfig.tests.json` и `tsconfig.node-scripts.json`, запускает ESLint для `tests/support/pocketbase-server.ts` и `tests/support/serve-test-pocketbase.ts`, затем выполняет тесты конфигов из `tests/lint/**/*.spec.ts` через `vitest.lint.config.mts`.

Для этих двух скриптов правило ESLint `no-restricted-syntax` запрещает декораторы (селектор `Decorator`). Node.js исполняет скрипты напрямую, а `erasableSyntaxOnly` пропускает декораторы. Тест в `eslint-rules.spec.ts` проверяет оба пути и отдельно разрешённый случай в Angular.

Корневой `tsconfig.json` подключает `tsconfig.node-scripts.json` перед общим конфигом тестов, чтобы VS Code применял проверку стираемого синтаксиса к скриптам запуска PocketBase и их импортам.

- Проверяют, что ESLint держит границы, от которых зависит изоляция данных при SSR: `new PocketBase(` и импорт класса `PocketBase` (в том числе под другим именем и через `pocketbase/*`) только в фабрике `shared/pocketbase/pocketbase-client.ts` (и в тестовых хелперах `tests/`), импорт `pocketbase` и `pocketbase/*` запрещён в `domain/` и `ui/`.
- `tests/lint/pb-dev-proxy.spec.ts` проверяет `proxy.conf.mjs` (dev-прокси `ng serve`): правило `/pb/`, `target` из `PB_URL` с тем же значением по умолчанию, что у серверного провайдера (в том числе при пустой переменной), и срезание префикса `/pb`.
- Способ ESLint-тестов: `ESLint#lintText(code, { filePath })` на коротких фрагментах кода, проверяется `ruleId` сообщений. Конфиг ESLint ломается молча (опечатка в glob, слишком широкое исключение), и `pnpm lint` при этом остаётся зелёным; тест это ловит.
- Запускаются первым шагом в `pnpm test`, `pnpm test:api`, `pnpm test:integration` и `pnpm e2e`, чтобы поломка правила обнаружилась при любом прогоне. ESLint — Node-библиотека, в бандл builder'а Angular её не подключить, поэтому это отдельный набор.
