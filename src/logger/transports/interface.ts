// logger/transports/interface.ts
/*
Ce module est le point central des règles de routage.
Tous les transports l'appellent, aucun ne réimplémente sa propre logique de filtrage.
Les trois fonctions sont séparées pour rester testables isolément :
    shouldReceive — règles communes à tous les transports (enabled, muted, minLevel)
    shouldReceiveLevel — ajoute le filtre level exact
    shouldReceiveNamed — ajoute le filtre domaine strict et le filtre level optionnel
*/
import type { LogEntry, PinoLevel, Transport } from '../types'
import { PINO_LEVELS } from '../types'
import { config } from '../config'

// ─── routing: common check ───

export function shouldReceive(transport: Transport, entry: LogEntry): boolean {
  // logging globalement désactivé
  if (!config.log.enabled) return false
  // transport muté
  if (transport.muted) return false
  // level en dessous du minimum configuré
  const entryLevelIndex = PINO_LEVELS.indexOf(entry.level)
  const minLevelIndex = PINO_LEVELS.indexOf(config.log.minLevel as PinoLevel)
  if (entryLevelIndex < minLevelIndex) return false
  // passed all checks
  return true
}

// ─── routing for transport with level ───

export function shouldReceiveLevel(
  transport: Transport & { level: PinoLevel },
  entry: LogEntry
): boolean {
  if (!shouldReceive(transport, entry)) return false
  // passed all checks
  return entry.level === transport.level
}

// ─── routing for named transport (strict mode) ───

export function shouldReceiveNamed(
  transport: Transport & { domains: string[], levels?: PinoLevel[] },
  entry: LogEntry
): boolean {
  if (!shouldReceive(transport, entry)) return false
  // filtre level si déclaré
  if (transport.levels && !transport.levels.includes(entry.level)) return false
  // mode strict — pas de domaine dans l'entrée = ignoré
  if (!entry.domain) return false
  // passed all checks
  const entryDomains = Array.isArray(entry.domain) ? entry.domain : [entry.domain]
  const hasMatch = entryDomains.some(d => transport.domains.includes(d))
  return hasMatch
}