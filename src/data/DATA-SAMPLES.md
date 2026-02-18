SAMPLES ============
// get env variables
curl -X GET http://localhost:3001/api/products/env
{
  "success":true,
  "data": {
    "dataSource":"local",
    "filePath":"src/data/products-test.json"
  }
}
// erreur routage
curl -X GET http://localhost:3001/api/producttt
{"success":false,"error":{"message":"Route not found: GET /api/producttt","code":"NOT_FOUND"}}

// get all products
curl -X GET http://localhost:3001/api/products
{
"success":true,
"data":[
  {"id":"lb5W3iLLv0Ss","title":"Test","category":"test"},
  {"id":"D5W44kqsx51X","title":"other sample","category":"eBooks"}
],
"meta":{
  "total":2,
  "limit":2,
  "offset":0,
  "hasMore":false
  }
}
// get a product
curl -X GET http://localhost:3001/api/products/D5W44kqsx51X
{"success":true,"data":{"id":"D5W44kqsx51X","title":"other sample","category":"eBooks"}}
curl -X GET http://localhost:3001/api/products/ERROR
{"success":false,"error":{"message":"Product non trouvé avec l'id: ERROR","code":"NOT_FOUND"}}
// create a product
curl -X POST http://localhost:3001/api/products -H "Content-Type: application/json" -d '{"title":"other sample","category":"eBooks"}'
{
  "success":true,
  "data": {
    "id":"D5W44kqsx51X",
    "title":"other sample",
    "category":"eBooks"
  }
}
// update a product
curl -X PUT http://localhost:3001/api/products/D5W44kqsx51X -H "Content-Type: application/json" -d '{"title":"updated","category":"updated"}'
{"success":true,"data":{"id":"D5W44kqsx51X","title":"updated","category":"updated"}}
// delete a product
curl -X DELETE http://localhost:3001/api/products/D5W44kqsx51Xerror 
{"success":false,"error":{"message":"Product non trouvé avec l'id: D5W44kqsx51Xerror","code":"NOT_FOUND"}}
curl -X DELETE http://localhost:3001/api/products/D5W44kqsx51X
{"success":true,"data":{"message":"Product D5W44kqsx51X deleted"}}

====================

Le terme **brand**, en parlant d'un produit, désigne la marque d'un produit fabriqué ou vendu par une entreprise particulière sous un nom spécifique. Il s'agit de l'identité commerciale qui permet de distinguer ce produit de ceux de la concurrence. Par exemple, Coca-Cola, Apple ou McDonald's sont des brands qui représentent des produits ou services bien identifiés sur le marché.

Ce mot, d'origine anglaise, vient du verbe « brûler » (via le germanique brennen), car à l'origine, le « brand » était un marquage au fer rouge sur les animaux pour indiquer leur propriétaire. Aujourd'hui, il a évolué pour désigner l'ensemble des qualités, valeurs et image perçues par les consommateurs à l'égard d'un produit ou d'une entreprise.

En résumé :

Brand = marque d’un produit.
Il englobe le nom, le logo, la qualité perçue, les valeurs associées.
Il permet de créer une reconnaissance, une fidélité et une émotion chez les consommateurs.

==============================

// Product
interface Product {
id: string;
name: string;
price: number;
currency: 'EUR' | 'USD' | 'MXN';
description: string;
brand: string;
category: string;
availability: {
inStock: boolean;
quantity: number;
restockDate?: Date;
};
createdAt: Date;
updatedAt: Date;
// optionnels
tags?: string[];
images?: string[];
dimensions?: {
width: number;
height: number;
depth: number;
unit: 'cm' | 'mm' | 'inch';
};
weight?: {
value: number;
unit: 'kg' | 'lb' | 'g';
};
ratings?: {
average: number;
count: number;
};
}
// Category (hierarchical)
interface Category {
id: string;
name: string;
slug: string;
parentCategory?: string;
}

// Type union pour tous les produits

type AnyProduct =
| ElectronicProduct
| ClothingProduct
| BookProduct
| FoodProduct
| FurnitureProduct
| BeautyProduct
| ToyProduct

// Produits dérivés selon la catégorie

// Produits électroniques
interface ElectronicProduct extends Product {
category: Category & { name: 'Electronics' };
warranty: {
duration: number;
unit: 'months' | 'years';
};
powerConsumption?: string;
batteryLife?: string;
connectivity?: string[];
processor?: string;
ram?: string;
storage?: string;
screenSize?: string;
resolution?: string;
}

// Vêtements
interface ClothingProduct extends Product {
category: Category & { name: 'Clothing' };
sizes: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[];
colors: string[];
material: string[];
careInstructions?: string[];
fit?: 'slim' | 'regular' | 'loose';
gender?: 'men' | 'women' | 'unisex';
season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all-season';
}

// Livres
interface BookProduct extends Product {
category: Category & { name: 'Books' };
author: string;
publisher: string;
isbn: string;
publicationDate: Date;
pages: number;
language: string;
format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook';
genre?: string[];
edition?: string;
}

// Alimentation
interface FoodProduct extends Product {
category: Category & { name: 'Food' };
expirationDate: Date;
nutritionalInfo: {
calories: number;
protein: number;
carbohydrates: number;
fat: number;
fiber?: number;
sodium?: number;
};
ingredients: string[];
allergens?: string[];
dietaryInfo?: ('vegan' | 'vegetarian' | 'gluten-free' | 'organic' | 'halal' | 'kosher')[];
storageInstructions?: string;
servingSize?: string;
}

// Meubles
interface FurnitureProduct extends Product {
category: Category & { name: 'Furniture' };
material: string[];
color: string;
assemblyRequired: boolean;
assemblyTime?: number; // en minutes
maxWeight?: number; // capacité de charge
style?: 'modern' | 'classic' | 'rustic' | 'industrial' | 'scandinavian';
roomType?: string[];
careInstructions?: string[];
}

// Produits de beauté
interface BeautyProduct extends Product {
category: Category & { name: 'Beauty' };
skinType?: ('dry' | 'oily' | 'combination' | 'sensitive' | 'normal')[];
ingredients: string[];
usage: string;
volume: {
value: number;
unit: 'ml' | 'g';
};
expirationMonths: number; // après ouverture
crueltyFree?: boolean;
vegan?: boolean;
spf?: number;
scent?: string;
}

// Jouets
interface ToyProduct extends Product {
category: Category & { name: 'Toys' };
ageRange: {
min: number;
max?: number;
};
safetyWarnings?: string[];
educationalValue?: string[];
batteryRequired?: boolean;
batteryType?: string;
numberOfPieces?: number;
assemblyRequired?: boolean;
}
