// Gyosoku demo app: routing, calculations, review state, rendering.
// Everything is local and synthetic. Nothing is sent anywhere.

import { scenario, computeCoverage, initialActivity } from './data.js';
import { t, getLang, setLang, fmtKg, fmtDate, fmtDateTime, LANGS } from './i18n.js';

const VIEWS = ['overview', 'supply', 'decision', 'activity', 'technical'];
const PCTS = ['p10', 'p50', 'p90'];
const DECISIONS = { approve: 'approved', reject: 'rejected', review: 'review' };
const TONE = {
  offered: 'warn', verified: 'ok', declined: 'muted',
  expected: 'ok', uncertain: 'warn',
  approved: 'ok', rejected: 'danger', review: 'warn',
};

const state = {
  lang: getLang(),
  view: 'overview',
  offers: scenario.offers.map((o) => ({ ...o })),
  selectedSuggestion: null,
  pendingDecision: null,
  activity: [...initialActivity],
  notice: null,
};

// ---------------------------------------------------------------- DOM helpers

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, String(v));
  append(el, children);
  return el;
}

// First key that resolves to a real string (tolerates small naming differences in i18n.js).
function tFirst(...keys) {
  for (const k of keys) {
    const v = t(k);
    if (v && v !== k) return v;
  }
  return keys[keys.length - 1];
}

const chipText = (tone, text) => h('span', { class: `chip chip--${tone}` }, text);
const chip = (statusKey) => chipText(TONE[statusKey] || 'muted', t(`status.${statusKey}`));
const stamp = (decision) => h('span', { class: `stamp stamp--${decision}` },
  h('span', { class: 'stamp__mark', 'aria-hidden': 'true' }, t(`status.${decision}.mark`)),
  h('span', { class: 'stamp__text' }, t(`status.${decision}`)));
const fmtNum = (kg) => fmtKg(kg).replace(/\s*kg$/, '');

function figure(label, kg, text, range) {
  return h('div', { class: 'figure' },
    h('p', { class: 'figure__label' }, label),
    h('p', { class: 'figure__n' }, fmtNum(kg), h('small', {}, t('common.kg'))),
    h('div', { class: 'figure__text' },
      text ? h('p', {}, text) : null,
      range ? h('p', { class: 'figure__range' }, range) : null));
}

// The arithmetic the whole demo rests on, as a ruled ledger.
function arithmeticLedger(c) {
  const row = (label, kg, cls, extra) => h('tr', { class: cls || null },
    h('th', { scope: 'row' }, label, extra ? h('span', { class: 'is-dim' }, ` · ${extra}`) : null),
    h('td', { class: 'num' }, fmtKg(kg)));
  return h('table', { class: 'ledger ledger--arith' },
    h('tbody', {},
      row(t('common.need'), c.need),
      row(t('common.stock'), c.stock, null, t(`location.${scenario.stock.location}`)),
      row(t('common.landings'), landingsKg('p50'), null, 'P50'),
      row(t('common.coverage'), c.coverage.p50, 'is-total'),
      row(t('common.gap'), c.gap.p50, 'is-gap'),
      c.verifiedOffersKg > 0 ? row(t('common.verifiedOffers'), c.verifiedOffersKg, 'is-dim', t('common.notInTotal')) : null));
}

function ledgerHead(...labels) {
  return h('thead', {}, h('tr', {}, labels.map(([label, cls]) => h('th', { scope: 'col', class: cls || null }, label))));
}

const viewTitle = (view, key) => h('h1', { class: 'view__title', id: `view-title-${view}`, tabindex: -1 }, t(key));
const metaLine = () => h('p', { class: 'meta' },
  `${t('provenance.synthetic')} · ${t('common.asOf', { date: fmtDateTime(scenario.meta.asOf) })} · ${t('tech.notValidated')}`);

function pilotPanel() {
  return h('section', { class: 'pilot' }, h('h3', {}, t('pilot.title')), h('p', {}, t('pilot.body')));
}

// ---------------------------------------------------------------- data

const coverage = () => computeCoverage({ ...scenario, offers: state.offers });
const landingsKg = (p) => scenario.forecast[`${p}Kg`];

