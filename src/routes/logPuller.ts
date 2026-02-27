// src/routes/logPuller.ts
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Router } from 'express'
import type { Request, Response } from 'express'
import { authPullSecret } from '../middleware/authPullSecret.js'

const router = Router()

// ─── Helpers ───

function resolveLogsDir(): string {
  return path.resolve(process.cwd(), process.env.LOG_DIR ?? './logs')
}

function isValidFilename(filename: string): boolean {
  // évite les path traversal — uniquement lettres, chiffres, tirets, tilde, point
  return /^[\w\-~.]+\.log$/.test(filename)
}

// ─── GET /files — liste des fichiers disponibles ───

async function listFiles(_req: Request, res: Response): Promise<void> {
  const logsDir = resolveLogsDir()

  try {
    const entries = fs.readdirSync(logsDir)
    const files = entries
      .filter(name => name.endsWith('.log') && name !== 'logger-meta.log')
      .map(name => {
        const filePath = path.join(logsDir, name)
        const stat = fs.statSync(filePath)
        return {
          name,
          sizeKb: Math.round(stat.size / 1024)
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    res.json(files)
  } catch {
    res.status(500).json({ error: 'could not read logs directory' })
  }
}

// ─── GET /files/:filename — stream d'un fichier ───

async function streamFile(req: Request, res: Response): Promise<void> {
  const filename = Array.isArray(req.params.filename)
    ? req.params.filename[0]
    : req.params.filename

  if (!filename || !isValidFilename(filename)) {
    res.status(400).json({ error: 'invalid filename' })
    return
  }

  const filePath = path.join(resolveLogsDir(), filename)


  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: `file not found: ${filename}` })
    return
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')

  const stream = fs.createReadStream(filePath, { encoding: 'utf8' })

  stream.on('error', () => {
    res.status(500).json({ error: 'error reading file' })
  })

  stream.pipe(res)
}

// ─── Routes ───

router.get('/files', authPullSecret, listFiles)
router.get('/files/:filename', authPullSecret, streamFile)

export default router