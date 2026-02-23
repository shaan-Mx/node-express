// src/types/api.ts
/**
 * Types pour les réponses API standardisées
 */

/**
 * Structure d'erreur standardisée
 */
export interface ApiError {
  message: string
  code: string
  details?: any
}
/**
 * Métadonnées de pagination
 */
export interface PaginationMeta {
  total:      number   // total d'éléments
  limit:      number   // éléments par page
  offset:     number   // position de départ
  page:       number   // ✅ page courante
  totalPages: number   // ✅ nombre total de pages
  hasMore:    boolean  // il y a une page suivante
  hasPrev:    boolean  // ✅ il y a une page précédente
}
/**
 * Réponse API générique avec succès
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  meta?: PaginationMeta
}
/**
 * Réponse API générique avec erreur
 */
export interface ApiErrorResponse {
  success: false
  error: ApiError
  meta?: never
  data?: never
}

/**
 * Type union pour toutes les réponses API
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Codes d'erreur standardisés
 */
export enum ErrorCode {
  //------------------ Erreurs de validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  //------------------ Erreurs de ressources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  //------------------ Erreurs serveur
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  //------------------ Erreurs d'authentification/autorisation
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  //------------------ Erreurs de limite
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  WRITE_RATE_LIMIT_EXCEEDED = 'WRITE_RATE_LIMIT_EXCEEDED',
  SEARCH_RATE_LIMIT_EXCEEDED = 'SEARCH_RATE_LIMIT_EXCEEDED',

}
/**
 * Messages d'erreur par défaut pour chaque code
 */
export const ErrorMessages: Record<ErrorCode, string> = {

  [ErrorCode.VALIDATION_ERROR]: 'Erreur de validation des données',
  [ErrorCode.INVALID_INPUT]: 'Données d\'entrée invalides',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Champ requis manquant',
  
  [ErrorCode.NOT_FOUND]: 'Ressource non trouvée',
  [ErrorCode.ALREADY_EXISTS]: 'La ressource existe déjà',
  
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Erreur interne du serveur',
  [ErrorCode.DATABASE_ERROR]: 'Erreur de base de données',
  [ErrorCode.FILE_READ_ERROR]: 'Erreur de lecture du fichier',
  [ErrorCode.FILE_WRITE_ERROR]: 'Erreur d\'écriture du fichier',
  
  [ErrorCode.UNAUTHORIZED]: 'Non autorisé',
  [ErrorCode.FORBIDDEN]: 'Accès interdit',
  
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Limite de requêtes dépassée',
  [ErrorCode.WRITE_RATE_LIMIT_EXCEEDED]: 'Limite de modifications dépassée',
  [ErrorCode.SEARCH_RATE_LIMIT_EXCEEDED]: 'Limite de recherches dépassée',
  
}