function evidenceVars(c) {
  const offer = state.offers.find((o) => o.status !== 'declined') || scenario.offers[0];
  const next = scenario.arrivals.find((a) => a.status === 'expected') || scenario.arrivals[0];
  return {
    'ev.gap-median': { gap: fmtKg(c.gap.p50) },
    'ev.offer-exists': { offerKg: fmtKg(offer.quantityKg), supplier: t(`supplier.${offer.supplier}`) },
    'ev.next-landing': { date: fmtDate(next.date), kg: fmtKg(next.expectedKg) },
    'ev.p90-covers': { p90Gap: fmtKg(c.gap.p90) },
    'ev.deadline': { date: fmtDate(scenario.order.dueDate) },
  };
}
const evidenceText = (key, c) => t(key, evidenceVars(c)[key] || {});

const latestDecisionFor = (suggestionKey) => state.activity.find((a) => a.suggestionKey === suggestionKey);

// ---------------------------------------------------------------- shared components

let ribbonSeq = 0;
function renderRibbon(c, { compact = false } = {}) {
  const max = Math.max(c.need, c.coverage.p90, c.stock + c.verifiedOffersKg) * 1.04;
  const pct = (kg) => `${((kg / max) * 100).toFixed(2)}%`;
  const H = compact ? 44 : 104;
  const top = compact ? 10 : 36, bh = compact ? 24 : 32, mid = top + bh / 2;
  const id = `ribbon-title-${++ribbonSeq}`, hatch = `hatch-${ribbonSeq}`;
  const text = (str, kg, y, anchor, cls) => s('text', { x: pct(kg), y, 'text-anchor': anchor, class: cls || null }, str);
  const kids = [
    s('title', { id }, t('a11y.ribbon', { p10: fmtKg(c.coverage.p10), p50: fmtKg(c.coverage.p50), p90: fmtKg(c.coverage.p90), need: fmtKg(c.need) })),
    s('defs', {}, s('pattern', { id: hatch, patternUnits: 'userSpaceOnUse', width: 6, height: 6 }, s('path', { d: 'M0 6L6 0', class: 'ribbon__hatch' }))),
    s('line', { x1: 0, x2: '100%', y1: mid, y2: mid, class: 'ribbon__track' }),
    s('rect', { x: pct(c.coverage.p10), y: top, width: pct(c.coverage.p90 - c.coverage.p10), height: bh, fill: `url(#${hatch})` }),
    c.need > c.coverage.p50 ? s('rect', { x: pct(c.coverage.p50), y: top, width: pct(c.need - c.coverage.p50), height: bh, class: 'ribbon__gap' }) : null,
    s('rect', { x: 0, y: top, width: pct(c.stock), height: bh, class: 'ribbon__stock' }),
    c.verifiedOffersKg > 0 ? s('rect', { x: pct(c.stock), y: top, width: pct(c.verifiedOffersKg), height: bh, class: 'ribbon__verified' }) : null,
    s('line', { x1: pct(c.coverage.p50), x2: pct(c.coverage.p50), y1: top - 6, y2: top + bh + 6, class: 'ribbon__p50' }),
    s('line', { x1: pct(c.need), x2: pct(c.need), y1: compact ? top - 8 : 18, y2: top + bh + 8, class: 'ribbon__need' }),
  ];
  if (!compact) {
    const below = top + bh + 18;
    kids.push(
      text(`${t('common.need')} ${fmtKg(c.need)}`, c.need, 12, 'end', 'is-accent'),
      text(`P50 ${fmtKg(c.coverage.p50)}`, c.coverage.p50, top - 12, 'end', 'is-ink'),
      text(`${t('common.stock')} ${fmtKg(c.stock)}`, 0, below, 'start'),
      text(`P10 ${fmtKg(c.coverage.p10)}`, c.coverage.p10, below, 'start'),
      text(`P90 ${fmtKg(c.coverage.p90)}`, c.coverage.p90, below, 'end'));
    if (c.verifiedOffersKg > 0) kids.push(text(`${t('status.verified')} +${fmtKg(c.verifiedOffersKg)}`, c.stock + c.verifiedOffersKg, top - 12, 'start'));
  }
  const svg = s('svg', { class: 'ribbon__svg', width: '100%', height: H, role: 'img', 'aria-labelledby': id }, kids);
  const parts = PCTS.map((p) => `${p.toUpperCase()} ${fmtKg(c.coverage[p])}`);
  if (c.verifiedOffersKg > 0) parts.push(`${t('status.verified')} +${fmtKg(c.verifiedOffersKg)}`);
  parts.push(`${t('common.need')} ${fmtKg(c.need)}`);
  return h('figure', { class: `ribbon${compact ? ' ribbon--compact' : ''}` }, svg,
    h('figcaption', { class: 'ribbon__caption' }, `${t('common.stock')} ${fmtKg(c.stock)} · ${parts.join(' · ')}`));
}

