# 🚨 Configuration Firebase Requise

Pour que l'application fonctionne (login + images), vous devez configurer **3 choses** dans la [Console Firebase](https://console.firebase.google.com/).

## 1. Activer l'Authentification Anonyme
*(Pour corriger l'erreur : `auth/admin-restricted-operation`)*

1.  Allez dans **Authentication** > **Sign-in method**.
2.  Cliquez sur **Anonyme** (Anonymous).
3.  Activez le bouton **Activer** puis **Enregistrer**.

## 2. Configurer les Règles de Sécurité (Permissions)
*(Pour autoriser l'écriture dans la base de données et le stockage)*

### Firestore Database
1.  Allez dans **Firestore Database** > **Règles**.
2.  Remplacez tout le code par celui-ci (Mode Test) et cliquez sur **Publier** :
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
    ```

### Storage (Images)
1.  Allez dans **Storage** > **Règles**.
2.  Remplacez le code par celui-ci et cliquez sur **Publier** :
    ```
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /{allPaths=**} {
          allow read, write: if true;
        }
      }
    }
    ```

## 3. Configurer CORS (Indispensable pour l'upload d'images)
*(Pour corriger l'erreur : `Access to XMLHttpRequest ... blocked by CORS policy`)*

⚠️ **Cette étape ne peut PAS être faite via des boutons/menus.** Vous devez utiliser le terminal "Cloud Shell" intégré à la console.

1.  Ouvrez la [Console Google Cloud pour votre Storage](https://console.cloud.google.com/storage/browser/mvpeep-8b36e.firebasestorage.app).
2.  Cliquez sur l'icône **Active Cloud Shell** (terminal) en haut à droite de la barre bleue.
3.  Attendez que le terminal s'ouvre en bas.
4.  Copiez-collez **exactement** ce bloc de commande et validez avec Entrée :

```bash
echo '[{"origin": ["*"],"method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],"responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],"maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://mvpeep-8b36e.firebasestorage.app
```

Une fois ces 3 étapes terminées, rafraichissez la page de l'application. Tout doit fonctionner.
