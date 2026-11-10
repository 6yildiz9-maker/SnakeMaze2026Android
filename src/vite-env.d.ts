/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_ADMOB_USE_TEST_IDS?: 'true' | 'false';
}
