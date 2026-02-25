// logger/transports/file-level.ts
/*
Le chemin est résolu juste avant chaque écriture via resolveWritePath
Cela garantit que la rotation est évaluée à chaque appel sans état interne à maintenir dans le transport.
Si resolveWritePath ou appendFile échoue, l'erreur est isolée dans meta.error sans remonter vers le fanout.
*/
import * as node_fs from 'node:fs/promises'
import type { Transport, LogEntry, LevelTransportOptions, PinoLevel } from '../types'
import { config } from '../config'
import { shouldReceiveLevel } from './interface'
import { resolveWritePath } from './rotation'
import { meta } from '../core/meta'

// ─── transport ───

class FileLevelTransport implements Transport {
  readonly name: string
  readonly level: PinoLevel
  readonly prefix: string
  muted: boolean

  constructor(options: LevelTransportOptions) {
    this.level  = options.level
    this.prefix = options.prefix
    this.name   = `level-${options.level}`
    this.muted  = options.muted ?? config.transportMuted[options.prefix.toLowerCase()] ?? false
  }

  async write(entry: LogEntry): Promise<void> {
    if (!shouldReceiveLevel(this, entry)) return
    if (!config.file) return
    let filePath: string | undefined
    try {
      filePath = await resolveWritePath(this.prefix)
      const line = JSON.stringify(entry) + '\n'
      await node_fs.appendFile(filePath, line, 'utf8')
    } catch (err) {
      meta.error(
        `file-level transport "${this.name}" failed — path: ${filePath ?? 'unresolved'}`,
        err
      )
    }
  }
}

// ─── factory ───

export function createLevelTransport(options: LevelTransportOptions): Transport {
  return new FileLevelTransport(options)
}