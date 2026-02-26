// logger/config.ts
/*
La config est chargée une seule fois au démarrage et exportée en singleton immutable. 
Aucune relecture à chaud pour éviter les états incohérents.
unique export: 
  const config: LogConfig = loadConfig({
    log: // actualiseée depuis logger.config.json + process.env
    transports: // {} >>> sera construit depuis index.ts.buildTransports
  })
*/

import * as dotenv from 'dotenv'
import * as path from 'node:path'
import type { PinoLevel, LogConfig } from './types'
import { PINO_LEVELS } from './types'
// en ESM, les imports JSON sont en lecture seule (immuables) dans la plupart des environnements (Node.js, bundlers comme Vite, Webpack, etc.).
import loggerConfigJson from './logger.config.json' 

dotenv.config({ path: path.resolve(process.cwd(), '.env') }) // .env projet

// ── Helpers ──

function parseEnv(): 'development' | 'production' {
  return process.env.NODE_ENV  === 'production' ? 'production' : 'development'
}

function parseMinLevel(raw: string, env: 'development' | 'production'): PinoLevel {
  const lowerRaw = raw.toLowerCase()
  if (PINO_LEVELS.includes(lowerRaw as PinoLevel)) return lowerRaw as PinoLevel
  return env === 'production' ? 'info' : 'trace'
}

function validateDir(dir: string): string {
  if (!dir || dir.trim() === '') {
    process.stderr.write('LOG_DIR is empty in \'logger.config.json\' — falling back to /logs\n')
    return '/logs'
  }
  return path.resolve(dir)
}

/*
function parseTransportMuting(): TransportsMuted {
  const prefix = 'logTransport'
  const suffix = 'Muted'
  return Object.entries(conf.log)
    .filter(([key]) => key.startsWith(prefix) && key.endsWith(suffix))
    .reduce<TransportsMuted>((acc, [key, value]) => {
      const name = key
        .slice(prefix.length, key.length - suffix.length)
        .toLowerCase()                // 'logTransportHttpMuted' → 'http'
      acc[name] = value as boolean
      return acc
    }, {})
}
function parseTransportMuting_static(): Record<string, boolean> {
  // lecture depuis conf.log — pas de process.env direct
  return {
    error: conf.log.logTransportErrorMuted,
    info: conf.log.logTransportInfoMuted,
    http: conf.log.logTransportHttpMuted,
    service: conf.log.logTransportServiceMuted,
  }
}
function parseTransportMuting_fromEnv(): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  const prefix = 'LOG_TRANSPORT_'
  const suffix = '_MUTED'
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(prefix) && key.endsWith(suffix)) {
      const name = key
        .slice(prefix.length, key.length - suffix.length)
        .toLowerCase()
      result[name] = value?.toLowerCase() === 'true'
    }
  }
  return result
}
*/

// ─── loader ───

function loadConfig(): LogConfig {
  const envFromProject = parseEnv()
  const config: LogConfig = {
    log: {
      env:                envFromProject,
      dir:                validateDir(loggerConfigJson.log.dir ?? '/logs'),
      enabled:            loggerConfigJson.log.enabled ?? true,
      console:            loggerConfigJson.log.console ?? true,
      file:               loggerConfigJson.log.file ?? true,
      maxFileSizeMB:      loggerConfigJson.log.maxFileSizeMB ?? 50,
      bufferMaxEntries:   loggerConfigJson.log.bufferMaxEntries ?? 10000,
      minLevel:           parseMinLevel(loggerConfigJson.log.minLevel, envFromProject),
    },
    transports: []  // construit dans index.ts depuis loggerConfigJson.transports
  }
  return Object.freeze(config)     // immutable après chargement
}

// ─── Singleton ────────────────────────────────────────────────────────────────
export const config: LogConfig = loadConfig()