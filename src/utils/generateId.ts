import { randomBytes, randomUUID } from 'crypto' // node:crypto

/**
 * Type des méthodes de génération d'ID disponibles
 */
export type IdGenerationMethod = 
  | 'uuid'           // UUID v4 standard (ex: 550e8400-e29b-41d4-a716-446655440000)
  | 'nanoid'         // ID court URL-safe (ex: V1StGXR8_Z5jdHi6B-myT)
  | 'timestamp'      // Timestamp + random (ex: 1708045820123-a7f3c2)
  | 'sequential'     // Incrémental basé sur max ID existant (ex: 1, 2, 3...)
  | 'ulid'           // ULID sortable (ex: 01HPQK3V9M2R7W8X5Y1Z0N3B4C)
  | 'short-uuid'     // UUID court sans tirets (ex: 550e8400e29b41d4a716446655440000)
  | 'custom-prefix'  // Préfixe + timestamp + random (ex: PROD-1708045820-a7f3)

/**
 * Options pour la génération d'ID
 */
export interface IdGenerationOptions {
  method?: IdGenerationMethod
  prefix?: string        // Pour 'custom-prefix' (ex: 'PROD', 'USER')
  length?: number        // Pour 'nanoid' (défaut: 21)
  existingIds?: string[] // Pour 'sequential' (liste des IDs existants)
}

/**
 * Génère un ID unique selon la méthode choisie
 * 
 * @param options - Options de génération
 * @returns Un ID unique sous forme de string
 * 
 * @example
 * // UUID v4
 * generateId({ method: 'uuid' })
 * // "550e8400-e29b-41d4-a716-446655440000"
 * 
 * @example
 * // Nanoid court
 * generateId({ method: 'nanoid', length: 12 })
 * // "V1StGXR8_Z5j"
 * 
 * @example
 * // Avec préfixe
 * generateId({ method: 'custom-prefix', prefix: 'PROD' })
 * // "PROD-1708045820-a7f3"
 * 
 * @example
 * // Séquentiel
 * generateId({ method: 'sequential', existingIds: ['1', '2', '3'] })
 * // "4"
 */
export function generateId(options: IdGenerationOptions = {}): string {
  const { method = 'uuid', prefix, length = 21, existingIds = [] } = options

  switch (method) {
    case 'uuid':
      return generateUUID()

    case 'nanoid':
      return generateNanoid(length)

    case 'timestamp':
      return generateTimestampId()

    case 'sequential':
      return generateSequentialId(existingIds)

    case 'ulid':
      return generateULID()

    case 'short-uuid':
      return generateShortUUID()

    case 'custom-prefix':
      return generateCustomPrefixId(prefix || 'ID')

    default:
      // Par défaut, utilise UUID
      return generateUUID()
  }
}

/**
 * Méthode 1: UUID v4 (standard universel)
 * Format: 8-4-4-4-12 caractères hexadécimaux
 * Avantages: Standard, collision quasi-impossible, global
 * Inconvénients: Long (36 caractères)
 */
function generateUUID(): string {
  return randomUUID() // from node:crypto
}

/**
 * Méthode 2: Nanoid (court et URL-safe)
 * Format: Caractères alphanumériques + _ et -
 * Avantages: Court, URL-safe, performant
 * Inconvénients: Nécessite une longueur appropriée pour éviter collisions
 */
function generateNanoid(length: number = 21): string {
  // Alphabet URL-safe (sans caractères ambigus)
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const bytes = randomBytes(length)
  let id = ''
  for (let i = 0; i < length; i++) {
    // Utilise le byte pour sélectionner un caractère de l'alphabet
    id += alphabet[bytes[i] % alphabet.length]
  }
  return id
}

/**
 * Méthode 3: Timestamp + Random
 * Format: timestamp-hexrandom
 * Avantages: Sortable chronologiquement, collision très faible
 * Inconvénients: Prévisible (timestamp visible)
 */
function generateTimestampId(): string {
  const timestamp = Date.now()
  const random = randomBytes(3).toString('hex') // 6 caractères hex
  return `${timestamp}-${random}`
}

/**
 * Méthode 4: Sequential (incrémental)
 * Format: Nombre incrémental
 * Avantages: Simple, prévisible, compact
 * Inconvénients: Révèle le nombre d'entités, problèmes de concurrence
 */
