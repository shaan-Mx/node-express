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
import { ANSI } from '../../utils/colors'


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
const LEVEL_STYLES: Record<string, { fg: string; bg: string }> = {
  trace: { fg: ANSI.WHITE,   bg: ANSI.BG_WHITE   },
  debug: { fg: ANSI.CYAN,    bg: ANSI.BG_CYAN    },
  info:  { fg: ANSI.GREEN,   bg: ANSI.BG_GREEN   },
  warn:  { fg: ANSI.YELLOW,  bg: ANSI.BG_YELLOW  },
  error: { fg: ANSI.RED,     bg: ANSI.BG_RED     },
  fatal: { fg: ANSI.MAGENTA, bg: ANSI.BG_MAGENTA },
}


function formatDev(entry: LogEntry): string {
  const { level, msg, timestamp, ...rest } = entry
  const style = LEVEL_STYLES[level] ?? { fg: ANSI.WHITE, bg: ANSI.BG_BLACK }
  const time = new Date(timestamp).toISOString()
  // badge : fond coloré + texte blanc brillant + bold
  const badge = `${style.bg}${ANSI.BRIGHT_WHITE}${ANSI.BOLD} ${level.toUpperCase().padEnd(5)} ${ANSI.RESET}`
  // timestamp : gris discret
  const ts = `${ANSI.GRAY}${time}${ANSI.RESET}`
  // message : couleur fg du level
  const message = `${style.fg}${msg}${ANSI.RESET}`
  // autres données
  const extra = Object.keys(rest).length > 0
    ? '\n' + node_util.inspect(rest, { colors: true, depth: 4, compact: false })
    : ''
  return `${badge} ${ts} — ${message}${extra}`
}

function formatProd(entry: LogEntry): string {
  return JSON.stringify(entry)
}

function format(entry: LogEntry): string {
  return config.log.env === 'development' ? formatDev(entry) : formatProd(entry)
}

// ─── transport ───

class ConsoleTransport implements Transport {
  readonly name = 'console'
  muted: boolean
  constructor(options: ConsoleTransportOptions = {}) {
    this.muted = options.muted ?? false
  }
  async write(entry: LogEntry): Promise<void> {
    if (!shouldReceive(this, entry)) return
    if (!config.log.console) return
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