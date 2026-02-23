// src/utils/logger/logger.pino.ts

import { config } from '../../config/env'
import pino from 'pino'
import type { ILogger } from './iLogger'
import { mkdirSync, createWriteStream } from 'node:fs'

const isDev = config.nodeEnv !== 'production'

// ── Streams ──
type StreamEntry = { 
  name: string
  level: string
  stream: NodeJS.WritableStream 
}

const streamList: StreamEntry[] = [
  // Console — toujours actif, en debug en dev et info en prod
  { 
    name: 'console',
    level:  isDev ? 'debug' : 'info',
    stream: isDev
      ? (await import('pino-pretty')).default({
          colorize: true,
          translateTime: false, //'HH:MM:ss'
          messageFormat: '{msg}',
          singleLine: false,
          errorLikeObjectKeys: ['err', 'error'],
        })
      : process.stdout,
  },
]
if (config.log.toFile) { 
  // creation du repertoire logs s'il n'existe pas
  mkdirSync(config.log.folder, { recursive: true })
  // Stream vers fichier pour tous les logs (niveau debug et plus)
  streamList.push(
    {
      name: 'globalFile',
      level:  'debug',
      stream: createWriteStream(`${config.log.folder}/global.log`, { flags: 'a', encoding: 'utf-8' }),
    },
    {
      name: 'errorFile',
      level:  'error',
      stream: createWriteStream(`${config.log.folder}/error.log`, { flags: 'a', encoding: 'utf-8' }),
    }
  )
}
/*  Le rôle de pino.multistream(streamList) est de combiner plusieurs destinations de logs en une seule instance de stream.
    1.Écrire simultanément vers plusieurs cibles
    2.Appliquer des niveaux de log différents par destination — Chaque stream a son propre level 
    3.Optimiser les performances — pino gère la distribution des logs vers les différentes cibles sans dupliquer inutilement les messages
    4.Centraliser la configuration des logs 
  Concrètement, quand vous appelez pinoInstance.info(meta, msg), le message est routé vers tous les streams selon leurs 
  niveaux respectifs. Par exemple, un log error ira à la fois à la console ET aux deux fichiers.
*/
const streams = pino.multistream(streamList)

const pinoInstance = pino(
  {
    enabled: config.log.enabled,
    level: isDev ? 'debug' : 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    // Remap level → severity pour Datadog / GCP en prod
    ...(!isDev && {
      formatters: {
        level: (label) => ({ level: label, severity: label.toUpperCase() }),
      },
    }),
  },
  streams
)

// ── Adaptateur vers ILogger ──
// logger = choicelogger() -> pinoLogger
export const pinoLogger: ILogger = {
  info:  (msg, meta = {}) => pinoInstance.info(meta, msg),
  warn:  (msg, meta = {}) => pinoInstance.warn(meta, msg),
  error: (msg, meta = {}) => pinoInstance.error(meta, msg),
  debug: (msg, meta = {}) => pinoInstance.debug(meta, msg),
  http:  (msg, meta = {}) => pinoInstance.info(meta, msg),   // pino n'a pas de niveau http
}

// Export de l'instance brute — utilisée dans middleware/httpLogger.ts
export { pinoInstance }