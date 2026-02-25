// logger'LibRouting.ts
/*
pour le test de la librairie de logging, 
on n'utilise aucun middleware spécifique, juste des logs dans les handlers
*/
import { Router } from "express"
const router = Router();
import { logger } from './index'

router.get('/no-domain', (_req, res) => {
  logger.info({ msg: 'no domain — level transports only' })
  res.json({ ok: true })
})

router.get('/service', (_req, res) => {
  logger.info({ msg: 'service event', domain: 'service', payload: { id: 42 } })
  res.json({ ok: true })
})

router.get('/http', (_req, res) => {
  logger.warn({ msg: 'slow response detected', domain: 'http', duration: 4200 })
  res.json({ ok: true })
})

router.get('/multi-domain', (_req, res) => {
  logger.warn({ msg: 'multi domain event', domain: ['http', 'service'] })
  res.json({ ok: true })
})

router.get('/error', (_req, res) => {
  logger.error({ msg: 'something went wrong', domain: 'service', code: 'ERR_UNKNOWN' })
  res.status(500).json({ ok: false })
})

router.get('/fatal', (_req, res) => {
  logger.fatal({ msg: 'fatal — no domain' })
  res.status(503).json({ ok: false })
})

router.get('/stats', (_req, res) => {
  res.json(logger.stats())
})


export default router
