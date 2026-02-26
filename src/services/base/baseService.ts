// src/services/base/BaseService.ts
import { readFromJson, writeToJson } from '../../utils/file'
import { applyCriteria, type SearchCriteria } from '../../utils/query'
import { NotFoundError, FileReadError, FileWriteError } from '../../utils/AppError'
import { generateId, type IdGenerationMethod } from '../../utils/generateId'

import { applySort, applyPagination } from '../../middleware/paginate'
import type { PaginationParams, PaginatedResult, SortParams } from '../../middleware/paginate'
import type { IBaseService } from './iBaseService'

import { logger } from '@shaan_mex/logger'

/**
 * Classe générique centralisant les opérations CRUD sur fichier JSON.
 *
 * Responsabilités :
 *   - Lecture / écriture fichier (readFromJson / writeToJson)
 *   - Gestion d'erreurs (NotFoundError, FileReadError, FileWriteError)
 *   - Pagination et tri (applySort + applyPagination)
 *   - Génération d'ID
 *
 * Usage :
 *   class ProductService extends BaseService<Product> {
 *     constructor() { super(DATA_FILE, 'Product', 'nanoid') }
 *   }
 */
export abstract class BaseService<T extends { id: string }> implements IBaseService<T> {

  constructor(
    protected readonly dataFile: string,
    protected readonly resourceName: string,
    protected readonly idMethod: IdGenerationMethod = 'nanoid',
  ) {}

  // ── protected read/write ──

  protected async readAll(): Promise<T[]> {
    const data = await readFromJson<T>(this.dataFile)
    if (!data) throw new FileReadError(this.dataFile)
    return data
  }

  protected async writeAll(data: T[]): Promise<void> {
    const success = await writeToJson(data, this.dataFile)
    if (!success) throw new FileWriteError(this.dataFile)
  }

  // ── Génération d'ID ──

  protected generateNewId(existingIds: string[]): string {
    if (this.idMethod === 'sequential') {
      return generateId({ method: 'sequential', existingIds })
    }
    return generateId({ method: this.idMethod, length: 12 })
  }

  // ── Hook optionnel — surchargeable dans les sous-classes ──
  /**
   * Appelé juste avant l'insertion d'un nouvel item.
   * Permet d'enrichir les données (ex: created_at pour User).
   */
  protected beforeCreate(data: Omit<T, 'id'>, newId: string): T {
    return { id: newId, ...data } as T
  }

  // ── CRUD génériques ──

  async findAll(pagination: PaginationParams, sort: SortParams): Promise<PaginatedResult<T>> {
    /* logger.service(`${this.resourceName}.findAll`, {
      page: pagination.page, limit: pagination.limit, sort,
    }) */
    // logger.info({ msg: `${this.resourceName}.findAll`, domain: 'service', payload: { id: 42 } })
    logger.info({ msg: `${this.resourceName}.findAll`, domain: 'service', page: pagination.page, limit: pagination.limit, sortBy: sort.sortBy, sortDir: sort.sortDir })
    const data = await this.readAll()
    const sorted = applySort(data, sort)
    return applyPagination(sorted, pagination)
  }

  async findById(id: string): Promise<T> {
    /* logger.debug(`${this.resourceName}.findById`, { id }) */
    logger.info({ msg: `${this.resourceName}.findById`, domain: 'service', id: id })
    const data = await this.readAll()
    const found = data.find(item => item.id === id)
    if (!found) throw new NotFoundError(this.resourceName, id)
    return found
  }

  async search(criteria: SearchCriteria, pagination: PaginationParams): Promise<PaginatedResult<T>> {
    /* logger.debug(`${this.resourceName}.search`, { criteria, pagination }) */
    logger.info({ msg: `${this.resourceName}.search`, domain: 'service', criteria, page: pagination.page, limit: pagination.limit })
    const data = await this.readAll()
    const filtered = applyCriteria(data, { where: criteria.where, orderBy: criteria.orderBy })
    const params = {
      limit: criteria.limit  ?? pagination.limit,
      offset: criteria.offset ?? pagination.offset,
      page: pagination.page,
    }
    return applyPagination(filtered, params)
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const all = await this.readAll()
    const newId = this.generateNewId(all.map(item => item.id))
    const newItem = this.beforeCreate(data, newId)
    all.push(newItem)
    await this.writeAll(all)
    /* logger.info(`${this.resourceName}.create`, { id: newId }) */
    logger.info({ msg: `${this.resourceName}.create`, domain: 'service', id: newId })
    return newItem
  }

  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<T> {
    const all = await this.readAll()
    const index = all.findIndex(item => item.id === id)
    if (index === -1) throw new NotFoundError(this.resourceName, id)
    all[index] = { ...all[index], ...data, id }  // id immuable
    await this.writeAll(all)
    /* logger.info(`${this.resourceName}.update`, { id, fields: Object.keys(data) }) */
    logger.info({ msg: `${this.resourceName}.update`, domain: 'service', id: id, fields: Object.keys(data) })
    return all[index]
  }

  async delete(id: string): Promise<void> {
    const all = await this.readAll()
    const index = all.findIndex(item => item.id === id)
    if (index === -1) throw new NotFoundError(this.resourceName, id)
    all.splice(index, 1)
    await this.writeAll(all)
    /* logger.info(`${this.resourceName}.delete`, { id }) */
    logger.info({ msg: `${this.resourceName}.delete`, domain: 'service', id: id })
  }
}