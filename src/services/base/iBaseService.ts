// src/services/base/IBaseService.ts
import type { SortParams, PaginationParams, PaginatedResult } from '../../middleware/paginate'
import type { SearchCriteria } from '../../utils/query'

/**
 * Interface générique pour tout service CRUD.
 * Facilite les tests unitaires et l'injection de dépendances.
 */
export interface IBaseService<T> {
  findAll(pagination: PaginationParams, sort: SortParams): Promise<PaginatedResult<T>>
  findById(id: string): Promise<T>
  search(criteria: SearchCriteria, pagination: PaginationParams): Promise<PaginatedResult<T>>
  create(data: Omit<T, 'id'>): Promise<T>
  update(id: string, data: Partial<Omit<T, 'id'>>): Promise<T>
  delete(id: string): Promise<void>
}