import type { FixtureProfileRegistry } from '../core/fixtures/registry';
import type { PatchAuditInput, PatchAuditResult } from '../ai/patch-audit';
import { runPatchAudit } from '../ai/patch-audit';

const INTERACTIVE_TARGET_MS = 2000;

export const patchAuditClient = {
  audit: async (input: PatchAuditInput, registry: FixtureProfileRegistry): Promise<PatchAuditResult> => {
    const result = runPatchAudit(input, registry);
    if (result.durationMs > INTERACTIVE_TARGET_MS) {
      return {
        ...result,
        warnings: [
          ...result.warnings,
          {
            code: 'PA_UNIVERSE_OVERLAP',
            message: `Temps d'audit ${result.durationMs}ms au-dessus de la cible interactive (${INTERACTIVE_TARGET_MS}ms).`,
          },
        ],
      };
    }
    return result;
  },
};
