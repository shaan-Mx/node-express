// src/middleware/authPullSecret.ts
import { config } from '../config/env.js'
import type { RequestHandler } from 'express'

// ─── Middleware ───

export const authPullSecret: RequestHandler = (req, res, next) => {
  const secret = req.headers['x-pull-secret']

  if (!secret || secret !== config.logAnalyzer.pullSecret) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  next()
}