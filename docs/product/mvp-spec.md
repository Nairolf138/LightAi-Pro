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

## 6) Scénarios de test opératoires (à exécuter systématiquement)

Le MVP doit être validé sur **4 contextes d’exploitation** minimum afin d’éviter une validation biaisée par un seul environnement :

1. **Petit club**
   - Configuration compacte, nombre réduit de fixtures, opérateur unique.
   - Vérifier la simplicité de patch et la vitesse de préparation.

2. **Plateau TV**
   - Exigence de précision des cues et changements fréquents.
   - Vérifier la fiabilité des transitions, la lisibilité des diffs et la non-régression au dernier moment.

3. **Tournée**
   - Variabilité quotidienne du parc matériel et des consoles cibles.
   - Vérifier la robustesse des imports/exports, la compatibilité console et la capacité de rollback rapide.

4. **Théâtre**
   - Conduite millimétrée et forte exigence de reproductibilité.
   - Vérifier la stabilité temporelle, la conservation des intentions artistiques et l’acceptation opérateur.

---

## 7) Métriques de pilotage MVP (qualité + adoption)

Les itérations MVP doivent être évaluées avec les indicateurs suivants :

- **Exactitude patch** : taux d’erreurs de patch détectées après génération/édition assistée (objectif : diminution continue release après release).
- **Compatibilité console** : taux d’exports acceptés sans correction manuelle sur les consoles cibles du périmètre MVP.
- **Acceptation opérateur** : part des propositions (patch/cues) validées par l’opérateur sans retouche majeure.
- **Temps gagné** : delta moyen de temps de préparation/conduite par rapport au workflow manuel de référence, mesuré par scénario (club, TV, tournée, théâtre).

Ces métriques sont suivies par build, puis consolidées par version pour décision Go/No-Go.

---

## 8) Garde-fous UX obligatoires avant validation finale

Pour toute action impactant le show (patch, cues, export), l’interface doit fournir :

1. **Simulation preview**  
   - Prévisualisation non destructive du résultat attendu avant application.

2. **Diff avant/après**
   - Visualisation explicite des changements (ajouts, suppressions, modifications) à granularité exploitable par un opérateur.

3. **Rollback en un clic**
   - Retour immédiat à l’état précédent validé, sans manipulation manuelle complexe.

---

## 9) Validation humaine explicite avant export console

- **Aucun export final console ne doit être exécuté sans validation humaine explicite.**
- La validation doit être matérialisée par une action utilisateur claire (ex. bouton de confirmation dédié) et tracée (horodatage + identité opérateur/profil courant).
- Toute tentative d’export sans cette validation doit être bloquée avec message explicite.

---

## Critères de validation (Go / No-Go)

Le MVP est validé pour lancement dev technique lourd seulement si :

1. Les priorités protocolaires P0/P1/P2 sont acceptées.
2. Les OS cibles et exclusions sont actés.
3. Les 6 cas d’usage obligatoires sont signés.
4. Les seuils de performance minimum sont approuvés.
5. Les scénarios de test (club, TV, tournée, théâtre) ont été exécutés et documentés.
6. Les métriques (exactitude patch, compatibilité console, acceptation opérateur, temps gagné) atteignent les seuils cibles définis.
7. Les garde-fous UX (simulation preview, diff, rollback) sont implémentés et validés.
8. La validation humaine explicite avant export console est vérifiée et traçable.
9. La liste hors scope est confirmée pour éviter le scope creep.

### Sign-off requis
- Product Owner : ☐
- Tech Lead : ☐
- Date de validation : ☐
- Décision : ☐ Go / ☐ No-Go