function generateSequentialId(existingIds: string[]): string {
  if (existingIds.length === 0) {
    return '1'
  }
  // Convertir les IDs en nombres et trouver le max
  const numericIds = existingIds
    .map(id => parseInt(id))
    .filter(num => !isNaN(num))
  if (numericIds.length === 0) {
    return '1'
  }
  const maxId = Math.max(...numericIds)
  return (maxId + 1).toString()
}

/**
 * Méthode 5: ULID (Universally Unique Lexicographically Sortable Identifier)
 * Format: 26 caractères en base32
 * Avantages: Sortable, compact, pas de collisions
 * Inconvénients: Implémentation custom
 */
function generateULID(): string {
  // Alphabet Crockford's Base32
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  // Partie timestamp (10 caractères, 48 bits)
  const timestamp = Date.now()
  let timestampPart = ''
  let time = timestamp
  for (let i = 9; i >= 0; i--) {
    const mod = time % 32
    timestampPart = ENCODING[mod] + timestampPart
    time = Math.floor(time / 32)
  }
  // Partie random (16 caractères, 80 bits)
  /*
  const randomBytes = Buffer.from(randomBytes(10))
  Le problème :
    JavaScript/TypeScript a le concept de "Temporal Dead Zone" (TDZ) :
      Quand on déclare const randomBytes = ...
      Le nom randomBytes est "capturé" dans toute la portée
      Mais la variable n'existe pas encore pendant l'initialisation
      Donc randomBytes(10) essaie d'accéder à la variable locale (pas encore créée)
      Au lieu d'appeler la fonction importée
  */
  const randomBytesBuffer = Buffer.from(randomBytes(10))  
  let randomPart = ''
  for (let i = 0; i < 16; i++) {
    const byte = randomBytesBuffer[Math.floor(i * 10 / 16)] || 0
    randomPart += ENCODING[byte % 32]
  }
  return timestampPart + randomPart
}

/**
 * Méthode 6: UUID court (sans tirets)
 * Format: 32 caractères hexadécimaux
 * Avantages: Plus court que UUID standard, toujours unique
 * Inconvénients: Moins lisible que UUID standard
 */
function generateShortUUID(): string {
  return randomUUID().replace(/-/g, '')
}

/**
 * Méthode 7: Préfixe personnalisé + Timestamp + Random
 * Format: PREFIX-timestamp-random
 * Avantages: Identifiable par type, sortable, unique
 * Inconvénients: Plus long si préfixe long
 */
function generateCustomPrefixId(prefix: string): string {
  const timestamp = Date.now()
  const random = randomBytes(2).toString('hex') // 4 caractères hex
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Utilitaire: Vérifie si un ID est valide selon la méthode
 */
export function isValidId(id: string, method: IdGenerationMethod): boolean {
  switch (method) {
    case 'uuid':
      // Format UUID: 8-4-4-4-12
      return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    
    case 'nanoid':
      // Caractères alphanumériques
      return /^[0-9A-Za-z]+$/.test(id)
    
    case 'timestamp':
      // Format: nombre-hexadécimal
      return /^\d+-[0-9a-f]+$/.test(id)
    
    case 'sequential':
      // Nombre entier
      return /^\d+$/.test(id)
    
    case 'ulid':
      // 26 caractères en base32
      return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(id)
    
    case 'short-uuid':
      // 32 caractères hexadécimaux
      return /^[0-9a-f]{32}$/i.test(id)
    
    case 'custom-prefix':
      // Préfixe-nombre-hex
      return /^[A-Z]+-\d+-[0-9a-f]+$/i.test(id)
    
    default:
      return false
  }
}

/**
 * Utilitaire: Compare deux IDs générés avec des méthodes sortables
 */
export function compareIds(id1: string, id2: string, method: IdGenerationMethod): number {
  // Pour les méthodes sortables (timestamp, ulid, custom-prefix)
  if (['timestamp', 'ulid', 'custom-prefix'].includes(method)) {
    return id1.localeCompare(id2)
  }
  
  // Pour sequential
  if (method === 'sequential') {
    return parseInt(id1) - parseInt(id2)
  }
  
  // Pour les autres, comparaison string standard
  return id1.localeCompare(id2)
}