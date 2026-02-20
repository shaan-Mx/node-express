// test-zod.ts
// Script de test des schémas Zod — à lancer avec :
//   npx tsx src/scripts/sample-zod.ts

import { z } from 'zod'

// ── Copie locale des schémas (pour tester sans dépendances du projet) ──────────

const VariantSchema = z.object({
  id:       z.uuid({ message: 'Variant id must be a UUID' }),
  title:    z.string().min(1, { message: 'Variant title is required' }),
  sku:      z.string().min(1, { message: 'Variant SKU is required' }),
  quantity: z.number().int().min(0, { message: 'Quantity must be >= 0' }),
})

const ProductSchema = z.object({
  id:          z.string().min(1),
  title:       z.string().min(1).max(200),
  description: z.string().min(1),
  category:    z.string().min(1),
  price:       z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Price must be a valid decimal string (e.g. "19.99")' }),
  images:      z.array(z.string()).min(1),
  tags:        z.array(z.string()).default([]),
  variants:    z.array(VariantSchema).default([]),
})

const CreateProductSchema = ProductSchema.omit({ id: true })
const UpdateProductSchema  = ProductSchema.omit({ id: true }).partial()

const UserSchema = z.object({
  id:         z.string().min(1),
  name:       z.string().min(2).max(100),
  email:      z.email({ message: 'Invalid email address' }),
  created_at: z.iso.datetime().optional(),
})

const CreateUserSchema = UserSchema.omit({ id: true, created_at: true })
const UpdateUserSchema  = CreateUserSchema.partial()

// ── Helpers d'affichage ────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'
const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'

let passed = 0
let failed = 0

function header(title: string) {
  console.log(`\n${BOLD}${CYAN}${'═'.repeat(55)}${RESET}`)
  console.log(`${BOLD}${CYAN}  ${title}${RESET}`)
  console.log(`${BOLD}${CYAN}${'═'.repeat(55)}${RESET}`)
}

function test(
  label: string,
  schema: z.ZodTypeAny,
  data: unknown,
  shouldPass: boolean
) {
  const result = schema.safeParse(data)
  const ok = result.success === shouldPass

  if (ok) {
    passed++
    const tag = shouldPass ? '✅ VALIDE  ' : '✅ REJETÉ '
    console.log(`  ${GREEN}${tag}${RESET} ${label}`)
    if (result.success && result.data) {
      // Affiche les données parsées (utile pour voir les valeurs par défaut Zod)
      console.log(`  ${YELLOW}         → ${JSON.stringify(result.data)}${RESET}`)
    }
  } else {
    failed++
    const tag = shouldPass ? '❌ DEVRAIT PASSER' : '❌ DEVRAIT ÉCHOUER'
    console.log(`  ${RED}${tag}${RESET} ${label}`)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || '_root'
        console.log(`  ${RED}         → [${path}] ${issue.message}${RESET}`)
      }
    }
  }
}

// ── Tests Product ──────────────────────────────────────────────────────────────

header('CreateProductSchema — cas valides')

test('Produit minimal valide', CreateProductSchema, {
  title:       'T-shirt blanc',
  description: 'T-shirt en coton bio',
  category:    'Vêtements',
  price:       '29.99',
  images:      ['https://example.com/img.jpg'],
}, true)

test('Produit avec variants et tags', CreateProductSchema, {
  title:       'Sneaker Air',
  description: 'Sneaker légère et respirante',
  category:    'Chaussures',
  price:       '99.00',
  images:      ['https://example.com/sneaker.jpg'],
  tags:        ['sport', 'été'],
  variants: [{
    id:       '550e8400-e29b-41d4-a716-446655440000',
    title:    'Taille 42',
    sku:      'SNK-42',
    quantity: 10,
  }],
}, true)

test('Prix entier sans décimales ("50")', CreateProductSchema, {
  title: 'Casquette', description: 'Casquette baseball', category: 'Accessoires',
  price: '50', images: ['https://img.com/cap.jpg'],
}, true)

test('tags et variants absents → valeurs par défaut []', CreateProductSchema, {
  title: 'Sac', description: 'Sac à dos', category: 'Bagages',
  price: '45.00', images: ['img.jpg'],
}, true)