function renderPercentiles() {
  return h('dl', { class: 'percentiles' }, PCTS.flatMap((p) => [
    h('dt', {}, `${p.toUpperCase()} · ${fmtKg(landingsKg(p))}`),
    h('dd', {}, t(`supply.${p}`)),
  ]));
}

function renderTrace(c) {
  const rows = (fn) => h('ul', { class: 'trace__rows' }, PCTS.map((p) =>
    h('li', { class: 'trace__row' }, h('span', { class: 'trace__label' }, p.toUpperCase()), h('span', { class: 'trace__math' }, fn(p)))));
  return h('div', { class: 'trace' },
    h('p', { class: 'trace__step' }, t('supply.traceStep1')),
    rows((p) => `${fmtKg(c.stock)} + ${fmtKg(landingsKg(p))} = ${fmtKg(c.coverage[p])}`),
    h('p', { class: 'trace__step' }, t('supply.traceStep2')),
    rows((p) => `${fmtKg(c.need)} − ${fmtKg(c.coverage[p])} = ${fmtKg(c.gap[p])}`));
}

function freshnessChips(c) {
  return h('div', { class: 'chips' },
    h('span', { class: 'chips__item' }, `${t('supply.source')}: `, chipText('muted', t('provenance.synthetic'))),
    h('span', { class: 'chips__item' }, `${t('supply.freshness')}: `, chipText('muted', fmtDateTime(scenario.meta.asOf))),
    h('span', { class: 'chips__item' }, `${t('tech.validation')}: `, chipText('warn', t('tech.notValidated'))),
    c && c.offeredUnconfirmedKg > 0
      ? h('span', { class: 'chips__item' }, chipText('warn', `${t('status.offered')} ${fmtKg(c.offeredUnconfirmedKg)}`), ` ${t('supply.offeredNotCounted')}`)
      : null);
}

// ---------------------------------------------------------------- views

function arrivalsTable() {
  return h('table', { class: 'ledger ledger--data' },
    ledgerHead([t('ledger.date')], [t('ledger.vessel')], [t('ledger.quantity'), 'num'], [t('ledger.status')]),
    h('tbody', {}, scenario.arrivals.map((a) => h('tr', {},
      h('td', {}, h('time', { datetime: a.date }, fmtDate(a.date))),
      h('td', {}, t(`vessel.${a.vesselKey}`)),
      h('td', { class: 'num' }, fmtKg(a.expectedKg)),
      h('td', {}, chip(a.status))))));
}

function renderOverview(c) {
  const o = scenario.order;
  return [
    viewTitle('overview', 'overview.title'), metaLine(),
    h('p', { class: 'lede' }, `${o.id} · ${t('overview.orderMeta', { species: t(`species.${o.species}`), buyer: t(`buyer.${o.buyer}`) })} · ${t('overview.due', { date: fmtDate(o.dueDate) })}`),
    figure(t('overview.possibleGap'), c.gap.p50, t('decision.shortageLead', { gap: fmtKg(c.gap.p50) }),
      `P10 ${fmtKg(c.gap.p10)} · P50 ${fmtKg(c.gap.p50)} · P90 ${fmtKg(c.gap.p90)}`),
    renderRibbon(c),
    h('div', { class: 'split' },
      h('section', {}, h('h3', { class: 'panel__title' }, t('supply.trace')), arithmeticLedger(c)),
      h('section', {}, h('h3', { class: 'panel__title' }, t('overview.arrivals')), arrivalsTable())),
  ];
}

