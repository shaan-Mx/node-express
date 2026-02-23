// src/utils/resolveDataFile.ts
import { config } from '../config/env'

// ✅ Ajouter une clé ici suffit pour supporter un nouveau fichier
// export type DataFileKey = 'product' | 'user' | 'order' | 'categorie'
export type DataFileKey = 'product' | 'user'

type FilePaths = Record<DataFileKey, string>
type FilePathMap = Partial<Record<string, FilePaths>>
const filePaths: FilePathMap = {
  local: {
    product: config.local.productsFilePath,
    user:    config.local.usersFilePath,
    // orders:   config.local.ordersFilePath,
  },
  github: {
    product: config.github.productsFilePath,
    user:    config.github.usersFilePath,
    // orders:   config.github.ordersFilePath,
  },
  // ✅ Futurs modes — ajouter un bloc ici suffit
  // sqlite: {
  //   product: config.sqlite.productsTable,
  //   user:    config.sqlite.usersTable,
  // },
  // s3: {
  //   product: config.s3.productsKey,
  //   user:    config.s3.usersKey,
  // },
}

/**
 * Résout le chemin du fichier de données selon DATA_SOURCE.
 * Extensible : ajouter un nouveau case suffit pour supporter
 * un nouveau mode d'accès (sqlite, s3, mongodb, api...).
 * 
 * Et dans env.ts, il suffit d'ajouter le nouveau bloc de config :
 *      typescriptsqlite: { dbPath: process.env.SQLITE_DB_PATH || 'data/app.db' },
 *      s3: { bucket: process.env.S3_BUCKET || '', ... },
 *
 * @example
 *   const DATA_FILE = resolveDataFile('products')
 */
export function resolveDataFile(key: DataFileKey): string {
  const source  = config.dataSource
  const paths   = filePaths[source] ?? filePaths['local']!
  const resolved = paths[key]
  if (!resolved) {
    throw new Error(`[resolveDataFile] No path configured for source="${source}" key="${key}"`)
  }
  return resolved
}
