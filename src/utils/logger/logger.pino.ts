// src/utils/logger/logger.pino.ts

import { config } from '../../config/env';
import type { Request, Response } from "express"
import pino from 'pino';
import type { ILogger } from './iLogger';
import { mkdirSync, createWriteStream } from 'node:fs'
import { Writable } from 'node:stream'

import { ANSI } from '../colors'
import { hostname } from 'node:os';

const isDev = config.nodeEnv !== 'production'

export const LEVELS_COLOR: Record<number, string> = {
  10: ANSI.GRAY,
  20: ANSI.CYAN,
  21: ANSI.BLUE, // custom level "custom"
  30: ANSI.GREEN,
  40: ANSI.YELLOW,
  50: ANSI.RED,
  60: ANSI.MAGENTA,
}

interface UrlsToIgnore {
  paths: string[]
  prefixes: string[]
}
const urlsToIgnore: UrlsToIgnore = {
  paths: ["/health", "/favicon.ico"],
  prefixes: ["/.well-known/appspecific"]
}
const isUrlToIgnore = (url: string): boolean => {
  const check =  urlsToIgnore.paths.includes(url) 
    || urlsToIgnore.prefixes.some(prefix => url.startsWith(prefix))
  console.log('Checking URL against ignore list:', url, check)
  return check
}

// ── Stream console personnalisé ───────────────────────────────────────────────
// Remplace pino-pretty — formate le JSON Pino en ligne lisible colorisée
const consoleStream = new Writable({
  write(chunk: Buffer, _encoding, callback) {
    try {
      const line = chunk.toString().trim()
      if (!line) { callback(); return }
      const log = JSON.parse(line)
      /* 
      { label: 'WARN', level: 40, time: '2026-02-23T23:28:20.472Z', pid: 8732, hostname: 'TANELORN', port: 3001, env: 'development', msg: 'Server started' } 
      */
      const { 
        label = 'UNKN', 
        level = 0,
        color = LEVELS_COLOR[log.level] ?? ANSI.GRAY,
        time: _t , 
        logDate = _t ? new Date(_t).toLocaleDateString() : 'xxxx-xx-xx',
        logTime = _t ? new Date(_t).toTimeString().slice(0, 8) : 'xx:xx:xx',
        pid: _p, 
        hostname: _h, 
        msg: _m = '<msg empty>',
        ...meta // Meta — tout sauf les champs internes pino
      } = log
      const metaStrWithCR = Object.keys(meta).length
        ? `${ANSI.DIM}${JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')}${ANSI.RESET}`
        : ''
      const metaStr = Object.keys(meta).length
        ? `${ANSI.DIM}${JSON.stringify(meta, null).replace(/\n/g, '')}${ANSI.RESET}`
        : ''
      const strOut = ANSI.DIM + logDate + '~' + logTime + ANSI.RESET + ' '
        + color + ANSI.BOLD + log.label + '(' + log.level + ')' + ANSI.RESET + ' '
        + hostname + '[' + log.pid + '] '
        + color + ANSI.ITALIC + _m + ANSI.RESET + ' '
        + '\n  ' + metaStrWithCR + '\n'
      process.stdout.write(strOut)
      // ecriture formatée et colorisée
      /*
      process.stdout.write(
        `${dim}${time}${reset} ${color}${bold}${label}${reset} ${msg}${metaStr}\n`
      ) */
    } catch {
      // JSON invalide (ex: ligne vide) — écrire brut
      console.log('Invalid log line (not JSON)')
      process.stdout.write(chunk)
    }
    callback()
  }
})

// ── Streams ──
type StreamEntry = {
  name: string;
  level: string;
  stream: NodeJS.WritableStream;
};

