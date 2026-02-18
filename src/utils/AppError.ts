import { ErrorCode, ErrorMessages } from '../types/api'

/**
 * Classe d'erreur personnalisée pour l'application
 * Étend la classe Error native avec des propriétés supplémentaires
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCode
  public readonly isOperational: boolean
  public readonly details?: any

  constructor(
    code: ErrorCode,
    message?: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    // Appelle le constructeur de Error avec le message
    super(message || ErrorMessages[code])
    
    // Propriétés personnalisées
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details
    
    // Maintient le bon stack trace (uniquement disponible en V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    
    // Définit le prototype correctement
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /**
   * Convertit l'erreur en objet JSON
   */
  toJSON() {
    return {
      message: this.message,
      code: this.code,
      ...(this.details && { details: this.details })
    }
  }
}

/**
 * Factory functions pour créer des erreurs spécifiques
 */

/**
 * Erreur de validation
 */
export class ValidationError extends AppError {
  constructor(message?: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details)
  }
}

/**
 * Erreur "non trouvé"
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Ressource', id?: string | number) {
    const message = id 
      ? `${resource} non trouvé avec l'id: ${id}`
      : `${resource} non trouvé`
    super(ErrorCode.NOT_FOUND, message, 404)
  }
}

/**
 * Erreur "déjà existe"
 */
export class AlreadyExistsError extends AppError {
  constructor(resource: string = 'Ressource', identifier?: string) {
    const message = identifier
      ? `${resource} existe déjà: ${identifier}`
      : `${resource} existe déjà`
    super(ErrorCode.ALREADY_EXISTS, message, 409)
  }
}

/**
 * Erreur de lecture de fichier
 */
export class FileReadError extends AppError {
  constructor(filePath?: string, details?: any) {
    const message = filePath
      ? `Erreur lors de la lecture du fichier: ${filePath}`
      : 'Erreur lors de la lecture du fichier'
    super(ErrorCode.FILE_READ_ERROR, message, 500, details)
  }
}

/**
 * Erreur d'écriture de fichier
 */
export class FileWriteError extends AppError {
  constructor(filePath?: string, details?: any) {
    const message = filePath
      ? `Erreur lors de l'écriture du fichier: ${filePath}`
      : 'Erreur lors de l\'écriture du fichier'
    super(ErrorCode.FILE_WRITE_ERROR, message, 500, details)
  }
}

/**
 * Erreur de base de données
 */
export class DatabaseError extends AppError {
  constructor(message?: string, details?: any) {
    super(ErrorCode.DATABASE_ERROR, message, 500, details)
  }
}

/**
 * Erreur non autorisé
 */
export class UnauthorizedError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.UNAUTHORIZED, message, 401)
  }
}

/**
 * Erreur accès interdit
 */
export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.FORBIDDEN, message, 403)
  }
}