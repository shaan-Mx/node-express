/**
 * 🧪 Exemples visuels de génération d'ID
 * 
 * Ce fichier montre des exemples concrets de chaque méthode
 * Pour tester, exécutez: npx tsx src/samples/sample-generateId.ts
 */

import { generateId, isValidId, compareIds, type IdGenerationMethod } from '../utils/generateId'

console.log('🔑 EXEMPLES DE GÉNÉRATION D\'ID\n')
console.log('============================================================')

// ========================================
// 1. UUID - Standard universel
// ========================================
console.log('\n1️⃣  UUID (Standard universel)')
console.log('   Longueur: 36 caractères')
for (let i = 0; i < 3; i++) {
  console.log(`   → ${generateId({ method: 'uuid' })}`)
}

// ========================================
// 2. Nanoid - Court et URL-safe ⭐
// ========================================
console.log('\n2️⃣  Nanoid (Court et URL-safe) ⭐ RECOMMANDÉ')
console.log('   Longueur: 12 caractères')
for (let i = 0; i < 3; i++) {
  console.log(`   → ${generateId({ method: 'nanoid', length: 12 })}`)
}

console.log('\n   Longueur: 21 caractères (défaut)')
for (let i = 0; i < 3; i++) {
  console.log(`   → ${generateId({ method: 'nanoid' })}`)
}

// ========================================
// 3. Timestamp - Sortable chronologiquement
// ========================================
console.log('\n3️⃣  Timestamp (Sortable)')
console.log('   Format: timestamp-random')
for (let i = 0; i < 3; i++) {
  console.log(`   → ${generateId({ method: 'timestamp' })}`)
  // Petit délai pour voir la différence de timestamp
  await new Promise(resolve => setTimeout(resolve, 10))
}

// ========================================
// 4. Sequential - Incrémental
// ========================================
console.log('\n4️⃣  Sequential (Incrémental)')
console.log('   Format: 1, 2, 3...')
let existingIds: string[] = []
for (let i = 0; i < 5; i++) {
  const newId = generateId({ method: 'sequential', existingIds })
  console.log(`   → ${newId}`)
  existingIds.push(newId)
}

// ========================================
// 5. ULID - Sortable et unique
// ========================================
console.log('\n5️⃣  ULID (Sortable et unique)')
console.log('   Longueur: 26 caractères (Base32)')
for (let i = 0; i < 3; i++) {
  console.log(`   → ${generateId({ method: 'ulid' })}`)
  await new Promise(resolve => setTimeout(resolve, 10))
}

// ========================================
// 6. Short UUID - UUID sans tirets
// ========================================
console.log('\n6️⃣  Short UUID (UUID sans tirets)')
console.log('   Longueur: 32 caractères')
for (let i = 0; i < 3; i++) {
  console.log(`   → ${generateId({ method: 'short-uuid' })}`)
}

// ========================================
// 7. Custom Prefix - Préfixe personnalisé
// ========================================
console.log('\n7️⃣  Custom Prefix (Préfixe personnalisé)')
console.log('   Format: PREFIX-timestamp-random')
console.log('\n   Préfixe: PROD')
for (let i = 0; i < 2; i++) {
  console.log(`   → ${generateId({ method: 'custom-prefix', prefix: 'PROD' })}`)
}
console.log('\n   Préfixe: USER')
for (let i = 0; i < 2; i++) {
  console.log(`   → ${generateId({ method: 'custom-prefix', prefix: 'USER' })}`)
}
console.log('\n   Préfixe: ORDER')
for (let i = 0; i < 2; i++) {
  console.log(`   → ${generateId({ method: 'custom-prefix', prefix: 'ORDER' })}`)
}

// ========================================
// VALIDATION
// ========================================
console.log('\n============================================================')
console.log('\n🔍 VALIDATION D\'ID\n')

const testIds = [
  { id: '550e8400-e29b-41d4-a716-446655440000', method: 'uuid' as IdGenerationMethod },
  { id: 'V1StGXR8_Z5j', method: 'nanoid' as IdGenerationMethod },
  { id: '1708045820123-a7f3c2', method: 'timestamp' as IdGenerationMethod },
  { id: '123', method: 'sequential' as IdGenerationMethod },
  { id: '01HPQK3V9M2R7W8X5Y1Z0N3B4C', method: 'ulid' as IdGenerationMethod },
  { id: '550e8400e29b41d4a716446655440000', method: 'short-uuid' as IdGenerationMethod },
  { id: 'PROD-1708045820-a7f3', method: 'custom-prefix' as IdGenerationMethod },
]

testIds.forEach(({ id, method }) => {
  const valid = isValidId(id, method)
  const status = valid ? '✅' : '❌'
  console.log(`${status} ${method.padEnd(15)} → ${id}`)
})

// ========================================
// COMPARAISON (pour méthodes sortables)
// ========================================
console.log('\n============================================================')
console.log('\n📊 COMPARAISON D\'IDS (méthodes sortables)\n')

// Générer plusieurs IDs timestamp avec délai
const timestampIds: string[] = []
for (let i = 0; i < 3; i++) {
  timestampIds.push(generateId({ method: 'timestamp' }))
  await new Promise(resolve => setTimeout(resolve, 100))
}

console.log('Timestamp IDs générés:')
timestampIds.forEach((id, index) => {
  console.log(`  ${index + 1}. ${id}`)
})

console.log('\nComparaison:')
for (let i = 0; i < timestampIds.length - 1; i++) {
  const result = compareIds(timestampIds[i], timestampIds[i + 1], 'timestamp')
  const symbol = result < 0 ? '<' : (result > 0 ? '>' : '=')
  console.log(`  ID${i + 1} ${symbol} ID${i + 2} (${result})`)
}

// ========================================
// TABLEAU RÉCAPITULATIF
// ========================================
console.log('\n============================================================')
console.log('\n📋 TABLEAU RÉCAPITULATIF\n')

console.log('┌─────────────────┬──────────┬─────────┬──────────┬─────────────┐')
console.log('│ Méthode         │ Longueur │ Unique  │ Sortable │ Recommandé  │')
console.log('├─────────────────┼──────────┼─────────┼──────────┼─────────────┤')
console.log('│ uuid            │ 36       │ ✅✅✅  │ ❌       │ 🟡 Standard │')
console.log('│ nanoid ⭐       │ 12-21    │ ✅✅    │ ❌       │ 🟢 Général  │')
console.log('│ timestamp       │ ~20      │ ✅✅    │ ✅       │ 🟡 Logs     │')
console.log('│ sequential      │ 1-10     │ ⚠️       │ ✅       │ 🔴 Dev only │')
console.log('│ ulid            │ 26       │ ✅✅✅  │ ✅       │ 🟢 BDD      │')
console.log('│ short-uuid      │ 32       │ ✅✅✅  │ ❌       │ 🟡 Storage  │')
console.log('│ custom-prefix   │ Variable │ ✅✅    │ ✅       │ 🟡 Multi    │')
console.log('└─────────────────┴──────────┴─────────┴──────────┴─────────────┘')

console.log('\n🎯 RECOMMANDATION: Utilisez nanoid (12 caractères) pour la plupart des cas\n')
console.log('============================================================')