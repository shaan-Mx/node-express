// src/middleware/httpLogger.ts

// Middleware de logging HTTP automatique — une requête = une ligne de log
// Winston utilise morgan, Pino utilise pino-http (plus performant)
import { config } from '../config/env'
import type { RequestHandler } from "express"
import type { Logger } from "pino"
import type { HttpLogger } from "pino-http"
import { IncomingMessage, ServerResponse } from 'http'

const lib = config.log.lib || "pino"
const isDev = config.nodeEnv !== "production"

// ── Pino : pino-http ──────────────────────────────────────────────────────────
async function createPinoHttpLogger(): Promise<RequestHandler> {
  const { pinoInstance } = await import("../utils/logger/logger.pino")
  const { default: pinoHttp } = await import("pino-http")
  return pinoHttp({
    // lien avec le logger global pour partager la configuration et les streams
    logger: pinoInstance,
    // Champs inclus dans chaque log de requête
    customLogLevel: (_req: IncomingMessage, res: ServerResponse) => {
      if (res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => { 
      const url = (req as any).originalUrl || req.url // originalUrl conserve l'URL complète
      return `http[${req.method}${url} →${res.statusCode}]`
    },
    customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) => {
      const url = (req as any).originalUrl || req.url
      return `http[${req.method} ${url} →${res.statusCode}|${err.message}]`
    },
    // Ignorer certaines url 
    /*  gere par logger global via le serializer req
    autoLogging: {
      ignore: (req) => isUrlToIgnore(req.url),
    },
    */
    // Champs exposés dans le log
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        userAgent: req.headers["user-agent"],
      }),
      res: (res) => ({
        statusCode: res.statusCode,
        time: res.responseTime, // ajouté par pino-http
        // h: res.headers, // attention aux données sensibles dans les headers
      }),
    },
  }) 
}

// ── Winston : morgan ──────────────────────────────────────────────────────────
async function createMorganWinstonLogger(): Promise<RequestHandler> {
  const { default: morgan } = await import("morgan")
  const { winstonInstance } = await import("../utils/logger/logger.winston")
  // Rediriger le stream morgan vers Winston
  const stream = {
    write: (msg: string) => winstonInstance.http(msg.trim()),
  }
  const format = isDev
    ? ":method :url :status :res[content-length] - :response-time ms"
    : "combined"
  return morgan(format, { stream })
}

// ── Sélecteur ─────────────────────────────────────────────────────────────────
export async function createHttpLogger(): Promise<RequestHandler> {
  switch (lib) {
    case "winston":
      return createMorganWinstonLogger()
    case "pino":
    default:
      return createPinoHttpLogger()
  }
}
