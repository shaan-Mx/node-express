// src/middleware/paginate.ts
/**
 * Middleware de pagination — à placer avant le handler de la route
 *
 * Supporte deux modes :
 *   - page number : GET /products?page=2&limit=10
 *   - offset      : GET /products?offset=20&limit=10
 *
 * @param defaultLimit  Nombre d'éléments par page par défaut (défaut: 20)
 * @param maxLimit      Nombre maximum autorisé par page (défaut: 100)
 *
 * @example
 *   router.get('/', paginate(), asyncHandler(...))
 *   router.get('/', paginate(10, 50), asyncHandler(...))
 * 
 * @returns req.pagination = { limit, offset, page }
 */

import type { Request, Response, NextFunction } from 'express'
import { config } from '../config/env'
import { createPaginationMeta } from '../utils/response'
import type { PaginationMeta } from '../types/api'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PaginationParams {
  limit:  number
  offset: number
  page:   number
}
// ✅ Sort inline — paramètres optionnels passés via query string
export interface SortParams {
  sortBy?:  string
  sortDir?: 'ASC' | 'DESC'
}
export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}
// ── Extension de l'interface Request Express ──────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      pagination: PaginationParams
      sort: SortParams
    }
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────
export function paginate(defaultLimit = 20, maxLimit = 100) {
  return (req: Request, res: Response, next: NextFunction): void => {

    // ── Pagination ────────────────────────────────────────────────────────
    const defaultLimit = config.pagination.defaultLimit
    const maxLimit     = config.pagination.maxLimit
    // ✅ Validation explicite des paramètres
    if (req.query.limit && isNaN(parseInt(req.query.limit as string))) {
      res.status(400).json({ error: 'Invalid pagination parameter: limit must be a number' })
      return
    }
    if (req.query.offset && isNaN(parseInt(req.query.offset as string))) {
      res.status(400).json({ error: 'Invalid pagination parameter: offset must be a number' })
      return
    }
    if (req.query.page && isNaN(parseInt(req.query.page as string))) {
      res.status(400).json({ error: 'Invalid pagination parameter: page must be a number' })
      return
    }
    // limit : borné entre 1 et maxLimit
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || defaultLimit, 1),
      maxLimit
    )
    // actualisation de page ET offset
    let offset: number
    let page: number
    if (req.query.page) {
      // Mode page number : page=2&limit=10 → offset=10
      // pas de page negative !
      page = Math.max(parseInt(req.query.page as string) || 1, 1)
      offset = (page - 1) * limit
    } else {
      // Mode offset : offset=20&limit=10 → page=3
      offset = Math.max(parseInt(req.query.offset as string) || 0, 0)
      page = Math.floor(offset / limit) + 1
    }
    req.pagination = { limit, offset, page }

    // ── Sort inline ────────────────────────────────────────────────────────
    const sortDir = (req.query.sortDir as string || '').toUpperCase()
    req.sort = {
      sortBy:  req.query.sortBy  ? (req.query.sortBy as string) : undefined,
      sortDir: sortDir === 'DESC' ? 'DESC' : sortDir === 'ASC' ? 'ASC' : undefined,
    }

    // ── Next ────────────────────────────────────────────────────────
    next()
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Applique le sort inline sur un tableau de données
 * Utilisé par les routes GET / avant applyPagination()
 */
export function applySort<T>(data: T[], sort: SortParams): T[] {
  const s = sort.sortBy ? `${sort.sortBy}-${sort.sortDir}` : `undefined`
  //console.log(`BackEnd.paginate.applySort(${s}): `,data)
  if (!sort.sortBy) return data
  return [...data].sort((a: any, b: any) => {
    const aVal = a[sort.sortBy!]
    const bVal = b[sort.sortBy!]
    // Comparaison numérique si les deux valeurs sont des nombres
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sort.sortDir === 'DESC' ? bVal - aVal : aVal - bVal
      /*
      if (sort.sortDir === 'DESC') {
        console.log(`aVal=${aVal} bVal=${bVal}) : bVal - aVal = ${bVal - aVal}`)
        return bVal - aVal
      } else {
        console.log(`aVal=${aVal} bVal=${bVal}) : aVal - bVal = ${aVal - bVal}`)
        return aVal - bVal
      }
      */
    }
    // Comparaison string sinon
    const aStr = String(aVal ?? '')
    const bStr = String(bVal ?? '')
    const cmp  = aStr.localeCompare(bStr)
    return sort.sortDir === 'DESC' ? -cmp : cmp
  })
}
/**
 * Applique la pagination sur un tableau de données déjà chargées.
 * Retourne les données paginées + les métadonnées.
 *
 * @example
 *   const data = await readFromJson<Product>(DATA_FILE)
 *   const { data: paginatedData, meta } = applyPagination<Product>(data, req.pagination)
 *   return sendSuccess(res, paginatedData, 200, meta)
 */
export function applyPagination<T>(
  data:   T[],
  params: PaginationParams
): PaginatedResult<T> {
  const { limit, offset } = params
  return {
    data: data.slice(offset, offset + limit),
    meta: createPaginationMeta(data.length, limit, offset),
  }
}