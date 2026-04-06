# Spécification MVP — LightAi Pro

## Statut du document
- **Version** : 0.1 (draft validable)
- **Date** : 6 avril 2026
- **Objectif** : cadrer le périmètre produit MVP avant toute implémentation technique lourde.
- **Règle de gouvernance** : ce document doit être **validé explicitement** (Product + Tech Lead) avant tout démarrage de travaux architecture/protocoles temps réel complexes.

---

## 1) Protocoles supportés au MVP

### Priorité d’implémentation
1. **Art-Net (priorité P0)**
2. **DMX via USB (priorité P1)**
3. **OSC (priorité P2, pilotage complémentaire)**

### Périmètre MVP par protocole

#### Art-Net (P0)
- Émission DMX over IP pour pilotage fixtures.
- Support minimum : **1 univers** garanti, extensible ensuite.
- Utilisation principale : sortie lumière live depuis l’application.

#### DMX USB (P1)
- Support d’au moins **une interface USB-DMX grand public validée** (liste précise à figer lors de la validation technique).
- Fonction : fallback local quand réseau Art-Net indisponible.

#### OSC (P2)
- Réception de commandes de transport/contrôle (ex. play, stop, blackout, trigger cue).
- OSC est un protocole de commande, **pas** un remplaçant de sortie DMX principale.

### Hors MVP immédiat (protocoles)
- sACN / E1.31
- MA-Net, KiNet, RDM, MIDI Show Control
- Synchronisation timecode avancée multi-protocoles

---

## 2) OS cibles et contraintes temps réel

### OS cibles au MVP
- **Windows 10/11 (64-bit)**
- **macOS 13+ (Intel + Apple Silicon)**

### Contraintes temps réel (MVP)
- Le moteur de playback doit rester stable en charge nominale.
- Priorité process/threading adaptée pour limiter la gigue d’envoi.
- En cas de surcharge, privilégier :
  1. continuité du flux DMX,
  2. maintien des fonctions de sécurité (blackout),
  3. dégradation contrôlée du rendu non critique.

### Hors MVP (plateformes)
- Linux desktop
- iPadOS / Android natif
- Distribution headless embarquée

---

## 3) Cas d’usage obligatoires (must-have MVP)

1. **Patch fixtures**
   - Ajouter/éditer/supprimer une fixture.
   - Assigner univers, adresse DMX de départ, mode/canaux.

2. **Scènes**
   - Créer, éditer, rappeler une scène.
   - Stocker états de base (intensité, couleur, position si applicable).

3. **Cue list**
   - Créer une séquence ordonnée de cues.
   - Paramètres minimum : ordre, nom, temps de transition (fade in/out), délai.

4. **Live playback**
   - Lancer, arrêter, avancer/reculer dans la cue list.
   - Déclenchement manuel fiable sans blocage UI.

5. **Blackout**
   - Action instantanée globale, prioritaire, accessible en permanence.
   - Retour d’état visuel clair (blackout actif/inactif).

6. **Sauvegarde show**
   - Sauvegarder/charger un show complet (patch + scènes + cue list + paramètres globaux MVP).
   - Format versionné pour migration future.

---

## 4) Performances minimales attendues (SLO MVP)

### Latence
- **Latence commande utilisateur → émission DMX** : **≤ 40 ms** (p95) en charge nominale.
- **Blackout** : **≤ 100 ms** perceptible en sortie (objectif opérationnel).

### Rendu / UI
- **Framerate UI cible** : **60 FPS** nominal.
- **Seuil acceptable en charge** : **≥ 30 FPS** sans perte de contrôle critique.

### Capacité fixtures
- **Support garanti MVP** : **128 fixtures** patchées actives.
- Cible fonctionnelle : 1 univers pleinement exploitable (512 canaux) avec playback stable.

### Robustesse
- Aucune perte de contrôle durable lors d’actions live courantes (trigger cues, blackout, save).
- Reprise contrôlée après erreur de communication protocolaire (message utilisateur + tentative de reconnexion selon protocole).

---

## 5) Hors scope explicite MVP

Ne pas engager ces sujets dans le cycle MVP (sauf décision formelle de changement de scope) :

- Visualiseur 3D photoréaliste avancé.
- Effets procéduraux complexes multi-layer temps réel.
- Collaboration multi-utilisateur temps réel / édition simultanée cloud.
- Gestion avancée des droits/roles entreprise.
- Timecode SMPTE complet et synchronisation show distribuée.
- Bibliothèque fixtures exhaustive automatisée (import massif constructeur).
- Plugins/SDK public.
- Compatibilité consoles propriétaires avancées.
- Auto-mapping audio intelligent production-ready.

---

## Critères de validation (Go / No-Go)

Le MVP est validé pour lancement dev technique lourd seulement si :

1. Les priorités protocolaires P0/P1/P2 sont acceptées.
2. Les OS cibles et exclusions sont actés.
3. Les 6 cas d’usage obligatoires sont signés.
4. Les seuils de performance minimum sont approuvés.
5. La liste hors scope est confirmée pour éviter le scope creep.

### Sign-off requis
- Product Owner : ☐
- Tech Lead : ☐
- Date de validation : ☐
- Décision : ☐ Go / ☐ No-Go
