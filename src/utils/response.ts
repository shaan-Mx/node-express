// src/utils/response.ts
/**
 * Handling API Responses
 */

import type { Response } from 'express'
import type { ApiSuccessResponse, ApiErrorResponse, PaginationMeta, ApiError } from '../types/api'
import { ErrorCode, ErrorMessages } from '../types/api'

/**
 * Handling Error
 */

/**
 * Envoie une réponse d'erreur standardisée
 * return res.status(500).json(response)
 */
export function sendError(
  res: Response,
  error: ApiError,
  statusCode: number = 500
): Response {
  const response: ApiErrorResponse = {
    success: false,
    error
  }
  return res.status(statusCode).json(response)
}
/**
 * Crée un objet erreur standardisé
 * return { message: message || ErrorMessages[code], code, ...(details && { details }) }
 */
export function createError(
  code: ErrorCode,
  message?: string,
  details?: any
): ApiError {
  return {
    message: message || ErrorMessages[code],
    code,
    ...(details && { details })
  }
}
/**
 * Helper pour les erreurs de validation
 * return sendError( res, createError(ErrorCode.VALIDATION_ERROR, message, details), 400 )
 */
export function sendValidationError(
  res: Response,
  message: string = 'Validation error',
  details?: any
): Response {
  return sendError(
    res,
    createError(ErrorCode.VALIDATION_ERROR, message, details),
    400
  )
}
/**
 * Helper pour les erreurs "not found"
 * return sendError( res, createError(ErrorCode.NOT_FOUND, message), 404 )
 */
export function sendNotFoundError(
  res: Response,
  resource: string = 'Ressource',
  id?: string | number
): Response {
  const message = id 
    ? `${resource} non trouvé avec l'id: ${id}`
    : `${resource} non trouvé`
  return sendError(
    res,
    createError(ErrorCode.NOT_FOUND, message),
    404
  )
}
/**
 * Helper pour les erreurs serveur
 * return sendError( res, createError(ErrorCode.INTERNAL_SERVER_ERROR, message, details), 500 )
 */
export function sendServerError(
  res: Response,
  message?: string,
  details?: any
): Response {
  return sendError(
    res,
    createError(ErrorCode.INTERNAL_SERVER_ERROR, message, details),
    500
  )
}

/**
 * Handling Success
 */

/**
 * Envoie une réponse de succès, sans utilisation de data<T> ni PaginationMeta
 * return res.status(200).json(response)
 */
export function sendSuccessSimple(
  res: Response,
  data: object,
  statusCode: number = 200,
): Response {
  const response = {
    success: true,
    data,
  }
  return res.status(statusCode).json(response)
}
/**
 * Envoie une réponse de succès standardisée, commune a plusieurs helpers
 * return res.status(200).json(response)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: PaginationMeta
): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta && { meta })
  }
  return res.status(statusCode).json(response)
}
/**
 * Helper pour les succès de création
 * return sendSuccess(res, data, 201)
 */
export function sendCreated<T>(
  res: Response,
  data: T
): Response {
  return sendSuccess(res, data, 201)
}
/**
 * Helper pour les succès de suppression
 * return sendSuccess(res, { message }, 200)
 */
export function sendDeleted(
  res: Response,
  message: string = 'Ressource supprimée avec succès'
): Response {
  return sendSuccess(res, { message }, 200)
}

/**
 * Handling Metadata
 */

/**
 * Helper pour créer des métadonnées de pagination
 * return { total, limit, offset, hasMore: offset + limit < total }
 */
export function createPaginationMeta(
  total:  number,
  limit:  number,
  offset: number
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const page       = Math.floor(offset / limit) + 1
  return {
    total,
    limit,
    offset,
    page,                               // ✅ page courante
    totalPages,                         // ✅ nombre total de pages
    hasMore: offset + limit < total,    // ✅ il y a une page suivante
    hasPrev: offset > 0,                // ✅ il y a une page précédente
  }
}
