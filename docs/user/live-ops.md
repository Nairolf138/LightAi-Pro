# Procédures live-ops (v0.1)

> Version document: 0.1  
> Dernière mise à jour: 2026-04-06

## 1) Avant ouverture salle

### T-60 min
- Charger le show validé.
- Vérifier patch et output protocolaire.
- Faire un line-check des univers critiques.

### T-30 min
- Lancer un run technique de 2 à 3 cues clés.
- Vérifier la latence perçue des commandes.
- Contrôler l'absence de dropped frames dans Diagnostics.

### T-10 min
- Revenir à l'état d'accueil scène.
- Armer la cue d'entrée.
- Vérifier procédure incident (blackout + reprise).

---

## 2) Pendant spectacle

## Règles opérateur
- Une seule personne exécute les commandes GO/BACK.
- Toute modification de patch en live est interdite sauf urgence validée.
- Si anomalie: prioriser sécurité visuelle (blackout) puis diagnostic.

## Commandes standard
1. **GO**: avance selon la transition active.
2. **PAUSE**: gèle l'évolution au temps courant.
3. **BACK**: retour au cue précédent (historique).
4. **JUMP CUE**: accès direct cue nominal.
5. **BLACKOUT**: extinction prioritaire immédiate.

---

## 3) Gestion d'incident

### Incident protocole (perte output)
1. Blackout préventif si sortie incohérente.
2. Vérifier statut runtime + connexion device.
3. Tentative de reconnexion.
4. Reprise sur cue sûre (intensité faible) puis retour conduite.

### Incident applicatif
1. Exporter un incident report (scope privé recommandé).
2. Capturer timestamp + cue actif.
3. Basculer sur plan B (console de secours si disponible).

---

## 4) Après spectacle

- Sauvegarder l'état final du show.
- Exporter les rapports diagnostics utiles.
- Noter les écarts: cues imprécises, latence, incidents.
- Préparer la version suivante du show (post-mortem technique).