function toggleOffer(id) {
  const offer = state.offers.find((o) => o.id === id);
  if (!offer || offer.status === 'declined') return;
  offer.status = offer.status === 'verified' ? 'offered' : 'verified';
  renderAll();
  document.querySelector(`[data-offer="${id}"]`)?.focus();
}

function renderSupply(c) {
  const offersTable = h('table', { class: 'ledger ledger--data' },
    ledgerHead([t('supply.colSupplier')], [t('supply.colQuantity'), 'num'], [t('supply.colEta')], [t('supply.colStatus')], [t('supply.colAction')]),
    h('tbody', {}, state.offers.map((o) => h('tr', { class: 'offers__row' },
      h('td', {}, t(`supplier.${o.supplier}`)),
      h('td', { class: 'num' }, fmtKg(o.quantityKg)),
      h('td', {}, fmtDate(o.etaDate)),
      h('td', {}, chip(o.status)),
      h('td', {}, o.status === 'declined' ? null : h('button', {
        class: `btn btn--small${o.status === 'verified' ? ' btn--ghost' : ''}`, type: 'button', 'data-offer': o.id,
        'aria-pressed': String(o.status === 'verified'), onclick: () => toggleOffer(o.id),
      }, t(o.status === 'verified' ? 'supply.unmarkVerified' : 'supply.markVerified')))))));

  return [
    viewTitle('supply', 'supply.title'), metaLine(),
    renderRibbon(c),
    h('div', { class: 'split split--offers' },
      h('section', {}, h('h3', { class: 'panel__title' }, t('supply.requirements')), arithmeticLedger(c)),
      h('section', {}, h('h3', { class: 'panel__title' }, t('supply.offers')), offersTable,
        c.offeredUnconfirmedKg > 0 ? h('p', { class: 'note' }, t('supply.offeredNotCounted')) : null)),
    h('details', { class: 'disclosure' },
      h('summary', {}, t('supply.howFormed')),
      h('p', {}, t('supply.percentilesIntro')),
      renderPercentiles(),
      h('h4', {}, t('supply.trace')),
      renderTrace(c)),
  ];
}

function requestDecision(decision) {
  if (!state.selectedSuggestion) return;
  state.pendingDecision = decision;
  renderDialog();
  dom.dialog.returnValue = '';
  dom.dialog.showModal();
}

function recordDecision() {
  const key = state.selectedSuggestion, decision = state.pendingDecision;
  const sug = scenario.suggestions.find((x) => x.key === key);
  if (!sug || !decision) return;
  state.activity.unshift({
    time: new Date().toISOString(), suggestionKey: key, decision,
    evidenceKeys: [...sug.evidenceKeys], gapKg: coverage().gap.p50,
  });
  state.notice = { suggestionKey: key, decision };
  state.pendingDecision = null;
  renderAll();
}

function renderDecision(c) {
  const chosen = state.selectedSuggestion;
  const options = scenario.suggestions.map((sug) => {
    const id = `sug-${sug.id}`;
    const last = latestDecisionFor(sug.key);
    return h('label', { class: `suggestion${chosen === sug.key ? ' is-selected' : ''}`, for: id },
      h('input', { type: 'radio', name: 'suggestion', id, value: sug.key, checked: chosen === sug.key,
        onchange: () => { state.selectedSuggestion = sug.key; state.notice = null; renderAll(); document.getElementById(id)?.focus(); } }),
      h('span', { class: 'suggestion__body' },
        h('span', { class: 'suggestion__head' }, h('span', { class: 'suggestion__title' }, t(`suggest.${sug.key}`)), last ? stamp(last.decision) : null),
        h('span', { class: 'suggestion__reason' }, t(`suggest.${sug.key}.desc`)),
        h('span', { class: 'suggestion__evidence-label' }, t('decision.evidence')),
        h('ul', { class: 'evidence' }, sug.evidenceKeys.map((k) => h('li', {}, evidenceText(k, c))))));
  });
  const btn = (action, cls) => h('button', { class: `btn ${cls}`, type: 'button', disabled: !chosen, onclick: () => requestDecision(DECISIONS[action]) }, t(`decision.${action}`));

  return [
    viewTitle('decision', 'decision.title'), metaLine(),
    h('div', { class: 'decision' },
      h('div', { class: 'decision__left' },
        figure(t('decision.shortage'), c.gap.p50, t('decision.shortageLead', { gap: fmtKg(c.gap.p50) }),
          `P10 ${fmtKg(c.gap.p10)} · P50 ${fmtKg(c.gap.p50)} · P90 ${fmtKg(c.gap.p90)}`),
        h('h3', { class: 'panel__title' }, t('decision.gapInputs')),
        arithmeticLedger(c),
        c.offeredUnconfirmedKg > 0 ? h('p', { class: 'note' }, `${t('status.offered')} ${fmtKg(c.offeredUnconfirmedKg)} — ${t('supply.offeredNotCounted')}`) : null),
      h('div', { class: 'decision__right' },
        h('fieldset', { class: 'suggestions' }, h('legend', {}, t('decision.suggestions')), options),
        h('div', { class: 'actions' }, btn('approve', 'btn--primary'), btn('reject', 'btn--danger'), btn('review', 'btn--ghost'),
          !chosen ? h('span', { class: 'hint' }, t('decision.needChoice')) : null),
        h('p', { class: 'note' }, t('decision.humanRequired')),
        state.notice ? h('p', { class: 'notice', role: 'status' }, stamp(state.notice.decision), h('span', {}, t('decision.recorded'))) : null)),
  ];
}

