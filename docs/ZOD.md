# zod

https://zod.dev/

see also:  
https://github.com/RobinTail/express-zod-api
https://github.com/L-Blondy/up-fetch
https://github.com/victorgarciaesgi/regle
    ✅ Headless form validation library for Vue.js
https://github.com/matejchalk/zod2md
    Generate Markdown docs from Zod schemas
https://github.com/soc221b/zod-schema-faker
    Generate mock data from zod schemas. Powered by @faker-js/faker and randexp.js.
https://github.com/alexmarqs/zod-config
    Load configuration variables from multiple sources with flexible adapters, ensuring type safety with Zod.


Étape 2.1 — Installation de Zod
Étape 2.2 — Schémas de validation (src/schemas/)
Étape 2.3 — Middleware de validation
Étape 2.4 — Intégration dans les routes

📦 1. Installation
npm install zod

You must enable strict mode in your tsconfig.json. This is a best practice for all TypeScript projects.
{
  // ...
  "compilerOptions": {
    // ...
    "strict": true
  }
}

🗂️ 2. schemas
https://zod.dev/api
https://zod.dev/api?id=string-formats

src/schemas/product.schema.ts
    Zod schema for Product validation
    
src/schemas/user.schema.ts
    Zod schema for User validation

src/middlewares/validate.ts
    Generic Zod validation middleware for Express

src/routes/products.ts
    Updated products route with Zod validation
    
src/routes/users.ts
    Updated users route with Zod validation

3. Structure
src/
├── middlewares/
│   └── validate.ts          ← middleware générique Zod
├── schemas/
│   ├── product.schema.ts    ← schémas Product + types
│   └── user.schema.ts       ← schémas User + types
└── routes/
    ├── products.ts          ← routes mises à jour (validate sur POST/PUT)
    └── users.ts             ← routes mises à jour (validate sur POST/PUT)

4. Ce qui change :

POST /api/products et PUT /api/products/:id sont maintenant validés — une requête invalide retourne un 400 avec le détail champ par champ, ex :

{
    "error": "Validation failed",
    "details": {
    "email": ["Invalid email address"],
    "name": ["Name must be at least 2 characters"]
  }
}

Les schémas sont séparés : CreateProductSchema (sans id), UpdateProductSchema (tout partiel), ProductSchema (complet) — utile pour valider aussi les données lues depuis GitHub plus tard.
Le middleware validate() est générique et réutilisable pour n'importe quelle route future.

# ZodSchema

Dans les versions récentes de Zod, ZodSchema est déprécié au profit de ZodType.  
``>>> replace deprecated ZodSchema with ZodType``  
La différence concrète : ZodType est la classe de base dans Zod v3+, ZodSchema n'était qu'un alias qui a été marqué déprécié pour simplifier l'API publique. Le comportement est identique.

# z.string().uuid

Dans les versions récentes de Zod, passer un string directement comme message est déprécié.  
Il faut utiliser un objet { message: '...' } : la règle s'applique à tous les validators Zod qui acceptent un message custom — si tu rencontres d'autres warnings du même type dans les schémas, c'est le même fix partout :

```
// ❌ Déprécié
z.string().min(1, 'Required')
z.string().email('Invalid email')
// ✅ Correct
z.string().min(1, { message: 'Required' })
z.string().email({ message: 'Invalid email' })
```
**z.uuid()** est maintenant un type de premier niveau dans Zod, comme z.string() ou z.number(). À noter que si tu as d'autres champs UUID ailleurs dans tes schémas (ex: category, id produit), ils pourraient mériter le même traitement — mais dans ce cas l'id produit est un string court non-UUID (ex: "14ea3aef"), donc z.string() reste correct pour lui.
