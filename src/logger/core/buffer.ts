// logger/core/buffer.ts
/*
Le buffer est une queue FIFO en mémoire. 
Le drain traite les entrées par batch complet
      splice(0, length) vide la queue en une opération atomique, ce qui évite qu'une entrée ajoutée 
      pendant le drain soit traitée deux fois ou manquée.
Le drain est déclenché en continu de façon non bloquante.
Le flag draining empêche plusieurs drains concurrents sans utiliser de mutex
      suffisant en single-thread Node.js.
Le flush utilise un polling à 10ms plutôt qu'une Promise chaînée sur le drain interne pour éviter 
de coupler le cycle de vie du flush à celui du drain. Simple et prévisible au shutdown.
Le dropCount est remis à zéro après chaque flush propre pour ne pas polluer les métriques au redémarrage.
*/
import type { BufferEntry, BufferStats, Transport, LogEntry } from '../types'
import { config } from '../config'
import { meta } from './meta'
import { fanout } from './fanout'

// ─── buffer ───

class LogBuffer {
  private queue: BufferEntry[] = []
  private dropCount = 0
  private draining = false

  // ─── enqueue ───

  enqueue(entry: LogEntry, transports: Transport[]): void {
    if (this.queue.length >= config.log.bufferMaxEntries) {
      this.dropCount++

      if (this.dropCount === 1 || this.dropCount % 1000 === 0) {
        meta.warn(
          `buffer full — dropped ${this.dropCount} entr${this.dropCount === 1 ? 'y' : 'ies'} so far`,
        )
      }
      return
    }
    this.queue.push({ entry, transports })
    // déclenche le drain sans await — fire-and-forget
    if (!this.draining) {
      this.drain().catch((err) => meta.error('buffer drain failed unexpectedly', err))
    }
  }

  // ─── drain ───

  private async drain(): Promise<void> {
    if (this.draining) return
    this.draining = true
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.queue.length)
      await Promise.allSettled(
        batch.map(({ entry, transports }) =>
          fanout(entry, transports).catch((err) =>
            meta.error('fanout failed unexpectedly', err)
          )
        )
      )
    }
    this.draining = false
  }

  // ─── flush ───

  async flush(): Promise<void> {
    // attend que le drain en cours se termine
    if (this.draining) {
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (!this.draining && this.queue.length === 0) {
            clearInterval(interval)
            resolve()
          }
        }, 10)
      })
    }
    // vide ce qui reste après le drain
    if (this.queue.length > 0) {
      await this.drain()
    }
    // remet le dropCount à zéro après flush propre
    this.dropCount = 0
  }

  // ─── stats ───

  stats(): BufferStats {
    return {
      queueLength: this.queue.length,
      dropCount: this.dropCount
    }
  }
}

// ─── singleton ───

export const buffer = new LogBuffer()