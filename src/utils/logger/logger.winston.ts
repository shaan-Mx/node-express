// src/utils/logger/logger.winston.ts

import { config } from '../../config/env'
import winston from 'winston'
import type { ILogger } from './iLogger'

const { combine, timestamp, colorize, printf, json, errors } = winston.format

const isDev = process.env.NODE_ENV !== 'production'

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

// ── Transports ────────────────────────────────────────────────────────────────
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isDev ? devConsoleFormat : prodFormat,
  }),
]
// ✅ Fichiers — uniquement si LOG_TO_FILE=true
if (config.logToFile) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: isDev ? devFileFormat : prodFormat,
      maxsize: 10 * 1024 * 1024,   // rotation à 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: isDev ? devFileFormat : prodFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    })
  )
  if (!isDev) {
    // Production uniquement : fichier séparé pour les accès HTTP
    transports.push(
      new winston.transports.File({
        filename: 'logs/access.log',
        level: 'http',
        format:   prodFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 7,
      })
    )
  }
}

// ── Instance Winston ──────────────────────────────────────────────────────────
const winstonInstance = winston.createLogger({
  level:      isDev ? 'debug' : 'info',
  transports,
  // Ne pas crasher sur uncaughtException
  exitOnError: false,
})

// ── Adaptateur vers ILogger ───────────────────────────────────────────────────
export const winstonLogger: ILogger = {
  info:  (msg, meta = {}) => winstonInstance.info(msg, meta),
  warn:  (msg, meta = {}) => winstonInstance.warn(msg, meta),
  error: (msg, meta = {}) => winstonInstance.error(msg, meta),
  debug: (msg, meta = {}) => winstonInstance.debug(msg, meta),
  http:  (msg, meta = {}) => winstonInstance.http(msg, meta),
}

// Export de l'instance brute — utilisée dans httpLogger.winston.ts
export { winstonInstance }