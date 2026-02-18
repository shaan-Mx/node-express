import helmet from 'helmet'
import type { Request, Response, NextFunction } from 'express'

/**
 * Configuration Helmet pour sécuriser les headers HTTP
 * Protection contre les vulnérabilités courantes (XSS, clickjacking, etc.)
 */
export const securityMiddleware = helmet({
  // Content Security Policy - Protège contre XSS
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Empêche le navigateur de deviner le type MIME
  noSniff: true,
  // Protège contre le clickjacking
  frameguard: { action: 'deny' },
  // Force HTTPS (à activer en production)
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  },
  // Cache le header X-Powered-By (Express)
  hidePoweredBy: true,
  // Protège contre les attaques de téléchargement
  ieNoOpen: true,
  // Empêche le navigateur de garder les pages en cache
  xssFilter: true,
})

/**
 * Middleware pour assainir les entrées utilisateur
 * Enlève les caractères potentiellement dangereux
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body (peut être réassigné)
  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  // ✅ CORRECTION: req.query est en lecture seule, on modifie ses propriétés en place
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      const value = req.query[key]
      if (typeof value === 'string') {
        // @ts-ignore - On modifie la propriété existante, pas l'objet query lui-même
        req.query[key] = sanitizeString(value)
      } else if (Array.isArray(value)) {
        // @ts-ignore
        req.query[key] = value.map(v => typeof v === 'string' ? sanitizeString(v) : v)
      }
    })
  }
  next()
}

/**
 * Fonction pour nettoyer une string
 */
function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Enlève < et >
    .trim()
}

/**
 * Fonction récursive pour nettoyer les objets (body uniquement)
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key])
    }
    return sanitized
  }
  return obj
}
