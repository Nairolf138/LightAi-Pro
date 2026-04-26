# Modèle canonique show (JSON/YAML)

Ce document définit un format de show **indépendant de la console** pour permettre:
- la préparation unique d'un show,
- l'export vers plusieurs consoles,
- les tests de non-régression via fixtures de référence.

## 1) Schéma canonique

Le schéma TypeScript de référence est implémenté dans `src/core/show/canonical.ts`.
Le payload peut être sérialisé en JSON ou YAML sans perte.

### Champs obligatoires couverts
- Univers/adresses DMX (`dmx.universes`, `dmx.fixtures[].universe/address`).
- Modes de fixtures (`dmx.fixtureModes`).
- Attributs (`attributesCatalog`) dont dimmer/couleur/position/gobo.
- Groupes (`groups`).
- Presets/Palettes (`palettes`).
- Cues (`cues`).
- Timing (`cues[].timing`).
- Mapping console (`consoleMappings`).

## 2) Exemple minimal (YAML)

```yaml
schemaVersion: 1.0.0
metadata:
  showId: club-2026
  title: Club Night
  bpm: 128
dmx:
  universes:
    - id: 1
      name: Stage Left
  fixtureModes:
    - id: wash-14ch
      name: Wash 14ch
      dmxFootprint: 14
      attributes:
        - attributeId: dimmer
          channels: [1]
          coarseChannel: 1
        - attributeId: color.rgb
          channels: [2,3,4]
          coarseChannel: 2
  fixtures:
    - id: wash-1
      name: Wash 1
      fixtureType: led_wash
      modeId: wash-14ch
      universe: 1
      address: 1
attributesCatalog:
  - id: dimmer
    family: dimmer
    label: Intensité
  - id: color.rgb
    family: color
    label: RGB
groups:
  - id: front-wash
    name: Front Wash
    fixtureIds: [wash-1]
palettes:
  - id: col-blue
    name: Bleu profond
    kind: color
    values:
      - groupId: front-wash
        attributes:
          - attributeId: color.rgb
            value: "#0033FF"
            scale: percent
cues:
  - id: cue-1
    number: "1"
    name: Intro
    timing:
      inMs: 1500
      outMs: 1000
    parts:
      - id: p1
        targets:
          - groupId: front-wash
            paletteRefs: [col-blue]
            values:
              - attributeId: dimmer
                value: 80
                scale: percent
consoleMappings:
  - console: grandma3
    naming:
      groupPrefix: Group
      palettePrefix: Preset
    limitations:
      maxUniverses: 250
      unsupportedFeatures: []
    granularity:
      timing: 0.1s
      values: mixed
    translations:
      - canonical: palettes.kind=color
        consoleTerm: Color Preset
```

## 3) Mapping vers consoles cibles

`consoleMappings[]` doit porter les différences fonctionnelles.

### Convention proposée
- `naming`: normalisation des noms/objets exportés.
- `limitations`: limites du moteur cible (univers max, taille groupes, features absentes).
- `granularity`: granularité timing/valeur réellement exportable.
- `translations`: dictionnaire canonique -> terme console.

### Exemples de limitations
- Timing arrondi à 100 ms.
- Pas de palettes “focus” natives (fallback vers valeurs brutes de cues).
- Valeurs 16-bit downgradées en 8-bit sur certains paramètres.

## 4) Règles de compatibilité

1. Le modèle canonique reste le **source of truth**.
2. L'export console ne doit jamais supprimer d'information sans warning explicite.
3. Toute perte (arrondi timing, downgrade 16->8 bit, fusion d'objets) doit être journalisée.
4. Les exemples de `docs/examples/shows/` servent de base de tests.

## 5) Jeux d'exemples complets

- Petit show: `docs/examples/shows/small-show.yaml` et `.json`
- Show moyen: `docs/examples/shows/medium-show.yaml` et `.json`

Ces deux jeux couvrent DMX/modes/attributs/groupes/palettes/cues/timing + mappings multi-console.
