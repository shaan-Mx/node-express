// src/services/UserService.ts
import { config } from '../config/env'
import { resolveDataFile } from '../utils/resolveDataFile'

import { BaseService } from './base/baseService'
import type { IdGenerationMethod } from '../utils/generateId'

import type { IUserService } from './interfaces/iUserService'
import type { User } from '../types/index'

//const DATA_SOURCE = (config.dataSource || 'local').toLowerCase()
const DATA_FILE = resolveDataFile('user')

const ID_METHOD = (config.userIdMethod as IdGenerationMethod) || 'nanoid'
/**
 * Service utilisateur — étend BaseService<User>
 *
 * Surcharge beforeCreate() pour injecter created_at automatiquement.
 * Ajoute la méthode métier findByEmail().
 */
export class UserService extends BaseService<User> implements IUserService {

  constructor() {
    super(DATA_FILE, 'User', ID_METHOD)
  }

  // ── Hook — enrichit les données avant insertion ───────────────────────────

  protected override beforeCreate(data: Omit<User, 'id'>, newId: string): User {
    return {
      id: newId,
      ...data,
      created_at: new Date().toISOString(),   // ✅ injecté automatiquement
    }
  }

  // ── Méthodes métier spécifiques aux utilisateurs ──────────────────────────

  async findByEmail(email: string): Promise<User | null> {
    const all = await this.readAll()
    return all.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null
  }
}

// ✅ Singleton
export const userService = new UserService()