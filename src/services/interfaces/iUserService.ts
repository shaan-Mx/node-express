// src/services/interfaces/IUserService.ts
import type { IBaseService } from '../base/iBaseService'
import type { User } from '../../types/index'

/**
 * Interface spécifique au service User.
 * Étend IBaseService<User> et déclare les méthodes métier propres aux utilisateurs.
 */
export interface IUserService extends IBaseService<User> {
  findByEmail(email: string): Promise<User | null>
}