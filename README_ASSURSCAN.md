# AssurScan.fr - Plateforme SaaS d'Analyse d'Assurance avec IA

**Slogan :** "Scanne ton assurance, économise en 2 minutes"

AssurScan est la première plateforme française permettant de scanner et analyser intelligemment ses contrats d'assurance. Grâce à l'IA, les utilisateurs comprennent leurs garanties, détectent les lacunes et économisent sur leurs assurances en quelques clics.

## 🎯 Fonctionnalités Principales

### Landing Page
- Design moderne avec glassmorphism et animations Framer Motion
- Hero section avec gradient emerald-to-teal
- Sections features, solutions, statistiques et témoignages
- Footer complet avec liens de navigation

### Dashboard
- **Scanner un contrat** : Upload de fichiers PDF/images, analyse par IA avec OpenRouter GPT-4o, affichage des résultats (score d'optimisation, économies potentielles, lacunes de couverture)
- **Mes contrats** : Liste des contrats scannés avec filtres par type et statut, recherche, suppression
- **Assistant ClaireAI** : Interface de chat avec l'IA pour poser des questions sur les contrats
- **Statistiques** : KPIs, graphiques (économies par contrat, répartition par type, évolution mensuelle)
- **Paramètres** : Gestion du profil utilisateur, abonnement, notifications

### Système d'Authentification
- Authentification Manus OAuth intégrée
- Gestion des profils utilisateurs avec limite de scans (3 gratuits, illimités en Premium)
- Auto-création du profil lors de la première connexion

### Base de Données
- **users** : Utilisateurs avec rôles (user/admin)
- **profiles** : Profils avec abonnement et limites de documents
- **contracts** : Contrats scannés avec analyse IA complète
- **chatMessages** : Historique des conversations avec ClaireAI

## 🏗️ Stack Technique

- **Frontend** : React 19, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Backend** : Express 4, tRPC 11
- **Base de données** : MySQL/TiDB avec Drizzle ORM
- **IA** : OpenRouter (GPT-4o) pour l'analyse de contrats et le chat
- **OCR** : Tesseract.js (prévu, actuellement mock)
- **Stockage** : S3 pour les fichiers uploadés
- **Authentification** : Manus OAuth

## 📦 Installation

### Prérequis
- Node.js 22+
- Base de données MySQL/TiDB
- Compte OpenRouter avec clé API

### Variables d'Environnement

Créer un fichier `.env` à la racine du projet :

```env
# Base de données
DATABASE_URL=mysql://user:password@host:port/database

# Authentification Manus (déjà configuré)
JWT_SECRET=auto
OAUTH_SERVER_URL=auto
VITE_APP_ID=auto
VITE_OAUTH_PORTAL_URL=auto
OWNER_OPEN_ID=auto
OWNER_NAME=auto

# OpenRouter API
OPENROUTER_API_KEY=votre_clé_api_openrouter

# Stockage S3 (déjà configuré)
BUILT_IN_FORGE_API_URL=auto
BUILT_IN_FORGE_API_KEY=auto

# Application
VITE_APP_TITLE=AssurScan
VITE_APP_LOGO=https://votre-logo.com/logo.png
```

### Installation des dépendances

```bash
pnpm install
```

### Migration de la base de données

```bash
pnpm db:push
```

### Démarrage en développement

```bash
pnpm dev
```

L'application sera accessible sur `http://localhost:3000`

## 🚀 Déploiement

### Déploiement sur Vercel (Recommandé)

1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement dans Vercel
3. Déployer automatiquement

### Configuration OpenRouter

1. Créer un compte sur [OpenRouter](https://openrouter.ai/)
2. Générer une clé API
3. Ajouter la clé dans les variables d'environnement : `OPENROUTER_API_KEY`

## 📊 Utilisation

### Scanner un Contrat

1. Se connecter au dashboard
2. Cliquer sur "Scanner un contrat"
3. Uploader un fichier PDF ou image de contrat d'assurance
4. Attendre l'analyse (environ 2 minutes)
5. Consulter les résultats : score, économies, lacunes, recommandations

### Discuter avec ClaireAI

1. Aller dans "Assistant ClaireAI"
2. Sélectionner un contrat scanné
3. Poser des questions sur le contrat
4. Recevoir des réponses personnalisées de l'IA

### Gérer ses Contrats

1. Aller dans "Mes contrats"
2. Filtrer par type ou statut
3. Rechercher un contrat spécifique
4. Voir les détails ou supprimer un contrat

## 🔐 Sécurité

- Authentification sécurisée via Manus OAuth
- Row Level Security (RLS) sur toutes les tables
- Vérification de propriété des contrats avant accès
- Stockage sécurisé des fichiers sur S3

## 💎 Plans d'Abonnement

### Plan Gratuit
- 3 contrats scannés par mois
- Accès à toutes les fonctionnalités de base
- Chat ClaireAI illimité

### Plan Premium (À venir)
- Scans illimités
- Analyses prioritaires
- Comparateur d'assurances
- Support prioritaire

## 🛠️ Développement

### Structure du Projet

```
assurscan/
├── client/               # Frontend React
│   ├── src/
│   │   ├── pages/       # Pages de l'application
│   │   ├── components/  # Composants réutilisables
│   │   ├── lib/         # Utilitaires (tRPC client)
│   │   └── index.css    # Styles globaux
├── server/              # Backend Express + tRPC
│   ├── routers.ts       # Routes tRPC
│   ├── db.ts            # Fonctions de base de données
│   ├── openrouter.ts    # Intégration OpenRouter
│   ├── scanContract.ts  # Logique de scan
│   └── storage.ts       # Gestion S3
├── drizzle/             # Schémas de base de données
│   └── schema.ts
└── shared/              # Types partagés
```

### Ajouter une Nouvelle Fonctionnalité

1. Mettre à jour le schéma dans `drizzle/schema.ts`
2. Exécuter `pnpm db:push`
3. Ajouter les fonctions de base de données dans `server/db.ts`
4. Créer les procédures tRPC dans `server/routers.ts`
5. Créer les composants frontend dans `client/src/`

## 📝 Notes Techniques

### Intégration OpenRouter

L'application utilise OpenRouter pour deux cas d'usage :

1. **Analyse de contrats** : Extraction structurée des informations (garanties, montants, exclusions, score, recommandations)
2. **Chat ClaireAI** : Réponses conversationnelles basées sur le contexte du contrat

Le modèle utilisé est `openai/gpt-4o` pour sa capacité à comprendre le français et à générer du JSON structuré.

### OCR (À implémenter)

Actuellement, l'OCR utilise un texte mock. Pour implémenter Tesseract.js :

1. Installer Tesseract.js côté serveur
2. Modifier `server/scanContract.ts` pour extraire le texte du PDF
3. Passer le texte extrait à OpenRouter pour l'analyse

### Stockage S3

Les fichiers uploadés sont stockés sur S3 via les helpers préconfigurés :
- `storagePut()` pour uploader
- `storageGet()` pour récupérer une URL signée

## 🐛 Résolution de Problèmes

### Erreur "Document limit reached"
- L'utilisateur a atteint sa limite de scans gratuits (3/mois)
- Solution : Passer au plan Premium ou attendre le mois suivant

### Erreur OpenRouter API
- Vérifier que `OPENROUTER_API_KEY` est configurée
- Vérifier le solde du compte OpenRouter
- Consulter les logs serveur pour plus de détails

### Erreur de base de données
- Vérifier que `DATABASE_URL` est correcte
- Exécuter `pnpm db:push` pour synchroniser le schéma

## 📄 Licence

© 2025 AssurScan.fr - Tous droits réservés

---

**Développé avec ❤️ par Manus AI**