const streamList: StreamEntry[] = [];
if (config.log.toConsole) {
  streamList.push(
    {
      name: 'console',
      level: isDev ? 'debug' : 'info',
      stream: isDev ? consoleStream : process.stdout,
    },
  );
}
if (config.log.toFile) {
  // creation du repertoire logs s'il n'existe pas
  mkdirSync(config.log.folder, { recursive: true });
  // Stream vers fichier pour tous les logs (niveau debug et plus)
  streamList.push(
    {
      name: 'globalFile',
      level: 'info',
      stream: createWriteStream(`${config.log.folder}/global.log`, {
        flags: 'a',
        encoding: 'utf-8',
      }),
    },
    {
      name: 'errorFile',
      level: 'error',
      stream: createWriteStream(`${config.log.folder}/error.log`, {
        flags: 'a',
        encoding: 'utf-8',
      }),
    },
  );
}
/*  Le rôle de pino.multistream(streamList) est de combiner plusieurs destinations de logs en une seule instance de stream.
    1.Écrire simultanément vers plusieurs cibles
    2.Appliquer des niveaux de log différents par destination — Chaque stream a son propre level 
    3.Optimiser les performances — pino gère la distribution des logs vers les différentes cibles sans dupliquer inutilement les messages
    4.Centraliser la configuration des logs 
  Concrètement, quand vous appelez pinoInstance.info(meta, msg), le message est routé vers tous les streams selon leurs 
  niveaux respectifs. Par exemple, un log error ira à la fois à la console ET aux deux fichiers.
*/
const streams = pino.multistream(streamList);
const streamsFileOnly = config.log.toFile
  ? pino.multistream([
      { level: 'debug', stream: createWriteStream(`${config.log.folder}/global.log`, { flags: 'a', encoding: 'utf-8', }) },
      { level: 'error', stream: createWriteStream(`${config.log.folder}/error.log`, { flags: 'a', encoding: 'utf-8', }) },
    ])
  : null

// Options communes a TOUS les streams — console + fichiers
const pinoOptions = {
  level: !config.log.enabled ? 'silent' : (isDev ? 'debug' : 'info'), // Niveau minimum à afficher
  customLevels: {
    service: 21,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label:string, number:number) => {
      return { label: label.toUpperCase(), level: number };
    },
    // bindings: (b) => ({ ...b, pid: undefined }), // optionnel
  },
  // Ne pas loguer les requêtes ignorées
  serializers: {
    req: (req: Request) => {
      if (isUrlToIgnore(req.url)) {
        console.log('Ignoring log for URL:', req.url)
        return null; // ou null, pour ne pas loguer
      }
      return req; // log normal
    }
  },
  // en prod: remap level → severity pour Datadog / GCP
  ...(!isDev && {
    formatters: {
      level: (label:string) => ({ level: label, severity: label.toUpperCase() }),
    },
  }),
}
const pinoInstance = pino(pinoOptions, streams)
const pinoFileOnlyInstance = streamsFileOnly ? pino(pinoOptions, streamsFileOnly) : null

// ── muteConsole — Pino ne gère pas les streams individuellement après création
// On utilise un flag interne qui redirige vers fileOnly uniquement
let _consoleMuted = false
// ── Adaptateur vers ILogger ───────────────────────────────────────────────────
export const pinoLogger: ILogger = {
  info:  (msg, meta = {}) => _consoleMuted
    ? pinoFileOnlyInstance?.info(meta, msg)
    : pinoInstance.info(meta, msg),
  warn:  (msg, meta = {}) => _consoleMuted
    ? pinoFileOnlyInstance?.warn(meta, msg)
    : pinoInstance.warn(meta, msg),
  error: (msg, meta = {}) => _consoleMuted
    ? pinoFileOnlyInstance?.error(meta, msg)
    : pinoInstance.error(meta, msg),
  debug: (msg, meta = {}) => _consoleMuted
    ? pinoFileOnlyInstance?.debug(meta, msg)
    : pinoInstance.debug(meta, msg),
  service: (msg, meta = {}) => _consoleMuted
    ? pinoFileOnlyInstance?.service(meta, msg)
    : pinoInstance.service(meta, msg),
  http:  (msg, meta = {}) => _consoleMuted
    ? pinoFileOnlyInstance?.info(meta, msg) // info car pino ne possede pas de niveau http nativement
    : pinoInstance.info(meta, msg),
  // ✅ fileOnly — écrit uniquement dans les fichiers
  fileOnly: (level, msg, meta = {}) => {
    if (!pinoFileOnlyInstance) return  // no-op si LOG_TO_FILE=false
    pinoFileOnlyInstance[level](meta, msg)
  },
  // ✅ muteConsole / unmuteConsole — flag interne (Pino ne supporte pas nativement)
  muteConsole: () => { _consoleMuted = true  },
  unmuteConsole: () => { _consoleMuted = false },
}

// Export de l'instance brute — utilisée dans middleware/httpLogger.ts
export { pinoInstance };
