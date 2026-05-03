# Runtime adapter compatibility matrix

| Family | Device | Firmware | OS | Known limits |
|---|---|---|---|---|
| USB DMX (Enttec-like) | Enttec USB Pro compatible | 1.44+ | macOS 13+, Windows 11, Ubuntu 22.04 | 44Hz practical refresh; USB bus contention can add 4-8ms jitter |
| Art-Net nodes | Art-Net 4 node class | Art-Net 4 rev BJ+ | macOS 13+, Windows 11, Ubuntu 22.04 | Broadcast-heavy networks may drop bursts; prefer unicast for >8 universes |
| sACN | E1.31 receiver | E1.31 2018+ | macOS 13+, Windows 11, Ubuntu 22.04 | Multicast routing dependencies; IGMP snooping misconfig causes intermittent loss |
| OSC fallback | OSC 1.0 endpoints | N/A | macOS 13+, Windows 11, Ubuntu 22.04 | No native per-channel priority, used as fallback when sACN unavailable |
| Dry-run simulator | In-process virtual adapter | N/A | All supported CI/dev OS | Timing realism depends on host scheduler; no hardware-level contention modeling |

## Product priority policy

1. Prefer **sACN** for production network transport.
2. Fallback to **OSC** only when sACN path is unavailable or blocked.
3. Keep USB DMX and Art-Net as explicit hardware family selections.
