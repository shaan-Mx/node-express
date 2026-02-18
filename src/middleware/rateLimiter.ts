import rateLimit from 'express-rate-limit'
import type { Request, Response } from 'express'

/**
 * Rate limiter global
 * Limite : 100 requêtes par 15 minutes par IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite de 100 requêtes par windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP address, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true, // Retourne les infos dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  // ✅ CORRECTION: Ne pas définir de keyGenerator personnalisé
  // express-rate-limit gère automatiquement IPv4 et IPv6
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests from this IP address, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    })
  },
  // Ne pas compter les requêtes qui ont échoué
  skipFailedRequests: false,
  // Ne pas compter les requêtes réussies
  skipSuccessfulRequests: false,
})

/**
 * Rate limiter strict pour les opérations d'écriture (POST, PUT, DELETE)
 * Limite : 20 requêtes par 15 minutes
 */
export const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limite de 20 requêtes d'écriture
  message: {
    success: false,
    error: {
      message: 'Too many changes from this IP address, please slow down',
      code: 'WRITE_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Appliquer uniquement aux méthodes d'écriture
  skip: (req: Request): boolean => {
    return !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many changes from this IP address, please slow down',
        code: 'WRITE_RATE_LIMIT_EXCEEDED'
      }
    })
  },
})

/**
 * Rate limiter pour la recherche (endpoint /search)
 * Limite : 30 requêtes par 1 minute
 */
export const searchRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limite de 30 recherches par minute
  message: {
    success: false,
    error: {
      message: 'Too many searches, please wait a minute',
      code: 'SEARCH_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
})