// src/services/interfaces/IProductService.ts
import type { IBaseService } from '../base/iBaseService'
import type { Product } from '../../types/index'

/**
 * Interface spécifique au service Product.
 * Étend IBaseService<Product> et déclare les méthodes métier propres aux produits.
 */
export interface IProductService extends IBaseService<Product> {
  findByCategory(category: string): Promise<Product[]>
  findByPriceRange(min: number, max: number): Promise<Product[]>
}