// Refresh offline development snapshots from the same adapters used by Netlify.
import { mkdir, writeFile } from 'node:fs/promises';
import ocean from '../netlify/functions/ocean.mjs';
import conditions from '../netlify/functions/conditions.mjs';
const output = new URL('../artifacts/data/', import.meta.url);
await mkdir(output, { recursive: true });
const sources = [
  { name: 'kesennuma-ocean', handler: ocean, fields: ['time', 'temperatureC', 'currentKmh', 'currentDirectionDeg'], list: 'hours' },
  { name: 'kesennuma-weather-waves', handler: conditions, fields: ['date', 'windMaxMs', 'rainMm', 'waveMaxM'], list: 'days' },
];
const datasets = await Promise.all(sources.map(async source => {
  const response = await source.handler(new Request(`https://example.test/api/${source.list === 'hours' ? 'ocean' : 'conditions'}`));
  if (!response.ok) throw Error(`${source.name} unavailable (${response.status})`);
  return { source, data: await response.json() };
}));
for (const { source, data } of datasets) {
  await writeFile(new URL(`${source.name}.json`, output), JSON.stringify(data, null, 2) + '\n');
  const csv = [source.fields.join(','), ...data[source.list].map(row => source.fields.map(key => row[key] ?? '').join(','))].join('\n') + '\n';
  await writeFile(new URL(`${source.name}.csv`, output), csv);
  console.log(`${source.name}: ${data[source.list].length} rows, retrieved ${data.retrievedAt}`);
}
