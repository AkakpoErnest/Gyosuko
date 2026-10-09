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
const stamp = (decision) => h('span', { class: `stamp stamp--${decision}` }, t(`status.${decision}`));

function card(title, value, meta, extra) {
  return h('article', { class: 'card' },
    h('h3', { class: 'card__title' }, title),
    h('p', { class: 'card__value' }, value),
    meta ? h('p', { class: 'card__meta' }, meta) : null,
    extra || null);
}

const viewTitle = (view, key) => h('h2', { class: 'view__title', id: `view-title-${view}` }, t(key));

function pilotPanel() {
  return h('article', { class: 'card card--pilot' },
    h('h3', { class: 'card__title' }, t('pilot.title')),
    h('p', { class: 'card__meta' }, t('pilot.body')));
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
  const W = 600, H = compact ? 40 : 104, pad = 14;
  const max = Math.max(c.need, c.coverage.p90, c.stock + c.verifiedOffersKg);
  const x = (kg) => pad + (kg / max) * (W - 2 * pad);
  const barY = compact ? 12 : 34, barH = compact ? 14 : 20;
  const id = `ribbon-title-${++ribbonSeq}`;
  const label = (text, px, py, anchor = 'middle', cls = 'ribbon__label') =>
    s('text', { x: px, y: py, 'text-anchor': anchor, class: cls }, text);

  const kids = [
    s('title', { id }, t('a11y.ribbon', { p10: fmtKg(c.coverage.p10), p50: fmtKg(c.coverage.p50), p90: fmtKg(c.coverage.p90), need: fmtKg(c.need) })),
    s('rect', { x: x(0), y: barY, width: x(max) - x(0), height: barH, rx: 3, class: 'ribbon__track' }),
    s('rect', { x: x(c.stock), y: barY, width: x(c.coverage.p90) - x(c.stock), height: barH, class: 'ribbon__forecast' }),
    s('rect', { x: x(c.coverage.p10), y: barY, width: x(c.coverage.p90) - x(c.coverage.p10), height: barH, class: 'ribbon__range' }),
    s('rect', { x: x(0), y: barY, width: x(c.stock) - x(0), height: barH, rx: 3, class: 'ribbon__stock' }),
  ];
  for (const p of PCTS) {
    const px = x(c.coverage[p]);
    kids.push(s('line', { x1: px, x2: px, y1: barY - 4, y2: barY + barH + 4, class: `ribbon__marker ribbon__marker--${p}` }));
    if (!compact) kids.push(label(p.toUpperCase(), px, barY - 9), label(fmtKg(c.coverage[p]), px, barY + barH + 16));
  }
  const nx = x(c.need);
  kids.push(s('line', { x1: nx, x2: nx, y1: 6, y2: barY + barH + 6, class: 'ribbon__need' }));
  if (!compact) {
    kids.push(label(`${t('supply.requirements')} ${fmtKg(c.need)}`, Math.min(nx, W - pad), 12, 'end'));
    kids.push(label(`${t('supply.stock')} ${fmtKg(c.stock)}`, x(0), barY + barH + 16, 'start'));
  }
  if (c.verifiedOffersKg > 0) {
    const vy = compact ? barY + barH + 3 : barY + barH + 24;
    kids.push(s('rect', { x: x(c.stock), y: vy, width: x(c.stock + c.verifiedOffersKg) - x(c.stock), height: compact ? 5 : 8, rx: 2, class: 'ribbon__verified' }));
    if (!compact) kids.push(label(`${t('status.verified')} +${fmtKg(c.verifiedOffersKg)}`, x(c.stock + c.verifiedOffersKg) + 6, vy + 7, 'start'));
  }

  const svg = s('svg', { class: 'ribbon__svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-labelledby': id, preserveAspectRatio: 'none' }, kids);
  const parts = PCTS.map((p) => `${p.toUpperCase()} ${fmtKg(c.coverage[p])}`);
  if (c.verifiedOffersKg > 0) parts.push(`${t('status.verified')} +${fmtKg(c.verifiedOffersKg)}`);
  parts.push(`${t('supply.requirements')} ${fmtKg(c.need)}`);
  return h('figure', { class: `ribbon${compact ? ' ribbon--compact' : ''}` }, svg,
    h('figcaption', { class: 'ribbon__caption' }, `${t('supply.stock')} ${fmtKg(c.stock)} · ${parts.join(' · ')}`));
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

function renderOverview(c) {
  const o = scenario.order;
  return [
    viewTitle('overview', 'overview.title'),
    h('div', { class: 'cards' },
      card(t('overview.activeOrder'), fmtKg(o.quantityKg), `${t(`species.${o.species}`)} · ${t(`buyer.${o.buyer}`)} · ${t('overview.due', { date: fmtDate(o.dueDate) })}`),
      card(t('overview.confirmedStock'), fmtKg(c.stock), `${t(`location.${scenario.stock.location}`)} · ${fmtDateTime(scenario.stock.verifiedAt)}`, chip('verified')),
      card(t('overview.forecastRange'), `${fmtKg(c.coverage.p10)} – ${fmtKg(c.coverage.p90)}`, `P50 ${fmtKg(c.coverage.p50)}`, chipText('muted', t('provenance.synthetic'))),
      card(t('overview.possibleGap'), fmtKg(c.gap.p50), `P90 ${fmtKg(c.gap.p90)} – P10 ${fmtKg(c.gap.p10)}`, chipText('warn', t('tech.notValidated'))),
      card(t('overview.nextDeadline'), fmtDate(o.dueDate), o.id)),
    h('section', { class: 'panel' },
      h('h3', { class: 'panel__title' }, t('overview.arrivals')),
      h('ol', { class: 'timeline' }, scenario.arrivals.map((a) =>
        h('li', { class: 'timeline__item' },
          h('time', { class: 'timeline__date', datetime: a.date }, fmtDate(a.date)),
          h('span', { class: 'timeline__vessel' }, t(`vessel.${a.vesselKey}`)),
          h('span', { class: 'timeline__kg' }, fmtKg(a.expectedKg)),
          chip(a.status))))),
    pilotPanel(),
  ];
}

function toggleOffer(id) {
  const offer = state.offers.find((o) => o.id === id);
  if (!offer || offer.status === 'declined') return;
  offer.status = offer.status === 'verified' ? 'offered' : 'verified';
  renderAll();
}

function renderSupply(c) {
  const offersTable = h('table', { class: 'offers' },
    h('thead', {}, h('tr', {},
      h('th', { scope: 'col' }, t('supply.colSupplier')), h('th', { scope: 'col' }, t('supply.colQuantity')),
      h('th', { scope: 'col' }, t('supply.colEta')), h('th', { scope: 'col' }, t('supply.colStatus')), h('th', { scope: 'col' }, t('supply.colAction')))),
    h('tbody', {}, state.offers.map((o) => h('tr', { class: 'offers__row' },
      h('td', {}, t(`supplier.${o.supplier}`)),
      h('td', { class: 'num' }, fmtKg(o.quantityKg)),
      h('td', {}, fmtDate(o.etaDate)),
      h('td', {}, chip(o.status)),
      h('td', {}, o.status === 'declined' ? null : h('button', {
        class: `btn ${o.status === 'verified' ? 'btn--ghost' : 'btn--primary'}`, type: 'button',
        'aria-pressed': String(o.status === 'verified'), onclick: () => toggleOffer(o.id),
      }, t(o.status === 'verified' ? 'supply.unmarkVerified' : 'supply.markVerified')))))));

  return [
    viewTitle('supply', 'supply.title'),
    h('div', { class: 'cards' },
      card(t('supply.requirements'), fmtKg(c.need), `${t(`species.${scenario.order.species}`)} · ${t('overview.due', { date: fmtDate(scenario.order.dueDate) })}`),
      card(t('supply.stock'), fmtKg(c.stock), t(`location.${scenario.stock.location}`), chip('verified')),
      card(t('common.verifiedOffers'), fmtKg(c.verifiedOffersKg), `${fmtKg(c.offeredUnconfirmedKg)} — ${t('supply.offeredNotCounted')}`, chip(c.verifiedOffersKg > 0 ? 'verified' : 'offered'))),
    h('section', { class: 'panel' }, h('h3', { class: 'panel__title' }, t('supply.offers')), offersTable),
    h('section', { class: 'panel' },
      h('h3', { class: 'panel__title' }, t('supply.forecast')),
      renderRibbon(c),
      freshnessChips(c),
      h('details', { class: 'disclosure' },
        h('summary', {}, t('supply.howFormed')),
        h('p', {}, t('supply.percentilesIntro')),
        renderPercentiles(),
        h('h4', {}, t('supply.trace')),
        renderTrace(c))),
    h('p', { class: 'note' }, t('tech.notEvidence')),
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
  const inputs = h('ul', { class: 'inputs' },
    h('li', {}, `${t('supply.requirements')}: ${fmtKg(c.need)}`),
    h('li', {}, `${t('supply.stock')}: ${fmtKg(c.stock)}`),
    h('li', {}, `P50 ${t('supply.forecast')}: ${fmtKg(landingsKg('p50'))}`),
    c.verifiedOffersKg > 0 ? h('li', {}, `${t('status.verified')} ${t('supply.offers')}: ${fmtKg(c.verifiedOffersKg)}`) : null,
    c.offeredUnconfirmedKg > 0 ? h('li', {}, `${t('status.offered')} ${fmtKg(c.offeredUnconfirmedKg)} — ${t('supply.offeredNotCounted')}`) : null);

  const options = scenario.suggestions.map((sug) => {
    const id = `sug-${sug.id}`;
    const last = latestDecisionFor(sug.key);
    return h('label', { class: `suggestion${chosen === sug.key ? ' is-selected' : ''}`, for: id },
      h('input', { type: 'radio', name: 'suggestion', id, value: sug.key, checked: chosen === sug.key,
        onchange: () => { state.selectedSuggestion = sug.key; state.notice = null; renderAll(); document.getElementById(id)?.focus(); } }),
      h('span', { class: 'suggestion__body' },
        h('span', { class: 'suggestion__head' }, h('span', { class: 'suggestion__title' }, t(`suggest.${sug.key}`)), last ? stamp(last.decision) : null),
        h('span', { class: 'suggestion__reason' }, `${t('decision.reason')}: ${t(`suggest.${sug.key}.desc`)}`),
        h('span', { class: 'suggestion__evidence-label' }, t('decision.evidence')),
        h('ul', { class: 'evidence' }, sug.evidenceKeys.map((k) => h('li', {}, evidenceText(k, c))))));
  });

  const btn = (action, cls) => h('button', { class: `btn ${cls}`, type: 'button', disabled: !chosen, onclick: () => requestDecision(DECISIONS[action]) }, t(`decision.${action}`));

  return [
    viewTitle('decision', 'decision.title'),
    h('article', { class: 'card card--shortage' },
      h('h3', { class: 'card__title' }, t('decision.shortage')),
      h('p', { class: 'card__value' }, fmtKg(c.gap.p50)),
      h('p', { class: 'card__lead' }, t('decision.shortageLead', { gap: fmtKg(c.gap.p50) })),
      h('h4', { class: 'card__meta' }, t('decision.gapInputs')), inputs,
      chipText('warn', t('tech.notValidated'))),
    h('fieldset', { class: 'suggestions' }, h('legend', {}, t('decision.suggestions')), options),
    h('div', { class: 'actions' }, btn('approve', 'btn--primary'), btn('reject', 'btn--danger'), btn('review', 'btn--ghost')),
    !chosen ? h('p', { class: 'hint' }, t('decision.needChoice')) : null,
    h('p', { class: 'note' }, t('decision.humanRequired')),
    state.notice ? h('p', { class: 'notice notice--ok', role: 'status' }, stamp(state.notice.decision), ` ${t('decision.recorded')}`) : null,
  ];
}

function renderActivity(c) {
  const col = (name) => tFirst(`activity.columns.${name}`, `activity.${name}`);
  const body = state.activity.length === 0
    ? h('p', { class: 'empty' }, t('activity.empty'))
    : h('table', { class: 'activity' },
      h('thead', {}, h('tr', {}, ['time', 'suggestion', 'decision', 'evidence'].map((n) => h('th', { scope: 'col' }, col(n))))),
      h('tbody', {}, state.activity.map((a) => h('tr', { class: 'activity__row' },
        h('td', {}, h('time', { datetime: a.time }, fmtDateTime(a.time))),
        h('td', {}, t(`suggest.${a.suggestionKey}`), h('span', { class: 'activity__gap' }, ` · ${t('activity.gapAtTime', { gap: fmtKg(a.gapKg) })}`)),
        h('td', {}, stamp(a.decision)),
        h('td', {}, h('ul', { class: 'evidence' }, a.evidenceKeys.map((k) => h('li', {}, evidenceText(k, c)))))))));
  return [viewTitle('activity', 'activity.title'), body, h('p', { class: 'note' }, t('activity.resetsNote'))];
}

function renderTechnical(c) {
  const m = scenario.meta;
  const integrations = h('table', { class: 'integrations' },
    h('tbody', {}, Object.entries(m.integrations).map(([k, v]) => {
      const label = tFirst(`tech.integration.${k}`, `integration.${k}`);
      return h('tr', {},
        h('th', { scope: 'row' }, label === `tech.${k}` ? k : label),
        h('td', {}, chipText('muted', v === 'not-connected' ? t('tech.notConnected') : v)));
    })));
  const row = (label, ...val) => [h('dt', {}, label), h('dd', {}, ...val)];
  return [
    viewTitle('technical', 'tech.title'),
    h('dl', { class: 'tech' },
      row(t('tech.provenance'), chipText('muted', t('provenance.synthetic'))),
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

function routeFromHash() {
  const v = location.hash.replace(/^#/, '');
  state.view = VIEWS.includes(v) ? v : 'overview';
  applyRoute();
}

window.addEventListener('hashchange', routeFromHash);
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
