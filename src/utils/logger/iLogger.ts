// src/utils/logger/ILogger.ts

/**
 * Interface commune — Quelque soit la library utilisée
 */
export interface ILogger {
  // console et fichiers
  info(msg: string, meta?: object):  void
  warn(msg: string, meta?: object):  void
  error(msg: string, meta?: object): void
  debug(msg: string, meta?: object): void
  service(msg: string, meta?: object): void
  http(msg: string, meta?: object):  void
  /**
   * Log vers fichiers uniquement — console exclue.
   * Utile pour audit trail, données sensibles, ou réduire le bruit console.
   * No-op si LOG_TO_FILE=false.
   */
  fileOnly(level: 'info' | 'warn' | 'error' | 'debug', msg: string, meta?: object): void
  /**
   * Désactive la console temporairement (Winston uniquement — natif).
   * Avec Pino, redirige vers fileOnly().
   */
  muteConsole(): void
  unmuteConsole(): void
}