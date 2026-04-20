# LightAI-Pro

LightAI-Pro est l'application du futur de conduite lumière de scènes (web + desktop) orientée show timeline, pilotage protocolaire et opérations live. Le tout propulsé par intelligence artificielle.

## État réel du projet (avril 2026)

### Implémenté aujourd'hui
- Interface React avec contrôle de playback, panneau diagnostics et gestion de profil.  
- Noyau show timeline (scènes, cues, chases, transitions, blackout).  
- Runtime desktop Electron avec frontière IPC sécurisée pour accès matériel/protocoles.  
- Drivers/protocoles présents: DMX, Art-Net, OSC et simulateur (selon implémentation runtime).  
- Observabilité (journalisation, incident report exportable).  
- Socle tests: unitaires, intégration, e2e et non-régression performance.

### En cours / à confirmer
- Validation hardware terrain de bout en bout pour tous les adaptateurs DMX USB.
- Durcissement de la chaîne release desktop selon les environnements de distribution.
- Stabilisation complète des workflows collaboration Supabase en production.

## Documentation

### Utilisateur
- Quickstart: `docs/user/quickstart.md`
- Procédures spectacle: `docs/user/live-ops.md`

### Admin
- Déploiement, mise à jour, backup: `docs/admin/deployment.md`

### Dev
- Contribution et conventions: `docs/dev/contributing.md`
- Architecture runtime: `docs/architecture/runtime.md`
- Chaîne de release: `docs/architecture/release-chain.md`

## Roadmap (mise à jour)

### Priorité haute
- Validation de compatibilité matériel (Art-Net + DMX USB) sur matrices de devices cibles.
- Renforcement des tests d'intégration runtime/IPC en conditions de charge.
- Industrialisation release (signature, notarization, rollback automatisé).

### Priorité moyenne
- API externe versionnée pour intégration tierce.
- Gouvernance avancée des rôles/projets en collaboration.
- Outils de migration de formats show versionnés.

### Priorité exploratoire
- Contrôle distant mobile.
- Timecode/synchronisation distribuée avancée.
- Visualisation scène plus avancée.

### Copilote IA

#### Capacités cibles
- Lecture de patch (analyse structurelle, cohérence d'adressage, détection d'écarts).
- Compréhension de la librairie projecteurs (modes, canaux, attributs, limites de fixtures).
- Suggestions de palettes et de groupes (par contexte de show, familles de projecteurs et intent).
- Génération de cues à partir d'un brief opérateur (texte libre ou template de scène).

#### Entrées / sorties standard
- **Lecture de patch**
  - Entrées: patch JSON/CSV, librairie fixtures, contraintes de scène (zones, univers, limites DMX).
  - Sorties: rapport structuré (`issues[]`, `warnings[]`, `propositions[]`) + résumé lisible opérateur.
  - Niveau de détail: granularité par univers/adresse + synthèse globale.
  - Contraintes temps réel: réponse < 2 s en validation interactive, < 10 s en audit complet.
- **Compréhension librairie projecteurs**
  - Entrées: définitions fixtures (modes/canaux), mapping attributs, métadonnées constructeur.
  - Sorties: modèle normalisé des capacités (`capabilities`, `channelMap`, `constraints`) exploitable par moteur cues.
  - Niveau de détail: attribut par canal + règles de compatibilité inter-fixtures.
  - Contraintes temps réel: extraction incrémentale < 1 s sur modifications unitaires.
- **Suggestions palettes / groupes**
  - Entrées: patch validé, contexte artistique (couleurs, ambiance, tempo), historique show.
  - Sorties: propositions classées (`confidence`, justification, impact) pour palettes et groupes prêts à appliquer.
  - Niveau de détail: proposition explicable fixture-par-fixture + vue macro (couverture scène).
  - Contraintes temps réel: proposition initiale < 1.5 s, raffinement progressif sans bloquer la conduite live.
- **Génération de cues depuis brief**
  - Entrées: brief texte, contraintes techniques (temps, sécurité, blackout rules), état courant du show.
  - Sorties: cues candidates versionnées (timing, fade, paramètres) + diff avant/après.
  - Niveau de détail: à la fois éditable cue par cue et exportable en bloc.
  - Contraintes temps réel: premier jet < 3 s, ajustements interactifs < 1 s.

#### Garde-fous produit
- Aucune action destructive automatique (pas d'écrasement silencieux de cues/patch/palettes).
- Validation humaine obligatoire avant tout export, push runtime ou écriture persistante.
- Traçabilité complète: provenance des suggestions, version modèle/règles, logs de validation.
- Mode dégradé sûr: en cas d'incertitude élevée, retourner une recommandation non bloquante plutôt qu'une action.

#### KPI de suivi
- Taux de cues acceptées (% de cues IA conservées après revue opérateur).
- Temps gagné en préparation (delta moyen vs workflow manuel, par type de show).
- Taux d'erreurs d'adressage/patch avant vs après assistance Copilote IA.
- Taux de retouche post-génération (mesure complémentaire de qualité des propositions).

## Cadre légal et conformité
- Licence exploitable: `LICENSE`
- Conditions Générales d'Utilisation cloud: `docs/legal/cgu.md`
- Politique de confidentialité cloud: `docs/legal/privacy.md`
- Limitations techniques connues (publiques): `docs/product/limitations.md`
- Changelog de maturité (alpha/beta/stable): `docs/product/maturity-changelog.md`

## Licence
Source-available propriétaire — voir `LICENSE` pour les droits et restrictions applicables.
