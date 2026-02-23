// src/controllers/UserController.ts
import { config } from '../config/env'
import type { Request, Response } from 'express'
import { resolveDataFile } from '../utils/resolveDataFile'
import { sendSuccess, sendSuccessSimple, sendCreated, sendDeleted, } from '../utils/response'
import type { SearchCriteria } from '../utils/query'

import { userService } from '../services/userService'

/**
 * Controller utilisateur — couche entre les routes et le service.
 * Même responsabilités que ProductController, sur User.
 */
export class UserController {

  // GET /env
  async getEnv(req: Request, res: Response): Promise<Response> {
    return sendSuccessSimple(res, {
      dataSource: config.dataSource,
      filePath:   resolveDataFile('user'),
      pagination: config.pagination,
    })
  }

  // GET /
  async getAll(req: Request, res: Response): Promise<Response> {
    const { data, meta } = await userService.findAll(req.pagination, req.sort)
    return sendSuccess(res, data, 200, meta)
  }

  // GET /:id
  async getById(req: Request, res: Response): Promise<Response> {
    const id = req.params.id as string
    const user = await userService.findById(id)
    return sendSuccess(res, user)
  }

  // POST /search
  async search(req: Request, res: Response): Promise<Response> {
    const criteria: SearchCriteria = req.body
    const { data, meta } = await userService.search(criteria, req.pagination)
    return sendSuccess(res, data, 200, meta)
  }

  // POST /
  async create(req: Request, res: Response): Promise<Response> {
    const user = await userService.create(req.body)
    return sendCreated(res, user)
  }

  // PUT /:id
  async update(req: Request, res: Response): Promise<Response> {
    const id = req.params.id as string
    const user = await userService.update(id, req.body)
    return sendSuccess(res, user)
  }

  // DELETE /:id
  async remove(req: Request, res: Response): Promise<Response> {
    const id = req.params.id as string
    await userService.delete(id)
    return sendDeleted(res, `User ${id} deleted`)
  }
}

// ✅ Singleton
export const userController = new UserController()