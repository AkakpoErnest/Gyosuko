import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWarnings } from '../netlify/functions/sea.mjs';

const b = (reportDatetime, kinds) => ({ reportDatetime, publishingOffice: '仙台管区気象台', warning: { class20Items: [{ areaCode: '0420500', kinds }] } });

test('uses the newest bulletin, not array[0]', () => {
  const r = parseWarnings([b('2026-10-09T21:11:00+09:00', [{ code: '20', status: '継続' }, { code: '21', status: '解除' }]), b('2026-09-15T09:49:00+09:00', [{ code: '16', status: '発表' }])]);
  assert.deepEqual(r.active, ['濃霧注意報']);
  assert.equal(r.reportedAt, '2026-10-09T21:11:00+09:00');
});
test('cancelled and none-issued kinds are not active', () => {
  assert.deepEqual(parseWarnings([b('2026-10-08T09:42:00+09:00', [{ code: '16', status: '解除' }])]).active, []);
  assert.deepEqual(parseWarnings([b('2026-09-22T04:12:00+09:00', [{ status: '発表警報・注意報はなし' }])]).active, []);
});
test('returns null for unknown area or bad input', () => {
  assert.equal(parseWarnings([]), null);
  assert.equal(parseWarnings(null), null);
});
