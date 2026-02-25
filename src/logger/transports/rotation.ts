// logger/transports/rotation.ts
/*
La résolution du chemin se fait avant chaque écriture via un stat asynchrone non bloquant. 
En cas de concurrence multi-worker sur le même fichier (voir point de vigilance ci-dessous), 
deux workers peuvent écrire dans le même fichier avant que l'un d'eux ne le ferme.
C'est acceptable en process unique, et documenté comme limitation en mode cluster.

Exemple des fichiers générés pour le préfixe `error` :
      error2026-01-28.log          # index 0 — fichier nominal
      error2026-01-28~1.log        # index 1 — premier overflow
      error2026-01-28~2.log        # index 2 — deuxième overflow
Le garde-fou à 999 est délibérément conservateur — si on atteint ce seuil, le disque ou le process 
a un problème sérieux que le logger ne peut pas résoudre seul. 
>>> On laisse remonter via meta.error sans bloquer le flux.
*/
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { config } from '../config'
import { meta } from '../core/meta'

// ── Helpers ──

function buildDateStamp(): string {
  return new Date().toISOString().slice(0, 10)   // '2026-01-28'
}

function buildFilePath(dir: string, prefix: string, date: string, index: number): string {
  const overflow = index === 0 ? '' : `~${index}`
  return path.join(dir, `${prefix}${date}${overflow}.log`)
}

async function getFileSizeMb(filePath: string): Promise<number | null> {
  try {
    const stat = await fs.stat(filePath)
    return stat.size / (1024 * 1024)
  } catch {
    return null    // fichier inexistant
  }
}

// ── resolving path to write in ──

export async function resolveWritePath(prefix: string): Promise<string> {
  const date = buildDateStamp()
  const dir = config.dir
  let index = 0
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (err) {
    meta.error('rotation — impossible de créer le dossier logs', err)
  }
  while (true) {
    const filePath = buildFilePath(dir, prefix, date, index)
    const sizeMb = await getFileSizeMb(filePath)
    // fichier inexistant → on l'utilise directement
    if (sizeMb === null) return filePath
    // fichier sous la limite → on l'utilise
    if (sizeMb < config.maxFileSizeMb) return filePath
    // fichier plein → on passe à l'index suivant
    index++
    // garde-fou: éviter une boucle infinie si le disque est saturé
    if (index > 999) {
      meta.error(`rotation — plus de 999 fichiers pour le préfixe "${prefix}" à la date ${date}`)
      return filePath    // on retourne le dernier résolu et on laisse le transport gérer l'échec
    }
  }
}