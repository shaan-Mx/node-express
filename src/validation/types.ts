// src/validation/types.ts
// Même interface backend/frontend
// le middleware et les routes n'ont pas besoin de savoir quelle library est utilisée

export interface ParseSuccess<T> {
  success: true
  data:    T
}
export interface ParseFailure {
  success: false
  errors:  Record<string, string[]>  // { field: ['message'] }
}
export type ParseResult<T> = ParseSuccess<T> | ParseFailure

/**
 * Contrat commun qu'un schéma doit respecter,
 * quelle que soit la lib de validation sous-jacente.
 */
export interface Schema<T> {
  parse(data: unknown): ParseResult<T>
  // ✅ parseField : valide un seul champ (pour la validation à la frappe)
  // inutile pour backend, conservé pour raison d'unicité de fichier backend/frontend
  parseField?(field: string, value: unknown): ParseResult<unknown>
}
