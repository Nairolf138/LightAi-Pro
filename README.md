# LightAI-Pro

![LightAI-Pro Banner](https://yourimageurl.com)

### Le Futur de l'Éclairage Scénique 🚀

**LightAI-Pro** est un logiciel révolutionnaire propulsé par l'intelligence artificielle, conçu pour automatiser et optimiser la gestion des éclairages scéniques. Grâce à des algorithmes avancés d'IA et de machine learning, il permet de créer des ambiances lumineuses dynamiques, synchronisées et ultra-réactives.

## 🎯 Fonctionnalités Principales

- 🎛 **Contrôle intelligent** : Ajustement automatique des lumières en fonction du son, du mouvement et du contexte.
- 🎼 **Synchronisation musicale** : Analyse en temps réel du rythme et de l’intensité pour adapter l’éclairage.
- 📡 **Compatibilité universelle** : Supporte les protocoles DMX, Art-Net, et OSC.
- 🎨 **Effets dynamiques IA** : Génération automatique de shows lumineux basés sur l’ambiance désirée.
- 📊 **Tableau de bord intuitif** : Interface utilisateur moderne et ergonomique.
- 🤖 **Apprentissage adaptatif** : L’IA apprend des préférences et optimise les configurations au fil du temps.




## 🚀 Utilisation

1. Lancez le logiciel
2. Connectez vos équipements DMX / Art-Net.
3. Configurez vos scènes via l'interface intuitive.
4. Profitez d'un éclairage intelligent optimisé par l'IA !

## 📌 Roadmap
- [ ] Ajout d’une API pour intégration externe
- [ ] Version mobile pour contrôle à distance
- [ ] Personnalisation avancée des algorithmes IA

## 🤝 Contribuer
Les contributions sont les bienvenues ! Clonez le repo, proposez vos améliorations via des PRs et rejoignez la révolution de l’éclairage intelligent.

## 📜 Licence
Proprietaire - Tous droits révervés !

## 📩 Contact
Pour toute question ou collaboration : [florian.ribes@live.fr](mailto:florian.ribes@live.fr)

---
_Illuminez vos spectacles avec **LightAI-Pro**, l’IA au service de la lumière !_ ✨


## 🤝 Collaboration temps réel (Supabase)

Le backend peut être étendu avec la migration SQL suivante :

- `supabase/migrations/20260406100000_collaboration_backend.sql`

Cette migration ajoute :

1. Modèles `projects`, `team_members`, `roles`, `shared_shows` (avec versionning d'état).
2. RLS orienté rôles (`owner`, `operator`, `viewer`).
3. Synchronisation non destructive via `sync_project_live_state` / `sync_shared_show_state` (optimistic update + contrôle de version).
4. Journal d'actions via `action_journal` + RPC `log_cue_action`.
5. Lock live via `live_control_locks` + RPC `acquire_live_control_lock`, `heartbeat_live_control_lock`, `release_live_control_lock`.

Un helper TypeScript est fourni dans `src/lib/liveCollaboration.ts` pour consommer ces RPC côté client.
