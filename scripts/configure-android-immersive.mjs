import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const mainActivityPath = join(
  process.cwd(),
  'android',
  'app',
  'src',
  'main',
  'java',
  'com',
  'aiwhishpers',
  'snakemaze2026',
  'MainActivity.java'
);
const source = readFileSync(mainActivityPath, 'utf8');

if (source.includes('SYSTEM_UI_FLAG_IMMERSIVE_STICKY')) {
  process.exit(0);
}

if (!/public class MainActivity extends BridgeActivity\s*\{\s*\}/.test(source)) {
  throw new Error(`Unexpected generated MainActivity structure at ${mainActivityPath}.`);
}

const replacement = `public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemBars();
        }
    }

    private void hideSystemBars() {
        getWindow().getDecorView().setSystemUiVisibility(
            android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
                | android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
    }
}`;

writeFileSync(mainActivityPath, source.replace(
  /public class MainActivity extends BridgeActivity\s*\{\s*\}/,
  replacement
));
