
# Initialiser git
git init

# set your account's default identity
git config --global user.email "you@example.com"
git config --global user.name "Your Name"

Omit --global to set the identity only in this repository.
git config user.email "shaan_fr_technique@yahoo.fr "
git config --global user.name "shaan-Mx"

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit"

# Relier à ton repo GitHub (remplace l'URL par la tienne)
git remote add origin https://github.com/shaan-Mx/node-express.git

# Pousser
git push -u origin main

# Pour les mises à jour futures

git add .
git commit -m "Description de tes modifications"
git push
```

---

### Structure recommandée
```
node-express-project/
├── backend/          ← Node + Express
│   ├── src/
│   ├── package.json
│   └── ...
├── frontend/         ← Vite + Vue3 + TypeScript
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md