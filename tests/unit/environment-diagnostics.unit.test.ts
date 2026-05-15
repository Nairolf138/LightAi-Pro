import { getEnvironmentDiagnostics } from '../../src/lib/environmentDiagnostics';
import { observability } from '../../src/lib/observability';
import { runtimeClient } from '../../src/lib/runtimeClient';
import { assert, test } from '../harness';

test('diagnostic environnement: signale Supabase, desktop et version dev indisponibles', () => {
  const issues = getEnvironmentDiagnostics({
    supabaseUrl: '',
    supabaseAnonKey: undefined,
    isDesktopRuntime: false,
    appVersion: 'dev',
  });

  assert.deepEqual(issues.map((issue) => issue.code), [
    'missing_supabase_url',
    'missing_supabase_anon_key',
    'desktop_runtime_unavailable',
    'missing_or_dev_app_version',
  ]);
});

test('diagnostic environnement: retourne une liste vide pour une configuration complète', () => {
  const issues = getEnvironmentDiagnostics({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    isDesktopRuntime: true,
    appVersion: '1.2.3',
  });

  assert.equal(issues.length, 0);
});

test('diagnostic runtime: le fallback web ne crée pas de warnings sev3 répétés', async () => {
  const countWebFallbackIncidents = () =>
    observability
      .snapshot()
      .logs.filter(
        (entry) =>
          entry.module === 'runtimeClient' &&
          entry.message.includes('Native runtime unavailable') &&
          entry.incidentSeverity === 'sev3',
      ).length;

  const before = countWebFallbackIncidents();

  await runtimeClient.getRuntimeStatus();
  await runtimeClient.getRuntimeStatus();

  const fallbackLogs = observability
    .snapshot()
    .logs.filter(
      (entry) =>
        entry.module === 'runtimeClient' && entry.message.includes('Native runtime unavailable in browser/dev mode'),
    );

  assert.equal(countWebFallbackIncidents(), before);
  assert.equal(fallbackLogs.length, 1);
  assert.equal(fallbackLogs[0].level, 'info');
  assert.equal(fallbackLogs[0].incidentSeverity, 'none');
});