// ── ──────────────────────────────────────────────────────────────────────────

header('CreateProductSchema — cas invalides')

test('price en number (doit être string)', CreateProductSchema, {
  title: 'Chapeau', description: 'Chapeau de paille', category: 'Accessoires',
  price: 29.99, images: ['img.jpg'],
}, false)

test('price avec 3 décimales ("19.999")', CreateProductSchema, {
  title: 'Ceinture', description: 'Ceinture cuir', category: 'Accessoires',
  price: '19.999', images: ['img.jpg'],
}, false)

test('images vide []', CreateProductSchema, {
  title: 'Bonnet', description: 'Bonnet laine', category: 'Accessoires',
  price: '15.00', images: [],
}, false)

test('title absent', CreateProductSchema, {
  description: 'Sans titre', category: 'Divers', price: '10.00', images: ['img.jpg'],
}, false)

test('variant avec UUID invalide', CreateProductSchema, {
  title: 'Pantalon', description: 'Jean slim', category: 'Vêtements',
  price: '59.99', images: ['img.jpg'],
  variants: [{ id: 'pas-un-uuid', title: 'S', sku: 'JN-S', quantity: 5 }],
}, false)

test('variant avec quantity négative', CreateProductSchema, {
  title: 'Veste', description: 'Veste légère', category: 'Vêtements',
  price: '79.00', images: ['img.jpg'],
  variants: [{ id: '550e8400-e29b-41d4-a716-446655440000', title: 'M', sku: 'VT-M', quantity: -1 }],
}, false)

// ── ──────────────────────────────────────────────────────────────────────────

header('UpdateProductSchema — mise à jour partielle (partial)')

test('Mise à jour price seulement', UpdateProductSchema, {
  price: '39.99',
}, true)

test('Mise à jour title + category', UpdateProductSchema, {
  title: 'Nouveau titre', category: 'Nouvelle catégorie',
}, true)

test('Body vide {} → valide (tout optionnel)', UpdateProductSchema, {}, true)

test('price invalide dans une mise à jour partielle', UpdateProductSchema, {
  price: 'gratuit',
}, false)

// ── Tests User ─────────────────────────────────────────────────────────────────

header('CreateUserSchema — cas valides')

test('Utilisateur minimal valide', CreateUserSchema, {
  name:  'Alice Dupont',
  email: 'alice@example.com',
}, true)

test('Email avec sous-domaine', CreateUserSchema, {
  name:  'Bob Martin',
  email: 'bob@mail.company.org',
}, true)

// ── ──────────────────────────────────────────────────────────────────────────

header('CreateUserSchema — cas invalides')

test('Email invalide', CreateUserSchema, {
  name: 'Charlie', email: 'pas-un-email',
}, false)

test('name trop court (1 char)', CreateUserSchema, {
  name: 'A', email: 'a@test.com',
}, false)

test('name absent', CreateUserSchema, {
  email: 'noname@test.com',
}, false)

test('email absent', CreateUserSchema, {
  name: 'Diana Prince',
}, false)

test('created_at présent → refusé (omit)', CreateUserSchema, {
  name: 'Eve', email: 'eve@test.com', created_at: '2024-01-01T00:00:00Z',
}, false)

// ── ──────────────────────────────────────────────────────────────────────────

header('UpdateUserSchema — mise à jour partielle')

test('Mise à jour email seulement', UpdateUserSchema, {
  email: 'nouveau@email.com',
}, true)

test('Body vide {} → valide', UpdateUserSchema, {}, true)

test('Email invalide dans une mise à jour', UpdateUserSchema, {
  email: 'invalide@@email',
}, false)

// ── Résumé ─────────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}${'─'.repeat(55)}${RESET}`)
console.log(`${BOLD}  Résultats : ${GREEN}${passed} passés${RESET} — ${RED}${failed} échoués${RESET}${BOLD} / ${passed + failed} total${RESET}`)
console.log(`${BOLD}${'─'.repeat(55)}${RESET}\n`)

if (failed > 0) {
  process.exit(1)
}