# Quickstart utilisateur (v0.1)

> Version document: 0.1  
> Dernière mise à jour: 2026-04-06

## 1) Préparer l'environnement

### Prérequis
- Node.js 20+ et npm.
- Une interface compatible Art-Net ou DMX USB (runtime natif desktop).
- (Optionnel) un compte Supabase pour les profils et l'historique d'effets.

### Installer et démarrer
```bash
npm install
npm run dev
```

Pour tester le shell desktop (runtime matériel):
```bash
npm run desktop:dev
```

---

## 2) Connexion matériel

Le runtime natif est responsable de la communication protocolaire (DMX/Art-Net/OSC) via IPC sécurisé.

### Vérification rapide
1. Ouvrir l'application desktop.
2. Vérifier l'état runtime dans le panneau **Diagnostics**.
3. Contrôler les métriques de file protocolaire (queue depth/dropped frames).

### En cas d'échec de connexion
- Vérifier le réseau local (Art-Net).
- Vérifier le mapping univers/adresses du patch.
- Reconnecter le device depuis le runtime (connect/disconnect).

---

## 3) Créer le patch

Le patch est la base du show: fixtures, univers et canaux.

Workflow recommandé:
1. Ajouter les fixtures avec identifiant et type.
2. Assigner `universeId` et adresse de départ.
3. Valider les collisions d'adresses avant de lancer le playback.

Bonnes pratiques:
- Nommer les fixtures par zone (ex: `Face-Stage-L`, `Back-1`).
- Garder des blocs d'adresses cohérents par famille de projecteurs.
- Versionner le patch dans le show sauvegardé.

---

## 4) Premier show

### Étapes minimales
1. Créer les scènes de base (intensité/couleurs).
2. Créer une cue list avec transitions (`fadeInMs`, `holdMs`, `fadeOutMs`).
3. Définir l'`entryCueId`.
4. Tester les commandes live: **Go**, **Pause**, **Back**, **Jump Cue**, **Blackout**.

### Contrôle live
- Toujours valider le **Blackout** avant la répétition.
- Sur incident, exporter un incident report depuis **Diagnostics**.

---

## 5) Checklist « prêt plateau »

- [ ] Runtime `ready = true`.
- [ ] Device protocole connecté.
- [ ] Patch sans collision.
- [ ] Cue d'entrée valide.
- [ ] Blackout testé.
- [ ] Sauvegarde du show faite avant ouverture public.
