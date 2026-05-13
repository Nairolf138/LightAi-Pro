type EnvironmentDiagnosticSeverity = 'info' | 'warning';

type EnvironmentDiagnosticFeature = 'authentication' | 'cloud-presets' | 'desktop-runtime' | 'release';

export type EnvironmentDiagnosticCode =
  | 'missing_supabase_url'
  | 'missing_supabase_anon_key'
  | 'desktop_runtime_unavailable'
  | 'missing_or_dev_app_version';

export interface EnvironmentDiagnosticIssue {
  code: EnvironmentDiagnosticCode;
  severity: EnvironmentDiagnosticSeverity;
  title: string;
  message: string;
  affectedFeatures: EnvironmentDiagnosticFeature[];
  remediation: string;
}

export interface EnvironmentDiagnosticInput {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  isDesktopRuntime: boolean;
  appVersion?: string;
}

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

const currentEnvironment: EnvironmentDiagnosticInput = {
  supabaseUrl: viteEnv.VITE_SUPABASE_URL,
  supabaseAnonKey: viteEnv.VITE_SUPABASE_ANON_KEY,
  isDesktopRuntime: typeof window !== 'undefined' && Boolean(window.lightAiNative),
  appVersion: viteEnv.VITE_APP_VERSION,
};

const hasValue = (value: string | undefined): boolean => Boolean(value?.trim());

const isDevelopmentVersion = (value: string | undefined): boolean => !hasValue(value) || value?.trim().toLowerCase() === 'dev';

export const getEnvironmentDiagnostics = (
  environment: EnvironmentDiagnosticInput = currentEnvironment,
): EnvironmentDiagnosticIssue[] => {
  const issues: EnvironmentDiagnosticIssue[] = [];

  if (!hasValue(environment.supabaseUrl)) {
    issues.push({
      code: 'missing_supabase_url',
      severity: 'warning',
      title: 'VITE_SUPABASE_URL absent',
      message: "L'URL Supabase n'est pas configurée, donc l'authentification et les presets cloud restent désactivés.",
      affectedFeatures: ['authentication', 'cloud-presets'],
      remediation: 'Définir VITE_SUPABASE_URL dans les variables Vite du build ou du fichier .env local.',
    });
  }

  if (!hasValue(environment.supabaseAnonKey)) {
    issues.push({
      code: 'missing_supabase_anon_key',
      severity: 'warning',
      title: 'VITE_SUPABASE_ANON_KEY absent',
      message: "La clé anonyme Supabase est absente, donc les appels d'authentification et de presets cloud ne peuvent pas démarrer.",
      affectedFeatures: ['authentication', 'cloud-presets'],
      remediation: 'Définir VITE_SUPABASE_ANON_KEY avec la clé publique anon du projet Supabase.',
    });
  }

  if (!environment.isDesktopRuntime) {
    issues.push({
      code: 'desktop_runtime_unavailable',
      severity: 'info',
      title: 'Mode desktop indisponible',
      message: "L'API native Electron n'est pas exposée dans cette session, donc le runtime desktop et les contrôles hardware sont indisponibles.",
      affectedFeatures: ['desktop-runtime'],
      remediation: "Lancer l'application via le shell desktop/Electron pour activer window.lightAiNative.",
    });
  }

  if (isDevelopmentVersion(environment.appVersion)) {
    issues.push({
      code: 'missing_or_dev_app_version',
      severity: 'info',
      title: 'Version app absente ou dev',
      message: "La version applicative n'est pas renseignée avec une valeur de release, ce qui limite le diagnostic des builds déployés.",
      affectedFeatures: ['release'],
      remediation: 'Définir VITE_APP_VERSION avec la version publiée pendant le build.',
    });
  }

  return issues;
};

export const getCurrentEnvironmentDiagnostics = (): EnvironmentDiagnosticIssue[] => getEnvironmentDiagnostics();
