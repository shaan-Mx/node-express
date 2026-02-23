// src/utils/logger/ILogger.ts

/**
 * Interface commune — Quelque soit la library utilisée
 */
export interface ILogger {
  info(msg: string, meta?: object):  void
  warn(msg: string, meta?: object):  void
  error(msg: string, meta?: object): void
  debug(msg: string, meta?: object): void
  http(msg: string, meta?: object):  void
}