function renderActivity(c) {
  const col = (name) => tFirst(`activity.columns.${name}`, `activity.${name}`);
  const body = state.activity.length === 0
    ? h('p', { class: 'empty' }, t('activity.empty'))
    : h('table', { class: 'ledger activity' },
      ledgerHead([col('time')], [col('suggestion')], [col('decision')], [col('evidence')]),
      h('tbody', {}, state.activity.map((a) => h('tr', { class: 'activity__row' },
        h('td', {}, h('time', { datetime: a.time }, fmtDateTime(a.time))),
        h('td', {}, t(`suggest.${a.suggestionKey}`), h('span', { class: 'is-dim' }, ` · ${t('activity.gapAtTime', { gap: fmtKg(a.gapKg) })}`)),
        h('td', {}, stamp(a.decision)),
        h('td', {}, h('ul', { class: 'evidence' }, a.evidenceKeys.map((k) => h('li', {}, evidenceText(k, c)))))))));
  return [viewTitle('activity', 'activity.title'), metaLine(), body, h('p', { class: 'note' }, t('activity.resetsNote'))];
}

function renderTechnical(c) {
  const m = scenario.meta;
  const integrations = h('table', { class: 'ledger' },
    h('tbody', {}, Object.entries(m.integrations).map(([k, v]) => h('tr', {},
      h('th', { scope: 'row' }, tFirst(`tech.integration.${k}`, `integration.${k}`)),
      h('td', {}, chipText('muted', v === 'not-connected' ? t('tech.notConnected') : v))))));
  const row = (label, ...val) => [h('dt', {}, label), h('dd', {}, ...val)];
  return [
    viewTitle('technical', 'tech.title'), metaLine(),
    h('dl', { class: 'tech' },
      row(t('tech.provenance'), t('provenance.synthetic')),
      row(t('tech.freshness'), fmtDateTime(m.asOf)),
      row(t('tech.validation'), chipText('warn', t('tech.notValidated'))),
      row(t('tech.percentiles'), renderPercentiles()),
      row(t('tech.trace'), renderTrace(c)),
      row(t('tech.integrations'), integrations, h('p', { class: 'note' }, t('tech.integrationsNote')))),
    h('p', { class: 'note' }, t('tech.notEvidence')),
    pilotPanel(),
  ];
}

const RENDERERS = { overview: renderOverview, supply: renderSupply, decision: renderDecision, activity: renderActivity, technical: renderTechnical };

// ---------------------------------------------------------------- chrome, signal, dialog

const $ = (sel, root = document) => root.querySelector(sel);
const dom = {
  skip: $('.skip-link'), rail: $('.rail'), toggle: $('.rail__toggle'), tagline: $('.rail__tagline'),
  links: [...document.querySelectorAll('.rail__link')], lang: $('.lang-toggle'), banner: $('.banner--demo'),
  views: Object.fromEntries(VIEWS.map((v) => [v, $(`.view[data-view="${v}"]`)])),
  signal: $('.signal'), dialog: $('dialog.confirm'),
};

