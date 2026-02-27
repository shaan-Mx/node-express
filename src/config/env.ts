// src/config/env.ts

import dotenv from 'dotenv'
import path from 'path'

import os from 'os'

// ✅ Charger .env immédiatement au premier import de ce module
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export type DataSource = 'local' | 'github' 
export type ValidationLibrary = 'zod' | 'valibot'
export type LoggerLib = 'pino' | 'winston'

export const config = {
  os: {
    EOL: os.EOL,
    EOL_frm: JSON.stringify(os.EOL),
    machine: os.machine,
    homeDir: os.homedir(),
    platform: os.platform(),
  },
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  dataSource: process.env.DATA_SOURCE || 'local',
  validationLib: (process.env.VALIDATION_LIB || 'zod') as ValidationLibrary,
  logAnalyzer: {
    pullSecret: process.env.LOG_ANLZ_PULL_SECRET || 'xxx_undefined_xxx',
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  productIdMethod: process.env.PRODUCT_ID_METHOD || 'nanoid',
  userIdMethod: process.env.USER_ID_METHOD || 'nanoid',
  pagination: {
    defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20'),
    maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT || '100'),
  },
  github: {
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
    branch: process.env.GITHUB_BRANCH || 'main',
    token: process.env.GITHUB_TOKEN || '',
    productsFilePath: process.env.PRODUCTS_FILE_PATH || 'json/products.json',
    usersFilePath: process.env.USERS_FILE_PATH || 'json/users.json',
  },
  local: {
    productsFilePath: process.env.PRODUCTS_FILE_PATH || 'src/data/products.json',
    usersFilePath: process.env.USERS_FILE_PATH || 'src/data/users.json',
  },
}
