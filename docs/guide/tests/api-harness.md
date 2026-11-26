# Стенд API-тестов

Тесты бэкенда (схема, миграции, правила доступа, изоляция пользователей) на чистом Vitest в Node, с запросами к временному PocketBase. Общие правила и устройство тестового PocketBase — в [testing.md](../../testing.md).

`pnpm test:api` = `pnpm test:lint && vitest run --config vitest.api.config.mts`: чистый Vitest в Node, без Angular. Общий шаг `test:lint` включает проверку стираемого синтаксиса напрямую запускаемых Node.js-скриптов через `tsconfig.node-scripts.json`.

- Сначала проверяются типы тестового кода (`tsconfig.tests.json`: `tests/**`, `vitest.*.config.mts` и `proxy.conf.mjs`; `allowJs` нужен, чтобы `tests/lint/` импортировали `.mjs`-конфиг): сам Vitest типы не проверяет.
- `vitest.api.config.mts`: `include: tests/api/**/*.api.spec.ts`, `globalSetup: tests/support/global-setup.ts`, таймауты 20 с (запас на старт PocketBase внутри теста).
- `global-setup.ts` поднимает один PocketBase на прогон и передаёт тестам `pbUrl`, `pbDataDir`, `pbSuperuser` через `project.provide`; в тестах — `inject('pbUrl')` и т. д. из `vitest`. Типы этих значений — `tests/support/provided-context.d.ts`.
- Тесты самого стенда — `tests/api/harness.api.spec.ts`. Для проверки уборки по `SIGINT` и `SIGTERM` тесты запускают `tests/support/serve-test-pocketbase.ts` отдельным процессом Node.js. Без аргумента скрипт поднимает PocketBase на свободном порту, печатает JSON с `pid`, `url` и `dataDir` и ждёт сигнала.
- Поэтому `pocketbase-server.ts` выполняется чистым Node без сборки: в нём только импорты `node:*` и стираемый TypeScript (без `enum`, `namespace`, параметров-свойств).

**Проверка запуска.** `startPocketBase()` записывает случайный UUID в `public/test-instance.txt` внутри временной папки и передаёт этот подкаталог в `pocketbase serve --publicDir`. Стенд запрашивает `GET /test-instance.txt`, сверяет ответ с UUID текущего запуска, затем проверяет `GET /api/health`. Поэтому другой PocketBase на занятом порту не пройдёт проверку, даже если его API исправен. Формулировка сообщения о старте может меняться. Вывод дочернего процесса нужен только для диагностики ошибки. Регрессионный тест в `harness.api.spec.ts` запускает второй экземпляр на порту первого и проверяет, что второй запуск отклонён, а первый продолжает отвечать.

После сигнала тест проверяет завершение процесса PocketBase по PID, недоступность HTTP и удаление временной папки. В Linux/WSL имя и время запуска читаются из `/proc/<pid>/stat` до сигнала и после завершения владельца. Совпадение PID и времени запуска означает оставшийся процесс и приводит к падению теста с именем процесса в сообщении. Изменившееся время запуска означает повторное использование PID другим процессом. На остальных ОС проверяется отсутствие PID через `process.kill(pid, 0)`, без распознавания повторного использования номера. Ошибки доступа к процессу приводят к падению теста.
