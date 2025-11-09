# Guide de Configuration Supabase pour AssurScan

## 📋 Prérequis

1. Créer un compte sur [Supabase](https://supabase.com)
2. Créer un nouveau projet
3. Noter les credentials (URL, anon key, service_role key)

## 🗄️ Configuration de la Base de Données

### 1. Créer les Tables

Allez dans **SQL Editor** dans votre dashboard Supabase et exécutez les requêtes suivantes :

#### Table `profiles`

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  documents_uploaded INTEGER DEFAULT 0,
  documents_limit INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_plan);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

#### Table `contracts`

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  contract_type TEXT DEFAULT 'assurance',
  extracted_text TEXT,
  
  -- Résultats de l'analyse IA
  main_coverages JSONB DEFAULT '[]',
  exclusions JSONB DEFAULT '[]',
  amounts JSONB DEFAULT '{}',
  optimization_score INTEGER,
  potential_savings INTEGER,
  coverage_gaps JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_type ON contracts(contract_type);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_at ON contracts(created_at DESC);

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts" 
  ON contracts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts" 
  ON contracts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts" 
  ON contracts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contracts" 
  ON contracts FOR DELETE 
  USING (auth.uid() = user_id);
```

#### Table `chat_messages`

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_contract_id ON chat_messages(contract_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" 
  ON chat_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" 
  ON chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" 
  ON chat_messages FOR DELETE 
  USING (auth.uid() = user_id);
```

### 2. Créer le Trigger d'Auto-Création de Profil

Ce trigger crée automatiquement un profil lorsqu'un utilisateur s'inscrit :

```sql
-- Fonction pour créer automatiquement un profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui s'exécute après l'insertion d'un nouvel utilisateur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Fonction pour Mettre à Jour `updated_at`

```sql
-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer aux tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🔐 Configuration de l'Authentification

### 1. Activer les Providers

Allez dans **Authentication** > **Providers** :

#### Email/Password
- ✅ Activer "Email"
- ✅ Activer "Confirm email" (recommandé)
- ✅ Activer "Secure email change" (recommandé)

#### Google OAuth
1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)
2. Activer l'API "Google+ API"
3. Créer des identifiants OAuth 2.0
4. Ajouter les URIs de redirection autorisées :
   ```
   https://[votre-project-ref].supabase.co/auth/v1/callback
   ```
5. Copier le **Client ID** et **Client Secret**
6. Dans Supabase, activer "Google" et coller les credentials

#### Magic Link (Email OTP)
- Déjà activé par défaut avec Email

### 2. Configurer les URLs

Allez dans **Authentication** > **URL Configuration** :

- **Site URL** : `https://votre-domaine.com` (ou `http://localhost:3000` en dev)
- **Redirect URLs** : 
  ```
  http://localhost:3000/dashboard
  https://votre-domaine.com/dashboard
  ```

### 3. Personnaliser les Templates d'Email

Allez dans **Authentication** > **Email Templates** pour personnaliser :
- Email de confirmation
- Email de réinitialisation de mot de passe
- Email Magic Link

Exemple de template :
```html
<h2>Bienvenue sur AssurScan !</h2>
<p>Clique sur le lien ci-dessous pour confirmer ton email :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
```

## 🔑 Récupérer les Credentials

### Dans le Dashboard Supabase

Allez dans **Settings** > **API** :

1. **Project URL** → `VITE_SUPABASE_URL`
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

2. **anon public** key → `VITE_SUPABASE_ANON_KEY`
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   ⚠️ **Ne jamais exposer cette clé côté client !**

### Configurer dans l'Application

Ces variables sont déjà configurées via `webdev_request_secrets`. Vérifiez qu'elles sont bien présentes dans votre environnement.

## 📊 Storage (Optionnel)

Si vous voulez stocker les fichiers PDF dans Supabase Storage au lieu de S3 :

### 1. Créer un Bucket

```sql
-- Via SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false);
```

Ou via le Dashboard : **Storage** > **Create a new bucket** > Nom : `contracts`

### 2. Configurer les Policies

```sql
-- Permettre aux utilisateurs d'uploader leurs propres fichiers
CREATE POLICY "Users can upload own contracts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permettre aux utilisateurs de voir leurs propres fichiers
CREATE POLICY "Users can view own contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "Users can delete own contracts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contracts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Utiliser dans le Code

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Upload
const file = event.target.files[0]
const { data, error } = await supabase.storage
  .from('contracts')
  .upload(`${user.id}/${file.name}`, file)

// Get URL
const { data: { publicUrl } } = supabase.storage
  .from('contracts')
  .getPublicUrl(`${user.id}/${file.name}`)
```

## 🧪 Tester l'Installation

### 1. Vérifier les Tables

```sql
SELECT * FROM profiles LIMIT 1;
SELECT * FROM contracts LIMIT 1;
SELECT * FROM chat_messages LIMIT 1;
```

### 2. Tester l'Authentification

1. Aller sur `/auth` dans l'application
2. S'inscrire avec un email
3. Vérifier que :
   - Un email de confirmation est reçu
   - Un profil est créé automatiquement dans `profiles`
   - La connexion fonctionne

### 3. Tester RLS (Row Level Security)

```sql
-- Se connecter en tant qu'utilisateur spécifique
SET request.jwt.claims = '{"sub": "user-id-here"}';

-- Essayer de voir les contrats (devrait retourner seulement ceux de l'utilisateur)
SELECT * FROM contracts;
```

## 🚀 Déploiement

### Variables d'Environnement en Production

Assurez-vous que ces variables sont configurées sur Vercel :

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENROUTER_API_KEY=sk-or-v1-...
DATABASE_URL=mysql://...
```

### Mettre à Jour les URLs de Redirection

Dans Supabase **Authentication** > **URL Configuration**, ajoutez :
```
https://votre-domaine.vercel.app/dashboard
```

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentation RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Documentation Storage](https://supabase.com/docs/guides/storage)
- [Supabase Client Library](https://supabase.com/docs/reference/javascript/introduction)

## 🆘 Dépannage

### Erreur "User not found"
- Vérifier que le trigger `on_auth_user_created` est bien créé
- Vérifier que l'utilisateur existe dans `auth.users`

### Erreur "Row Level Security"
- Vérifier que les policies sont bien créées
- Vérifier que `auth.uid()` retourne bien l'ID de l'utilisateur connecté

### Erreur "Invalid JWT"
- Vérifier que `VITE_SUPABASE_ANON_KEY` est correct
- Vérifier que l'URL Supabase est correcte

### Email de confirmation non reçu
- Vérifier les spams
- Vérifier que "Confirm email" est activé
- Vérifier les templates d'email dans Supabase

---

**Développé avec ❤️ pour AssurScan**
