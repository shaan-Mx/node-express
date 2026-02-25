// logger/transports/file-named.ts
/*
FileNamedTransport et FileLevelTransport sont volontairement quasi-identiques dans leur structure d'écriture.
La seule différence est le routage (shouldReceiveNamed vs shouldReceiveLevel). 
Cette duplication est intentionnelle : les deux transports doivent pouvoir évoluer indépendamment sans couplage.
*/
import * as node_fs from 'node:fs/promises'
import type { Transport, LogEntry, NamedTransportOptions, PinoLevel } from '../types'
import { config } from '../config'
import { shouldReceiveNamed } from './interface'
import { resolveWritePath } from './rotation'
import { meta } from '../core/meta'

// ─── transport ───

class FileNamedTransport implements Transport {
  readonly name: string
  readonly prefix: string
  readonly domains: string[]
  readonly levels?: PinoLevel[]
  muted: boolean

  constructor(options: NamedTransportOptions) {
    this.name    = options.name
    this.prefix  = options.prefix
    this.domains = options.domains
    this.levels  = options.levels
    this.muted   = options.muted ?? config.transportMuted[options.name.toLowerCase()] ?? false
  }

  async write(entry: LogEntry): Promise<void> {
    if (!shouldReceiveNamed(this, entry)) return
    if (!config.file) return

    let filePath: string | undefined

    try {
      filePath = await resolveWritePath(this.prefix)
      const line = JSON.stringify(entry) + '\n'
      await node_fs.appendFile(filePath, line, 'utf8')
    } catch (err) {
      meta.error(
        `file-named transport "${this.name}" failed — path: ${filePath ?? 'unresolved'}`,
        err
      )
    }
  }
}

// ─── factory ───

export function createNamedTransport(options: NamedTransportOptions): Transport {
  return new FileNamedTransport(options)
}