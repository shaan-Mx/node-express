// src/services/ProductService.ts
import { config } from '../config/env'
import { resolveDataFile } from '../utils/resolveDataFile'

import { BaseService } from './base/baseService'
import type { IdGenerationMethod } from '../utils/generateId'

import type { IProductService } from './interfaces/iProductService'
import type { Product } from '../types/index'

//const DATA_SOURCE = (config.dataSource || 'local').toLowerCase()
const DATA_FILE = resolveDataFile('product')

const ID_METHOD = (config.productIdMethod as IdGenerationMethod) || 'nanoid'

/**
 * Service product — étend BaseService<Product>
 *
 * Toute la logique CRUD générique vient de BaseService.
 * Seules les méthodes métier spécifiques aux produits sont ici.
 */
export class ProductService extends BaseService<Product> implements IProductService {

  constructor() {
    super(DATA_FILE, 'Product', ID_METHOD)
  }

  // ── Méthodes métier spécifiques aux produits ──

  async findByCategory(category: string): Promise<Product[]> {
    const all = await this.readAll()
    return all.filter(p => p.category.toLowerCase() === category.toLowerCase())
  }

  async findByPriceRange(min: number, max: number): Promise<Product[]> {
    const all = await this.readAll()
    return all.filter(p => p.price >= min && p.price <= max)
  }

}

// ✅ Singleton — une seule instance partagée dans toute l'app
export const productService = new ProductService()