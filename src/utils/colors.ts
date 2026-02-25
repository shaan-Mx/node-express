// src/utils/logger/colors.ts

export const ANSI = {
  // ── Reset / styles ──────────────────────────────────────────────────────────
  RESET:     '\x1b[0m',
  BOLD:      '\x1b[1m',
  DIM:       '\x1b[2m',
  ITALIC:    '\x1b[3m',
  UNDERLINE: '\x1b[4m',

  // ── Couleurs texte ───────────────────────────────────────────────────────────
  BLACK:        '\x1b[30m',
  RED:          '\x1b[31m',
  GREEN:        '\x1b[32m',
  YELLOW:       '\x1b[33m',
  BLUE:         '\x1b[34m',
  MAGENTA:      '\x1b[35m',
  CYAN:         '\x1b[36m',
  WHITE:        '\x1b[37m',
  GRAY:         '\x1b[90m',
  BRIGHT_WHITE: '\x1b[97m',

  // ── Couleurs fond ────────────────────────────────────────────────────────────
  BG_BLACK:   '\x1b[40m',
  BG_RED:     '\x1b[41m',
  BG_GREEN:   '\x1b[42m',
  BG_YELLOW:  '\x1b[43m',
  BG_BLUE:    '\x1b[44m',
  BG_MAGENTA: '\x1b[45m',
  BG_CYAN:    '\x1b[46m',
  BG_WHITE:   '\x1b[47m',
} as const

