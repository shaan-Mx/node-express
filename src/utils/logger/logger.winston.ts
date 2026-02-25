// src/utils/logger/logger.winston.ts

import { config } from '../../config/env'
import winston from 'winston'
import type { ILogger } from './iLogger'

const { combine, timestamp, colorize, printf, json, errors } = winston.format

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Definition des formats
 */
// ── Format développement — lisible, colorisé ─────────────────────────────────
const devConsoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n  ${JSON.stringify(meta, null, 2)}` : ''
    const stackStr = stack ? `\n${stack}` : ''
    return `${timestamp} [${level}] ${message}${metaStr}${stackStr}`
  })
)
// ── Format fichier dev — lisible, SANS couleurs ───────────────────────────────
const devFileFormat = combine(
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n  ${JSON.stringify(meta, null, 2)}` : ''
    const stackStr = stack ? `\n${stack}` : ''
    return `${timestamp} [${level}] ${message}${metaStr}${stackStr}`
  })
)
// ── Format production — JSON structuré (Datadog, Logtail, CloudWatch...) ─────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
)

/**
 * Definition des transports
 * Selon conditions de config.log
 */
// ── Transports ───
const transports: winston.transport[] = []
if (config.log.toConsole) {
  transports.push(
    new winston.transports.Console({
      format: isDev ? devConsoleFormat : prodFormat,
    })
  )
}
if (config.log.toFile) {
  transports.push(
    new winston.transports.File({
      filename: `${config.log.folder}/error.log`,
      level: 'error',
      format: isDev ? devFileFormat : prodFormat,
      maxsize: 10 * 1024 * 1024,   // rotation à 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: `${config.log.folder}/global.log`,
      format: isDev ? devFileFormat : prodFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    })
  )
  if (!isDev) {
    // Production uniquement : fichier séparé pour les accès HTTP
    transports.push(
      new winston.transports.File({
        filename: `${config.log.folder}/access.log`,
        level: 'http',
        format: prodFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 7,
      })
    )
  }
}
/**
 * Definition des transports SANS console 
 * pour fileOnly() qui écrit uniquement dans les fichiers
 */
const fileOnlyTransports = transports.filter(
  t => !(t instanceof winston.transports.Console)
)

// ── Instance Winston ───
const winstonInstance = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  // ✅ silent: true désactive tous les transports sans les supprimer
  silent: !config.log.enabled,
  transports, // chaque transport a son format défini ci-dessus
  // Ne pas crasher sur uncaughtException
  exitOnError: false,
})
// ── Instance file-only───
const winstonFileOnly = config.log.toFile
  ? winston.createLogger({
      level: isDev ? 'debug' : 'info',
      silent: !config.log.enabled,
      transports: fileOnlyTransports,
      exitOnError: false,
    })
  : null  // pas de fichiers configurés — fileOnly est un no-op

// ── Référence au transport Console pour mute/unmute ───────────────────────────
const _consoleTransport = transports.find(
  t => t instanceof winston.transports.Console
) as winston.transports.ConsoleTransportInstance | undefined

// ── Adaptateur vers ILogger ───────────────────────────────────────────────────
export const winstonLogger: ILogger = {
  info:  (msg, meta = {}) => winstonInstance.info(msg, meta),
  warn:  (msg, meta = {}) => winstonInstance.warn(msg, meta),
  error: (msg, meta = {}) => winstonInstance.error(msg, meta),
  debug: (msg, meta = {}) => winstonInstance.debug(msg, meta),
  http:  (msg, meta = {}) => winstonInstance.http(msg, meta),
  // ✅ fileOnly — logger sans console transport
  fileOnly: (level, msg, meta = {}) => {
    if (!winstonFileOnly) return  // no-op si LOG_TO_FILE=false
    winstonFileOnly[level](msg, meta)
  },
  // ✅ muteConsole / unmuteConsole — natif Winston via transport.silent
  muteConsole: () => {
    if (_consoleTransport) _consoleTransport.silent = true
  },
  unmuteConsole: () => {
    if (_consoleTransport) _consoleTransport.silent = false
  },
}

// Export de l'instance brute — utilisée dans httpLogger.winston.ts
export { winstonInstance }