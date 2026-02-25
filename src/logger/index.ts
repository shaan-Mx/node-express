// logger/index.ts
/*
export type { LogConfig } est importé depuis ./config et non ./types car c'est là qu'il est défini.
  si apparit une erreur sur cet export, remplacer par export type { LogConfig } from './config' uniquement.
Les hooks SIGTERM et SIGINT sont enregistrés à chaque appel de createLogger.
  si plusieurs loggers sont créés, les handlers s'accumulent.
  Dans l'usage nominal un seul logger est créé au boot, mais si besoin il suffit d'ajouter 
  un flag global pour n'enregistrer les hooks qu'une seule fois.
*/

/*
import { v4 as uuidv4 } from 'uuid'
import { PINO_LEVELS } from './types'
uuidv4 est utilisé dans middleware/express.ts, pas dans index.ts. 
PINO_LEVELS n'est pas utilisé non plus — le filtrage par level est délégué à interface.ts.
*/
import type { Logger, LoggerOptions, LogEntry, FlushOptions, BufferStats, Transport } from './types'
import { config } from './config'
import { buffer } from './core/buffer'
import { meta } from './core/meta'
import { getRequestId } from './middleware/request-context'
import { setHttpLogger } from './middleware/express'

import { createConsoleTransport } from './transports/console'
import { createLevelTransport } from './transports/file-level'
import { createNamedTransport } from './transports/file-named'

export { httpLogger } from './middleware/express'
export { createConsoleTransport } from './transports/console'
export { createLevelTransport } from './transports/file-level'
export { createNamedTransport } from './transports/file-named'
export type { LogConfig } from './config'
export type { Transport, LogEntry, HttpMiddlewareOptions } from './types'

// ─── factory ───

export function createLogger(options: LoggerOptions): Logger {
  const transports: Transport[] = options.transports

  // ─── low level ───────────────────────────────────────────────────

  function log(entry: LogEntry): void {
    if (!config.enabled) return
    // enrichissement depuis le contexte de requête actif si disponible
    const requestId = entry.requestId ?? getRequestId()
    const enriched: LogEntry = requestId ? { ...entry, requestId } : entry
    buffer.enqueue(enriched, transports)
  }

  // ─── by level ───
  /*
    le code original
      return { ...data, level, timestamp: Date.now() }
    générait une erreur de type
      La propriété 'msg' est absente du type '{ level: "trace" | "debug" | "info" | "warn" | "error" | "fatal"; timestamp: number; }' mais obligatoire dans le type 'LogEntry'
    >>> L'index signature [key: string]: unknown présente dans LogEntry empêche TypeScript d'inférer que 
    msg est bien inclus dans le spread de data. Extraire msg explicitement en premier position lève l'ambiguïté.
  */
  function buildEntry(
    level: LogEntry['level'],
    data: Omit<LogEntry, 'level' | 'timestamp'>
  ): LogEntry {
    const { msg, ...rest } = data
    return {
      ...rest,
      msg: msg as string,  // forcer msg à être string, même si data.msg est de type unknown
      level,
      timestamp: Date.now() // posé ici, avant le fanout. Sinon (timestamp après le fanout): fausse les stats de latence.
    }
  }

  // ─── injection as middleware HTTP ────────────────────────────────────

  setHttpLogger((entry: LogEntry) => log(entry))

  // ─── shutdown ───

  async function flush(options: FlushOptions = {}): Promise<void> {
    const timeoutMs = options.timeoutMs ?? 2000
    return Promise.race([
      buffer.flush(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('flush timeout')), timeoutMs)
      )
    ]).catch((err) => {
      meta.warn('flush did not complete cleanly', err)
    })
  }

  function stats(): BufferStats {
    return buffer.stats()
  }

  // ─── hooks SIGTERM / SIGINT ───

  process.on('SIGTERM', () => {
    flush().then(() => process.exit(0))
  })
  process.on('SIGINT', () => {
    flush().then(() => process.exit(0))
  })

  // ─── public Interface ───

  const logger: Logger = {
    trace: (data) => log(buildEntry('trace', data)),
    debug: (data) => log(buildEntry('debug', data)),
    info:  (data) => log(buildEntry('info',  data)),
    warn:  (data) => log(buildEntry('warn',  data)),
    error: (data) => log(buildEntry('error', data)),
    fatal: (data) => log(buildEntry('fatal', data)),
    log,
    flush,
    stats
  }

  return logger
}

export const logger = createLogger({
  transports: [
    createConsoleTransport(),
    createLevelTransport({ prefix: 'error-', level: 'error' }),
    createLevelTransport({ prefix: 'info-',  level: 'info'  }),
    createLevelTransport({ prefix: 'warn-',  level: 'warn'  }),
    createNamedTransport({
      name:    'trspHttp',
      prefix:  'http-',
      domains: ['http'],
      levels:  ['info', 'warn', 'error']
    }),
    createNamedTransport({
      name:    'trspService',
      prefix:  'service-',
      domains: ['service']
    })
  ]
})
