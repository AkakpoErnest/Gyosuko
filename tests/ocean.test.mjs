import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOcean, createOceanHandler } from '../netlify/functions/ocean.mjs';
const now = Date.parse('2026-10-10T03:30:00+09:00');
const fixture = () => ({ timezone: 'Asia/Tokyo', utc_offset_seconds: 32400, latitude: 38.875, longitude: 141.875,
  hourly_units: { sea_surface_temperature: '°C', ocean_current_velocity: 'km/h', ocean_current_direction: '°' },
  hourly: { time: ['2026-10-10T00:00', '2026-10-10T03:00'], sea_surface_temperature: [20, null], ocean_current_velocity: [0.6, 0], ocean_current_direction: [162, null] } });
test('ocean summary selects actual JST hour and preserves nulls and zero', () => {
  const data = normalizeOcean(fixture(), now);
  assert.equal(data.currentHour.time, '2026-10-10T03:00+09:00');
  assert.equal(data.currentHour.temperatureC, null);
  assert.equal(data.currentHour.currentKmh, 0);
  assert.equal(data.currentHour.currentDirectionDeg, null);
  assert.equal(data.kind, 'model-forecast');
});
test('ocean rejects wrong units, missing series and stale coverage', () => {
  const bad = fixture(); bad.hourly_units.ocean_current_velocity = 'm/s';
  assert.throws(() => normalizeOcean(bad, now));
  assert.throws(() => normalizeOcean({ ...fixture(), hourly: {} }, now));
  assert.throws(() => normalizeOcean(fixture(), now + 86400000));
});
test('handler deduplicates and caches GETs without a GWAM model override', async () => {
  let calls = 0;
  const handler = createOceanHandler({ clock: () => now, apiKey: '', fetcher: async url => {
    calls++; assert.equal(url.searchParams.has('models'), false);
    assert.equal(url.searchParams.get('latitude'), '38.9');
    return Response.json(fixture());
  } });
  const request = () => new Request('https://example.test/api/ocean');
  const responses = await Promise.all([handler(request()), handler(request())]);
  assert.ok(responses.every(r => r.status === 200));
  await handler(request()); assert.equal(calls, 1);
  assert.equal((await handler(new Request(request(), { method: 'POST' }))).status, 405);
});
test('source failures produce unavailable response and can retry', async () => {
  let calls = 0;
  const handler = createOceanHandler({ clock: () => now, apiKey: '', fetcher: async () => {
    if (++calls === 1) throw Error('offline'); return Response.json(fixture());
  } });
  const request = new Request('https://example.test/api/ocean');
  const failed = await handler(request);
  assert.equal(failed.status, 503); assert.equal(failed.headers.get('Cache-Control'), 'no-store');
  assert.equal((await handler(request)).status, 200);
});
