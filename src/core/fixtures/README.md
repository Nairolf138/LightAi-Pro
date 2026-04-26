# Fixtures core module

Ce module introduit un format de profil interne inspiré d'Open Fixture Library.

## Format de profil (`lightai.fixture.v1`)

```ts
interface FixtureProfile {
  format: 'lightai.fixture.v1';
  manufacturer: string;
  model: string;
  profileId: string;
  modes: Array<{
    id: string;
    name: string;
    channels: Array<{
      key: string;
      name: string;
      type: 'intensity' | 'color' | 'position' | 'effect' | 'strobe' | 'control' | 'custom';
      defaultValue?: number;
    }>;
  }>;
}
```

Le patch editor valide ensuite les collisions d'adresses et les débordements (1..512) avant de produire le mapping final (frames par univers) pour le moteur lumière.

## API interne `fixture capabilities`

Le module `capabilities.ts` centralise:

- la normalisation des attributs hétérogènes (`ColorMix`, `RGBW`, alias pan/tilt, etc.),
- les définitions de capacités consolidées (attributs, canaux, résolution 8/16 bits, plages),
- les macros de mode et limitations explicites de mode,
- les règles de compatibilité (attributs recommandés manquants, fallback coarse/fine, attributs indisponibles).

Cette API est utilisée par le pipeline de conversion patch → show canonique pour homogénéiser les attributs entre modules IA et export consoles.
