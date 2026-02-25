// logger/config.ts
/*
La config est chargée une seule fois au démarrage et exportée en singleton immutable. 
Aucune relecture à chaud pour éviter les états incohérents.
*/

import { config as conf } from '../config/env'
import * as path from 'node:path'

import type { PinoLevel } from './types'
import { PINO_LEVELS } from './types'

type TransportsMuted = Record<string, boolean>
export interface LogConfig {
  dir: string
  enabled: boolean
  console: boolean
  file: boolean
  maxFileSizeMb: number
  bufferMaxEntries: number
  env: 'development' | 'production'
  minLevel: PinoLevel
  transportMuted: TransportsMuted   // clé = nom du transport en lowercase
}

// ── Helpers ──

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  return value.toLowerCase() !== 'false'
}
function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return isNaN(parsed) ? fallback : parsed
}

function parseEnv(): 'development' | 'production' {
  return conf.nodeEnv === 'production' ? 'production' : 'development'
}

function parseMinLevel(env: 'development' | 'production'): PinoLevel {
  const raw = conf.log.minLevel?.toLowerCase()
  if (raw && PINO_LEVELS.includes(raw as PinoLevel)) return raw as PinoLevel
  return env === 'production' ? 'info' : 'trace'
}

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

function validateDir(dir: string): string {
  if (!dir || dir.trim() === '') {
    process.stderr.write('LOG_DIR is empty — falling back to /logs\n')
    return '/logs'
  }
  return path.resolve(dir)
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function loadConfig(): LogConfig {
  const dir = validateDir(conf.log.dir ?? '/logs')
  const config: LogConfig = {
    dir,
    //enabled: parseBool(conf.log.enabled, true),
    enabled: conf.log.enabled ?? true,
    console: conf.log.console ?? true,
    file: conf.log.file ?? true,
    maxFileSizeMb: conf.log.maxFileSizeMb ?? 50,
    bufferMaxEntries: conf.log.bufferMaxEntries ?? 10000,
    env: parseEnv(),
    minLevel: parseMinLevel(parseEnv()),
    transportMuted: parseTransportMuting()
  }

  return Object.freeze(config)     // immutable après chargement
}

// ─── Singleton ────────────────────────────────────────────────────────────────
export const config: LogConfig = loadConfig()