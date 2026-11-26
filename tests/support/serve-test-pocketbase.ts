// Держит тестовый PocketBase до сигнала. Playwright передаёт порт, API-тесты используют свободный.
import { startPocketBase } from './pocketbase-server.ts';

const portArg = process.argv[2];
const port = portArg === undefined ? undefined : Number(portArg);
if (port !== undefined && (!Number.isInteger(port) || port <= 0)) {
    throw new Error(`Usage: node serve-test-pocketbase.ts [port]; got ${portArg}`);
}
const { pid, url, dataDir } = await startPocketBase({ port });
console.log(JSON.stringify({ pid, url, dataDir }));
setInterval(() => undefined, 1 << 30);
