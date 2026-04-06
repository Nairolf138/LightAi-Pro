# Architecture runtime (UI web + shell natif)

## Objectif

L'interface React reste une UI pure (rendu + interactions). Tout accès matériel et protocoles (DMX/Art-Net/OSC, discovery device, émission de trames) est exécuté uniquement dans le runtime natif (`desktop/`).

## Structure

```text
src/                      # UI React (sandbox navigateur)
  lib/runtimeClient.ts    # Client IPC vers le runtime natif

desktop/
  main.ts                 # Process principal (Electron)
  preload.ts              # Bridge sécurisé vers le renderer
  ipc/contracts.ts        # Contrats IPC stricts + validateurs
  ipc/handlers.ts         # Enregistrement handlers IPC
  native/hardwareRuntime.ts # Logique hardware/protocoles native
```

## Frontière de sécurité

1. **UI React**: n'accède jamais directement au hardware ni aux protocoles réseau de contrôle lumière.
2. **Preload**: expose seulement une API minimale (`window.lightAiNative`) via `contextBridge`.
3. **IPC contracts**: types + assertions runtime pour valider tous les payloads entrants.
4. **Native runtime**: unique endroit autorisé pour les opérations hardware/protocoles.

## Contrat IPC

Le contrat partagé est défini dans `desktop/ipc/contracts.ts`.

Canaux supportés:
- `runtime:list-devices`
- `runtime:connect-device`
- `runtime:disconnect-device`
- `runtime:send-frame`
- `runtime:status`

Chaque payload entrant est validé (`assertConnectDeviceRequest`, `assertSendFrameRequest`) avant d'atteindre la logique native.

## Scripts

Depuis la racine:
- `npm run desktop:dev` : lance le shell desktop en mode développement.
- `npm run desktop:build` : point d'entrée build packaging desktop.

## Évolution recommandée

- Remplacer le runtime mock `hardwareRuntime.ts` par des adapters réels DMX/Art-Net/OSC.
- Ajouter des tests d'intégration IPC (payload invalide, reconnexion, latence).
- Signer/versionner explicitement le contrat IPC pour éviter les régressions UI/runtime.
