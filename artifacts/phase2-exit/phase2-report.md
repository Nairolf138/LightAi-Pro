# Phase 2 Exit Bench Report

- Date: 2026-04-30T14:54:42.776Z
- Scenario: phase2-protocols-unified
- Metrics schema version: 2.0.0

## Blocking thresholds
- P2-C01 p95 latency <= 40 ms
- P2-C02 success rate >= 99.50%
- P2-C05 reconnect/fallback p95 <= 3000 ms

## QA summary
| Criterion | Value | Threshold | Verdict |
|---|---:|---:|---|
| P2-C01 latency p95 | 0.136 ms | <= 40 ms | PASS |
| P2-C02 success rate | 100.0000 % | >= 99.50 % | PASS |
| P2-C05 reconnect p95 | 0.025 ms | <= 3000 ms | PASS |

## P2-C04 command scenarios
- Play/Stop/Next/Prev/Blackout: PASS
