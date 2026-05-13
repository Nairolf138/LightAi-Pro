import { getEnvironmentDiagnostics } from '../../src/lib/environmentDiagnostics';
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
