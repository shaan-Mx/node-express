// src/config/env.ts

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// ✅ Charger .env immédiatement au premier import de ce module
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env')
})

// ✅ Debug : Afficher les variables chargées
/*
console.log('🔍 Environment loaded from .env:')
console.log('   PORT:', process.env.PORT || '❌ undefined')
console.log('   PRODUCT_ID_METHOD:', process.env.PRODUCT_ID_METHOD || '❌ undefined')
console.log('   PRODUCTS_FILE_PATH:', process.env.PRODUCTS_FILE_PATH || '❌ undefined')
console.log('   USERS_FILE_PATH:', process.env.USERS_FILE_PATH || '❌ undefined')
console.log('')
*/

export type DataSource = 'local' | 'github' 
export type ValidationLibrary = 'zod' | 'valibot'

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  dataSource: process.env.DATA_SOURCE || 'local',
  validationLib: (process.env.VALIDATION_LIB || 'zod') as ValidationLibrary,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  productIdMethod: process.env.PRODUCT_ID_METHOD || 'nanoid',
  userIdMethod: process.env.USER_ID_METHOD || 'nanoid',
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
