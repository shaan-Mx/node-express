// logger/core/meta.ts
/*
Deux points importants sur les choix faits ici :
appendFileSync est délibérément synchrone
    le meta-logging est un chemin d'exception, pas un chemin nominal. 
    La synchronicité garantit que l'erreur est persistée même si la boucle événementielle est instable, 
    et élimine tout risque de récursion async.
ensureDirSync est appelé à chaque écriture plutôt qu'une seule fois au boot
    si le dossier logs/ est supprimé en cours d'exécution, le meta-log continue de fonctionner sans planter le processus.
*/
import * as fs from 'node:fs'
import * as path from 'node:path'
import { config } from '../config' // import de la config logger

// ── Types ──

type MetaLevel = 'warn' | 'error'
interface MetaEntry {
  level: MetaLevel
  msg: string
  err?: string
  timestamp: number
}

// ── Helpers ──

function buildEntry(level: MetaLevel, msg: string, err?: unknown): string {
  const entry: MetaEntry = {
    level,
    msg,
    timestamp: Date.now(),
    ...(err !== undefined && {
      err: err instanceof Error ? err.message : String(err)
    })
  }
  return JSON.stringify(entry) + '\n'
}

function resolveMetaPath(): string {
  return path.join(config.dir, 'logger-meta.log')
}

function ensureDirSync(dir: string): void {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch {
    // si mkdirSync échoue, stderr prend le relais — pas de récursion possible
  }
}

// ── Write ──

function write(level: MetaLevel, msg: string, err?: unknown): void {
  const line = buildEntry(level, msg, err)
  // toujours écrire sur stderr en premier
  process.stderr.write(line)
  // une seule tentative d'écriture fichier — aucun retry, aucune rotation
  try {
    ensureDirSync(config.dir)
    fs.appendFileSync(resolveMetaPath(), line)
  } catch {
    // échec silencieux — stderr est suffisant, pas de récursion possible
  }
}

// ── Public interface ──

export const meta = {
  warn(msg: string, err?: unknown): void {
    write('warn', msg, err)
  },
  error(msg: string, err?: unknown): void {
    write('error', msg, err)
  }
}
