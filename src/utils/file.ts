// src/utils/file.ts

/**
 * file.ts  —  Adaptateur unifié lecture/écriture
 *
 * Routage automatique selon DATA_SOURCE dans .env :
 *   DATA_SOURCE=local    → système de fichiers local  (fs/promises)
 *   DATA_SOURCE=github   → API REST GitHub            (github.ts)
 *
 * Les fonctions READ & WRITE acceptent un parametre (filepath) depuis le code appelant:
 *    import { config, DataSource } from "../config/env"
 *    const IS_GITHUB = config.dataSource === "github"
 *    const DATA_FILE = IS_GITHUB ? config.github.productsFilePath : config.local.productsFilePath
 *    >>> filePath = DATA_FILE , donc TOUJOURS correctement défini !!
 *    >>> plus besoin de fonction interne de choix de filePath
 *
 * Interface publique inchangée — products.ts et users.ts n'ont rien à modifier :
 *   readFromJson<T>(filePath)         → T[]
 *   writeToJson<T>(data, filePath)    → boolean
 *
 * Fonctionnement en mode GitHub :
 *   • Le sha retourné par chaque lecture est mis en cache pour être réutilisé
 *     lors de l'écriture suivante (obligatoire par l'API GitHub)
 */

import fs from "fs/promises"
import { config, DataSource } from "../config/env"
import { readFromGitHub, writeToGitHub } from "./github"

const DATA_SOURCE = (config.dataSource || "local").toLowerCase()
const IS_GITHUB = DATA_SOURCE === "github"
const IS_LOCAL = DATA_SOURCE === "local"

// ─── Cache des sha GitHub ─────────────────────────────────────────────────────
//
// L'API GitHub exige le sha du fichier courant pour toute mise à jour (PUT).
// On le capture lors du readFromGitHub et on le restitue au writeToGitHub.
// Clé = chemin GitHub (ex: "json/products.json")
const _shaCache = new Map<string, string>()

export const readFromJson = async <T>(filePath: string): Promise<T[]> => {
  try {
    if (IS_LOCAL) {
      try {
        const raw = await fs.readFile(filePath, "utf-8")
        return JSON.parse(raw) as T[]
      } catch (error) {
        console.error("❌ Erreur lecture fichier en mode local:", error)
        return []
      }
    }
    if (IS_GITHUB) {
      const { data, sha } = await readFromGitHub<T>(filePath);
      // Mettre le sha en cache pour l'écriture suivante
      if (sha) {
        _shaCache.set(filePath, sha)
      }
      return data
    }
    return []
  } catch (error) {
    console.error("Erreur lecture fichier:", error)
    return []
  }
};

export const writeToJson = async <T>(
  data: T[],
  filePath: string,
): Promise<boolean> => {
  if (IS_LOCAL) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
      return true
    } catch (error) {
      console.error("❌ Erreur écriture fichier en mode local:", error)
      return false
    }
  }
  if (IS_GITHUB) {
    const sha = _shaCache.get(filePath)
    if (!sha) {
      console.warn(
        `⚠️ Sha manquant pour "${filePath}". Assurez-vous d'appeler read() avant write() sur ce fichier.`,
      )
      // Tentative de récupération du sha à la volée
      const { sha: freshSha } = await readFromGitHub<T>(filePath)
      if (!freshSha) {
        console.error(
          `❌ Impossible de récupérer le sha de "${filePath}" — écriture annulée`,
        )
        return false
      }
      _shaCache.set(filePath, freshSha)
      return writeToGitHub(data, filePath, freshSha)
    }
    const ok = await writeToGitHub(data, filePath, sha)
    // Après écriture réussie, invalider le sha en cache
    // (il aura changé côté GitHub — la prochaine lecture le rafraîchira)
    if (ok) _shaCache.delete(filePath)
    return ok
  }
  return false
};
