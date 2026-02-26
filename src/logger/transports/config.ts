// logger/transports/config.ts
/*
Configuration des transports utilisés par le singleton logger.
Lecture des infos de configuration dans le fichier ../logger.config.json
*/
import type { Transport, TransportDef, PinoLevel } from '../types'
import { createConsoleTransport } from './console'
import { createLevelTransport } from './file-level'
import { createNamedTransport } from './file-named'
import loggerConfigJson from '../logger.config.json'

// ─── Factory ──────────────────────────────────────────────────────────────────

function buildTransport(def: TransportDef): Transport {
  switch (def.type) {
    case 'console':
      return createConsoleTransport({ muted: def.muted })

    case 'level':
      return createLevelTransport({
        prefix: def.prefix,
        level:  def.level as PinoLevel,
        muted:  def.muted
      })

    case 'named':
      return createNamedTransport({
        name:    def.name,
        prefix:  def.prefix,
        domains: def.domains,
        levels:  def.levels as PinoLevel[] | undefined,
        muted:   def.muted
      })
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const transports: Transport[] = (loggerConfigJson.transports as TransportDef[])
  .map(buildTransport)