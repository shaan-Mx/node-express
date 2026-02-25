// logger/transports/console.ts
/*
Deux choix notables :
node:util est utilisé pour inspect en dev
        Il formate les objets imbriqués avec couleurs et indentation sans dépendance externe. 
        En production, JSON brut uniquement.
error et fatal sont redirigés sur stderr plutôt que stdout
        Cohérent avec les conventions Unix et permet de les séparer facilement au niveau infra.
*/

import * as node_util from 'node:util'
import type { Transport, LogEntry, ConsoleTransportOptions } from '../types'
import { config } from '../config'
import { shouldReceive } from './interface'

// ─── formating ───

const LEVEL_COLORS: Record<string, string> = {
  trace: '\x1b[37m',    // blanc
  debug: '\x1b[36m',    // cyan
  info:  '\x1b[32m',    // vert
  warn:  '\x1b[33m',    // jaune
  error: '\x1b[31m',    // rouge
  fatal: '\x1b[35m',    // magenta
}
const RESET = '\x1b[0m'

function formatDev(entry: LogEntry): string {
  const { level, msg, timestamp, ...rest } = entry
  const color = LEVEL_COLORS[level] ?? RESET
  const time = new Date(timestamp).toISOString()
  const extra = Object.keys(rest).length > 0
    ? '\n' + node_util.inspect(rest, { colors: true, depth: 4, compact: false })
    : ''
  return `${color}[${level.toUpperCase()}]${RESET} ${time} — ${msg}${extra}`
}

function formatProd(entry: LogEntry): string {
  return JSON.stringify(entry)
}

function format(entry: LogEntry): string {
  return config.env === 'development' ? formatDev(entry) : formatProd(entry)
}

// ─── transport ───

class ConsoleTransport implements Transport {
  readonly name = 'console'
  muted: boolean
  constructor(options: ConsoleTransportOptions = {}) {
    this.muted = options.muted ?? config.transportMuted['console'] ?? false
  }
  async write(entry: LogEntry): Promise<void> {
    if (!shouldReceive(this, entry)) return
    if (!config.console) return
    const line = format(entry)
    // error et fatal → stderr, reste → stdout
    if (entry.level === 'error' || entry.level === 'fatal') {
      process.stderr.write(line + '\n')
    } else {
      process.stdout.write(line + '\n')
    }
  }
}

// ─── factory ───

export function createConsoleTransport(options?: ConsoleTransportOptions): Transport {
  return new ConsoleTransport(options)
}