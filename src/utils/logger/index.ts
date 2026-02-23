// src/utils/logger/index.ts
// Sélecteur automatique selon LOGGER dans .env
import { config } from '../../config/env'
import type { ILogger } from "./iLogger"
export type { ILogger } from "./iLogger"

export type LoggerLib = "pino" | "winston"
const lib = (config.log.lib || "pino") as LoggerLib

const { winstonLogger } = await import("./logger.winston")
const { pinoLogger } = await import("./logger.pino")

const choicelogger = ():ILogger => {
  switch (lib) {
    case "winston":
      return winstonLogger
    case "pino":
    default:
      return pinoLogger
  } 
}

export const logger = choicelogger()

console.log(`✅ Logger: ${lib.toUpperCase()}`)
