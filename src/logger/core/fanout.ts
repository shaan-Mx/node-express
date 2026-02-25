// logger/core/fanout.ts
/*
Court et intentionnellement minimal — le fanout ne prend aucune décision de routage. 
Chaque transport est responsable de ses propres règles via shouldReceive* dans interface.ts. 
Le fanout se contente de :
    distribuer à tous les transports non mutés en parallèle via Promise.allSettled
    isoler chaque échec via le résultat rejected sans interrompre les autres
    reporter les échecs vers meta.error sans jamais remonter d'exception vers l'appelant

Le timestamp est posé par l'appelant avant d'entrer dans le buffer, jamais à l'intérieur du fanout. 
Cela garantit que l'ordre chronologique des logs correspond à l'ordre d'émission, indépendamment du délai de traitement async.

Règles de routage appliquées dans le fanout :
Un transport reçoit une entrée si et seulement si toutes les conditions suivantes sont vraies :
    Le transport n'est pas muted
    Si le transport filtre par level → le level de l'entrée est dans la liste
    Si le transport filtre par domaine → l'entrée a un domaine ET ce domaine intersecte la liste du transport (mode strict)
Un log sans domaine n'atteint jamais un transport filtré par domaine: il atteint uniquement les transports de level et les transports nommés sans filtre domaine.

*/

import type { LogEntry, Transport } from '../types'
import { meta } from './meta'

// ─── routing ──────────────────────────────────────────────────────────────────

// le timestamp est posé par l'appelant — jamais ici
// l'ordre d'émission est ainsi préservé indépendamment du délai async

export async function fanout(entry: LogEntry, transports: Transport[]): Promise<void> {
  const active = transports.filter(t => !t.muted)
  if (active.length === 0) return
  const results = await Promise.allSettled(
    active.map(t => t.write(entry))
  )
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      meta.error(
        `transport "${active[i].name}" rejected entry — level: ${entry.level}`,
        result.reason
      )
    }
  })
}
