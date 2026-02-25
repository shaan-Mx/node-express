// logger/middleware/request-context.ts
/*
Ce module est volontairement sans dépendance sur Express.
    il ne connaît ni Request ni Response. 
    C'est le middleware Express qui l'appelle, pas l'inverse. 
    Cela permet de réutiliser runWithContext dans d'autres contextes (workers, jobs, etc.) 
    sans coupler le contexte au cycle de vie HTTP.
getRequestId est l'accesseur principal.
    N'importe quel appel à logger.info(...) dans un handler Express peut l'appeler sans recevoir le requestId en paramètre.
    Si aucun contexte n'est actif (hors requête HTTP), il retourne undefined sans erreur.
*/
import { AsyncLocalStorage } from 'node:async_hooks'
import type { RequestContext } from '../types'

// ─── singleton ───

export const requestContextStorage = new AsyncLocalStorage<RequestContext>()

// ─── accessors ───

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore()
}

export function getRequestId(): string | undefined {
  return requestContextStorage.getStore()?.requestId
}

// ─── runner ───

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return requestContextStorage.run(context, fn)
}