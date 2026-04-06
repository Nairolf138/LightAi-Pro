# LightAI-Pro

LightAI-Pro est une application de conduite lumière (web + desktop) orientée show timeline, pilotage protocolaire et opérations live.

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

## Licence
Propriétaire — Tous droits réservés.
