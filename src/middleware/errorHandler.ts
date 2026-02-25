import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import { AppError } from '../utils/AppError'
import { sendError, createError } from '../utils/response'
import { ErrorCode } from '../types/api'
import { logger } from '../logger'


/**
 * Wrapper pour les handlers async
 * Permet de catch automatiquement les erreurs des fonctions async
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Middleware de gestion d'erreurs global
 * ⚠️⚠️ IMPORTANT ⚠️⚠️ Doit être le dernier middleware dans la chaîne !!
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  
  // ── Erreurs applicatives connues (AppError) ──
  if (err instanceof AppError) {
    /*
    logger.warn(`[${err.code}] ${err.message}`, {
      method:     req.method,
      url:        req.url,
      statusCode: err.statusCode,
    })
    */
    logger.error({ msg: 'AppError', errCode: err.code, errMessage: err.message, statusCode: err.statusCode, method: req.method, url: req.url })
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code:    err.code,
      },
    })
    return
  }

  // ── Erreurs inattendues ──
  /*
  logger.error(`Unhandled error: ${err.message}`, {
    method: req.method,
    url:    req.url,
    stack:  err.stack,
  }) */
  logger.error({ msg: 'Unhandled error', error: err.message, method: req.method, url: req.url })
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code:    ErrorCode.INTERNAL_SERVER_ERROR,
    },
  })
}

/**
 * Middleware pour gérer les routes non trouvées (404)
 * Doit être placé après toutes les routes définies
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  /*
  logger.error(`Route not found`, { method: req.method, url: req.url })
  */
  logger.error({ msg: 'Route not found', errCode: ErrorCode.NOT_FOUND, method: req.method, url: req.url })
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.url} not found`,
      code:    ErrorCode.NOT_FOUND,
    },
  })
}

export const errorHandler_obsolete = (
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