import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const configPath = join(root, 'capacitor.config.ts');
const manifestPath = join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const stringsPath = join(root, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const config = readFileSync(configPath, 'utf8');
const appId = config.match(/AdMob:\s*\{\s*appId:\s*['"]([^'"]+)['"]/)?.[1];

if (!appId || !/^ca-app-pub-\d+~\d+$/.test(appId)) {
  throw new Error(`Missing or invalid AdMob application ID in ${configPath}.`);
}

let manifest = readFileSync(manifestPath, 'utf8');
const appIdMetadata = /<meta-data\b(?=[^>]*android:name=["']com\.google\.android\.gms\.ads\.APPLICATION_ID["'])[^>]*\/>/s;
const metadata = [
  '        <meta-data',
  '            android:name="com.google.android.gms.ads.APPLICATION_ID"',
  '            android:value="@string/admob_app_id" />',
].join('\n');

if (appIdMetadata.test(manifest)) {
  manifest = manifest.replace(appIdMetadata, metadata);
} else if (manifest.includes('</application>')) {
  manifest = manifest.replace('</application>', `${metadata}\n    </application>`);
} else {
  throw new Error(`Missing application element in ${manifestPath}.`);
}
writeFileSync(manifestPath, manifest);

let strings = readFileSync(stringsPath, 'utf8');
const appIdString = `<string name="admob_app_id">${appId}</string>`;
const appIdStringPattern = /<string\s+name=["']admob_app_id["'][^>]*>[^<]*<\/string>/;

if (appIdStringPattern.test(strings)) {
  strings = strings.replace(appIdStringPattern, appIdString);
} else if (strings.includes('</resources>')) {
  strings = strings.replace('</resources>', `    ${appIdString}\n</resources>`);
} else {
  throw new Error(`Missing resources element in ${stringsPath}.`);
}
writeFileSync(stringsPath, strings);