function renderSignal(c) {
  dom.signal.replaceChildren(
    h('h2', { class: 'signal__title' }, t('supply.source')),
    freshnessChips(null),
    h('div', { class: 'signal__forecast' },
      h('h3', { class: 'signal__subtitle' }, t('overview.forecastRange')),
      renderRibbon(c, { compact: true }),
      h('p', { class: 'signal__summary' }, `${t('overview.possibleGap')}: ${fmtKg(c.gap.p50)} (${fmtKg(c.gap.p90)} – ${fmtKg(c.gap.p10)})`)));
}

function renderChrome() {
  dom.skip.textContent = t('a11y.skipToContent');
  dom.rail.setAttribute('aria-label', t('a11y.navLabel'));
  dom.toggle.setAttribute('aria-label', t('a11y.menuToggle'));
  dom.tagline.textContent = t('app.tagline');
  dom.banner.textContent = t('app.demoBanner');
  dom.lang.textContent = t('app.langToggle');
  dom.lang.setAttribute('aria-label', t('app.langToggle'));
  for (const link of dom.links) link.textContent = t(`nav.${link.dataset.view}`);
  renderDialog();
}

function renderDialog() {
  const d = dom.dialog, key = state.selectedSuggestion, decision = state.pendingDecision;
  const vars = { decision: decision ? t(`status.${decision}`) : '', suggestion: key ? t(`suggest.${key}`) : '', gap: fmtKg(coverage().gap.p50) };
  $('.confirm__title', d).textContent = t('decision.confirmTitle');
  $('.confirm__body', d).textContent = t('decision.confirmBody', vars);
  $('.confirm__detail', d).replaceChildren(...(decision && key ? [stamp(decision), ` ${t(`suggest.${key}`)}`] : []));
  $('.confirm__yes', d).textContent = t('decision.confirmYes');
  $('.confirm__yes', d).className = `btn ${decision === 'rejected' ? 'btn--danger' : 'btn--primary'} confirm__yes`;
  $('.confirm__no', d).textContent = t('decision.confirmNo');
  $('.confirm__no', d).setAttribute('aria-label', `${t('decision.confirmNo')} — ${t('a11y.closeDialog')}`);
}

function applyRoute() {
  for (const [name, section] of Object.entries(dom.views)) section.hidden = name !== state.view;
  for (const link of dom.links) {
    const active = link.dataset.view === state.view;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
}

function renderAll() {
  const c = coverage();
  document.documentElement.lang = state.lang;
  renderChrome();
  for (const v of VIEWS) dom.views[v].replaceChildren(...RENDERERS[v](c).flat(Infinity).filter((n) => n != null && n !== false));
  renderSignal(c);
  applyRoute();
}

// ---------------------------------------------------------------- events

function setRail(open) {
  dom.rail.classList.toggle('rail--open', open);
  dom.toggle.setAttribute('aria-expanded', String(open));
}

function routeFromHash(focusTitle = false) {
  const v = location.hash.replace(/^#/, '');
  state.view = VIEWS.includes(v) ? v : 'overview';
  applyRoute();
  if (focusTitle) document.getElementById(`view-title-${state.view}`)?.focus();
}

window.addEventListener('hashchange', () => routeFromHash(true));
for (const link of dom.links) {
  link.addEventListener('click', () => { location.hash = `#${link.dataset.view}`; setRail(false); });
}
dom.toggle.addEventListener('click', () => setRail(!dom.rail.classList.contains('rail--open')));
dom.lang.addEventListener('click', () => {
  const langs = Array.isArray(LANGS) ? LANGS : Object.keys(LANGS);
  state.lang = langs[(langs.indexOf(state.lang) + 1) % langs.length] || 'en';
  setLang(state.lang);
  renderAll();
});
dom.dialog.addEventListener('close', () => {
  if (dom.dialog.returnValue === 'confirm') recordDecision();
  else state.pendingDecision = null;
  dom.dialog.returnValue = '';
});

routeFromHash();
renderAll();
