// logger/types.ts

import type { Request } from 'express'

//type PinoLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
//export const PINO_LEVELS: PinoLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
export const PINO_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const
export type PinoLevel = typeof PINO_LEVELS[number]

// --- LogEntry ---

export interface LogEntry {
  level: PinoLevel
  msg: string
  timestamp: number           // Unix ms, posé avant le fanout
  domain?: string | string[]
  requestId?: string
  [key: string]: unknown
}

// --- Transports ---

export interface Transport {
  name: string
  muted: boolean
  write(entry: LogEntry): Promise<void>
}

export interface LevelTransportOptions {
  prefix: string              // ex: 'error' → error2026-01-28.log
  level: PinoLevel
  muted?: boolean
}

export interface NamedTransportOptions {
  name: string                // ex: 'trspHttp'
  prefix: string              // base du nom de fichier
  domains: string[]           // filtre strict — tableau obligatoire
  levels?: PinoLevel[]        // si absent: tous les levels sont acceptés
  muted?: boolean
}

export interface ConsoleTransportOptions {
  muted?: boolean
}

// --- Middleware  ---

export type InjectableField = 'method' | 'url' | 'ip' | 'userAgent' | 'userId'

export interface HttpMiddlewareOptions {
  resolveRequestId?: (req: Request) => string
  inject?: InjectableField[]
}

// --- Request Context (AsyncLocalStorage) ---

export interface RequestContext {
  requestId: string
}

// --- Buffer ---

export interface BufferEntry {
  entry: LogEntry
  transports: Transport[]
}

export interface BufferStats {
  queueLength: number
  dropCount: number
}

// --- Logger ---

// --- Request Context (AsyncLocalStorage) ---

export interface LoggerOptions {
  transports: Transport[]
}

export interface FlushOptions {
  timeoutMs?: number                  // default 2000
}

export interface Logger {
  trace(data: Omit<LogEntry, 'level' | 'timestamp'>): void
  debug(data: Omit<LogEntry, 'level' | 'timestamp'>): void
  info(data: Omit<LogEntry, 'level' | 'timestamp'>): void
  warn(data: Omit<LogEntry, 'level' | 'timestamp'>): void
  error(data: Omit<LogEntry, 'level' | 'timestamp'>): void
  fatal(data: Omit<LogEntry, 'level' | 'timestamp'>): void
  log(entry: LogEntry): void          // méthode bas niveau — timestamp déjà posé
  flush(options?: FlushOptions): Promise<void>
  stats(): BufferStats
}
