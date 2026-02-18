import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'
import { sendError, createError } from '../utils/response'
import { ErrorCode } from '../types/api'

/**
 * Middleware de gestion d'erreurs global
 * Doit être le dernier middleware dans la chaîne
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log l'erreur pour le debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })
  // Si c'est une AppError personnalisée
  if (err instanceof AppError) {
    sendError(
      res,
      {
        message: err.message,
        code: err.code,
        ...(err.details && { details: err.details })
      },
      err.statusCode
    )
    return
  }
  // Si c'est une erreur de validation Express
  if (err.name === 'ValidationError') {
    sendError(
      res,
      createError(ErrorCode.VALIDATION_ERROR, err.message),
      400
    )
    return
  }
  // Si c'est une erreur de syntaxe JSON
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(
      res,
      createError(ErrorCode.INVALID_INPUT, 'JSON invalide dans le corps de la requête'),
      400
    )
    return
  }
  // Erreur générique non gérée
  sendError(
    res,
    createError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Une erreur interne est survenue',
      process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
    ),
    500
  )
}

/**
 * Middleware pour gérer les routes non trouvées (404)
 * Doit être placé après toutes les routes définies
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    createError(
      ErrorCode.NOT_FOUND,
      `Route not found: ${req.method} ${req.url}`
    ),
    404
  )
}

/**
 * Wrapper pour les handlers async
 * Permet de catch automatiquement les erreurs des fonctions async
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}