# Supabase Storage Setup

## Créer le bucket 'audio' pour les MP3

### Via Dashboard Supabase:

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Menu gauche → **Storage**
4. Clic **New bucket**
5. Configuration:
   - **Name**: `audio`
   - **Public**: ✅ Cocher (pour URLs publiques)
   - **Allowed MIME types**: `audio/mpeg, audio/mp3`
   - **Max file size**: `50 MB` (ou plus si besoin)
6. Clic **Create bucket**

### ✅ Vérification

Le bucket `audio` doit apparaître dans la liste avec un badge **Public**.

### 🔒 Policies (Optionnel - pour bucket public)

Si vous voulez que tout le monde puisse lire mais seuls les users authentifiés uploadent:

```sql
-- Lecture publique
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

-- Upload pour tout le monde (anonymous OK pour POC)
CREATE POLICY "Anyone can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio');
```

Pour le POC, un bucket public avec upload anonymous est OK.

### 📁 Structure des fichiers

Les fichiers seront stockés comme:
```
audio/
  ├── {trackId-1}.mp3
  ├── {trackId-2}.mp3
  └── {trackId-3}.mp3
```

### 🔗 URLs Publiques

Format: `https://{project-ref}.supabase.co/storage/v1/object/public/audio/{trackId}.mp3`

### ✅ Ready!

Une fois le bucket créé, l'application peut commencer à uploader des MP3!
