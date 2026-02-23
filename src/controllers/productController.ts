// src/controllers/ProductController.ts
import { config } from '../config/env'
import type { Request, Response } from 'express'
import { resolveDataFile } from '../utils/resolveDataFile'
import { sendSuccess, sendSuccessSimple, sendCreated, sendDeleted, } from '../utils/response'
import type { SearchCriteria } from '../utils/query'

import { productService } from '../services/productService'

/**
 * Controller produit — couche entre les routes et le service.
 *
 * Responsabilités :
 *   - Extraire les données de req (params, body, pagination, sort)
 *   - Appeler le service
 *   - Formater et envoyer la réponse HTTP
 *
 * Aucune logique métier ici — tout est délégué à ProductService.
 */
export class ProductController {

  // GET /env
  async getEnv(req: Request, res: Response): Promise<Response> {
    return sendSuccessSimple(res, {
      dataSource: config.dataSource,
      filePath: resolveDataFile('product'),
      pagination: config.pagination,
    })
  }

  // GET /
  async getAll(req: Request, res: Response): Promise<Response> {
    const { data, meta } = await productService.findAll(req.pagination, req.sort)
    return sendSuccess(res, data, 200, meta)
  }

  // GET /:id
  /* note error TypeScript : findById(req.params.id)
        > Impossible d'assigner le type 'string[]' au type 'string'
    req.params.id est typé string | string[] à cause de la signature de Express.
    les types @types/express définissent ParamsDictionary comme { [key: string]: string } — ce qui devrait suffire, 
    mais selon la version et la configuration strict du tsconfig.json, 
    TypeScript peut inférer req.params[key] comme string | string[] par précaution.
    >>> mais on sait que dans notre route c'est toujours une string (/:id).
    Donc on peut faire un cast explicite : req.params.id as string
  */
  async getById(req: Request, res: Response): Promise<Response> {
    const reqId = req.params.id as string
    const product = await productService.findById(reqId)
    return sendSuccess(res, product)
  }

  // POST /search
  async search(req: Request, res: Response): Promise<Response> {
    const criteria: SearchCriteria = req.body
    const { data, meta } = await productService.search(criteria, req.pagination)
    return sendSuccess(res, data, 200, meta)
  }

  // POST /
  async create(req: Request, res: Response): Promise<Response> {
    const product = await productService.create(req.body)
    return sendCreated(res, product)
  }

  // PUT /:id
  async update(req: Request, res: Response): Promise<Response> {
    const reqId = req.params.id as string
    const product = await productService.update(reqId, req.body)
    return sendSuccess(res, product)
  }

  // DELETE /:id
  async remove(req: Request, res: Response): Promise<Response> {
    const reqId = req.params.id as string
    await productService.delete(reqId)
    return sendDeleted(res, `Product ${reqId} deleted`)
  }
}

// ✅ Singleton
export const productController = new ProductController()