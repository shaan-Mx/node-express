// logger/middleware/express.ts
/*
Le point le plus délicat ici est la dépendance circulaire potentielle entre le middleware et index.ts:
  le middleware a besoin du logger, mais index.ts importe le middleware. 
  La solution est setHttpLogger
    une fonction d'injection appelée une seule fois au boot dans index.ts, après que tous les modules sont chargés.
    Le middleware ne connaît jamais index.ts directement.
domain: 'http' est injecté automatiquement dans chaque entrée HTTP
  cela permet aux transports nommés filtrés sur 'http' de recevoir ces logs sans configuration supplémentaire.

npm install uuid
npm install --save-dev @types/uuid
*/
import type { RequestHandler, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import type { HttpMiddlewareOptions, InjectableField, LogEntry } from '../types'
import { runWithContext } from './request-context'
/*
import { buffer } from '../core/buffer'
inutile: le buffer est appelé indirectement via logHttpEntry, elle-même injectée par setHttpLogger depuis index.ts.
*/
import { config } from '../config'

// ─── default fields to inject ───

const DEFAULT_INJECT: InjectableField[] = ['method', 'url']

// ─── resolving level regarding HTTP status ───

function resolveLevel(statusCode: number): LogEntry['level'] {
  if (statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'warn'
  return 'info'
}

// ─── build Entry with injectables fields ───

function buildHttpEntry(
  req: Request,
  res: Response,
  requestId: string,
  durationMs: number,
  inject: InjectableField[]
): LogEntry {
  const dateNow = Date.now()
  const entry: LogEntry = {
    level: resolveLevel(res.statusCode),
    msg: 'http request',
    timestamp: dateNow,
    tsDate: new Date(dateNow).toISOString().slice(0,10),
    tsTime: new Date(dateNow).toLocaleTimeString(),
    requestId,
    status: res.statusCode,
    duration: durationMs,
    domain: 'http'
  }
  if (inject.includes('method')) entry.method = req.method
  if (inject.includes('url')) entry.url = req.originalUrl
  if (inject.includes('ip')) entry.ip = req.ip
  if (inject.includes('userAgent')) entry.userAgent = req.headers['user-agent']
  if (inject.includes('userId')) entry.userId = (req as any).user?.id ?? undefined
  return entry
}

// ─── middleware ───

export function httpLogger(options: HttpMiddlewareOptions = {}): RequestHandler {
  const resolveRequestId = options.resolveRequestId ?? (() => uuidv4())
  const inject = options.inject ?? DEFAULT_INJECT
  return (req, res, next) => {
    if (!config.enabled) return next()
    const requestId = resolveRequestId(req)
    const start = Date.now()
    runWithContext({ requestId }, () => {
      res.on('finish', () => {
        const entry = buildHttpEntry(
          req,
          res,
          requestId,
          Date.now() - start,
          inject
        )
        // les transports sont résolus au moment du log — pas au boot
        // httpLogger n'a pas accès direct aux transports enregistrés
        // on passe par le buffer via l'instance logger exportée
        logHttpEntry(entry)
      })
      next()
    })
  }
}

// ─── delaying logger injection ───
// evite la dépendance circulaire middleware → index → middleware
// le logger est injecté une seule fois au démarrage via setHttpLogger

let logHttpEntry: (entry: LogEntry) => void = () => {}

export function setHttpLogger(fn: (entry: LogEntry) => void): void {
  logHttpEntry = fn
}