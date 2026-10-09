const KEY = 'gyosoku.predictions.v1';
const LANG = 'gyosoku.lang';
const species = { skipjack: ['Skipjack', 'カツオ'], tuna: ['Tuna', 'マグロ'], mackerel: ['Mackerel', 'サバ'], sardine: ['Sardine', 'イワシ'] };
let lang = 'ja', records = [], readable = true;
try { lang = (localStorage.getItem(LANG) || localStorage.getItem('gyosoku.predictions.language')) === 'en' ? 'en' : 'ja'; const saved = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(saved)) throw Error('Invalid saved board'); records = saved.filter(valid).slice(0, 500); }
catch { readable = false; }
const text = (en, ja) => lang === 'ja' ? ja : en;
const number = n => new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-US').format(n);
function valid(r) { return r && typeof r.id === 'string' && species[r.species] && typeof r.port === 'string' && r.port.length <= 80 && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(r.quantity) && r.quantity >= 0 && r.quantity <= 1000000 && [30,60,90].includes(r.confidence) && (r.actual === null || Number.isFinite(r.actual) && r.actual >= 0 && r.actual <= 1000000); }
function el(tag, className, content) { const node = document.createElement(tag); if (className) node.className = className; if (content !== undefined) node.textContent = content; return node; }
function day(offset = 0) { const parts = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Tokyo', year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); const values = Object.fromEntries(parts.map(p => [p.type,p.value])); const d = new Date(`${values.year}-${values.month}-${values.day}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+offset); return d.toISOString().slice(0,10); }
const form = document.getElementById('prediction-form');
form.elements.date.min = day(); form.elements.date.max = day(365); form.elements.date.value = day(1);
const feedback = document.getElementById('feedback');
function save(next) { if (!readable) { feedback.textContent = text('Saved data could not be read. Please use another browser or check storage access; existing data has not been overwritten.', '保存データを読み取れません。別のブラウザを使うか保存設定をご確認ください。既存データは上書きされていません。'); return false; } try { localStorage.setItem(KEY, JSON.stringify(next)); records = next; return true; } catch { feedback.textContent = text('Could not save. Check browser storage access and try again.', '保存できませんでした。ブラウザの保存設定をご確認ください。'); return false; } }
function render() {
 document.documentElement.lang = lang;
 document.title = text('Gyosoku — Prediction board', 'Gyosoku — 見込み一覧');
 document.getElementById('language').textContent = text('日本語', 'English');
 document.querySelectorAll('[data-en]').forEach(node => { node.textContent = node.dataset[lang]; });
 document.getElementById('count').textContent = text(`${number(records.length)} entries`, `${number(records.length)}件`);
 const board = document.getElementById('entries'); board.replaceChildren();
 if (!records.length) board.append(el('p','empty',text('Your first prediction starts here. Add an estimate on the left or above.', '最初の見込みを入力しましょう。左側または上のフォームから追加できます。')));
 for (const r of records) {
  const card = el('article','prediction'); const top = el('div','prediction-top');
  const title = el('h3','',species[r.species][lang==='ja'?1:0]); top.append(title,el('span','badge',r.actual===null?text('Estimate','見込み'):text('Compared','比較済み')));
  card.append(top,el('p','muted',`${r.date} · ${r.port}`));
  const kg = el('p','quantity',number(r.quantity)+' '); kg.append(el('small','', 'kg')); card.append(kg,el('p','muted',text('Estimated landing','水揚げ見込み')));
  const meter=el('div','confidence'); meter.setAttribute('aria-hidden','true'); const fill=el('span');fill.style.width=r.confidence+'%';meter.append(fill);
  card.append(meter,el('p','muted',text(`Your confidence: ${r.confidence}% · self-reported`, `自信度：${r.confidence}% · 自己評価`)));
  if (r.actual !== null) { const delta=r.actual-r.quantity; card.append(el('p','result',text(`Actual: ${number(r.actual)} kg · ${delta===0?'matched your estimate':`${number(Math.abs(delta))} kg ${delta>0?'above':'below'} your estimate`}`,`実際：${number(r.actual)} kg · ${delta===0?'見込みと一致':`見込みより${number(Math.abs(delta))} kg ${delta>0?'多い':'少ない'}`}`))); }
  const actualForm=el('form','actual-form'); const label=el('label','',r.actual===null?text('Actual landing (kg)','実際の水揚げ量（kg）'):text('Update actual landing (kg)','実際の水揚げ量を修正（kg）'));
  const input=el('input');input.id='actual-'+r.id;input.type='number';input.min='0';input.max='1000000';input.step='1';input.required=true;input.inputMode='numeric';if(r.actual!==null)input.value=String(r.actual);label.htmlFor=input.id;
  const fields=el('div','actual-fields');const button=el('button','',text('Compare','比べる'));button.type='submit';fields.append(input,button);actualForm.append(label,fields,el('p','muted',text('Enter a checked quantity. This is recorded by you, not independently verified.','確認した量を入力してください。自己申告で、第三者による検証はありません。')));
  actualForm.addEventListener('submit',event=>{event.preventDefault();const actual=Number(input.value);if(input.value.trim()===''||!Number.isInteger(actual)||actual<0||actual>1000000){input.reportValidity();return;}if(save(records.map(row=>row.id===r.id?{...row,actual}:row))){render();feedback.textContent=text('Actual landing saved on this device.','実際の量をこの端末に保存しました。');}});
  card.append(actualForm);board.append(card);
 }
 if(!readable) feedback.textContent=text('Browser storage is unavailable or unreadable. Entries cannot be saved here yet.', 'ブラウザの保存領域を利用できません。今はこの端末に保存できません。');
}
form.addEventListener('submit',event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const data=new FormData(form);const record={id:crypto.randomUUID(),species:data.get('species'),date:data.get('date'),port:data.get('port').trim(),quantity:Number(data.get('quantity')),confidence:Number(data.get('confidence')),actual:null};
 if(!valid(record)||!record.port||record.date<day()||record.date>day(365)||!Number.isInteger(record.quantity)){feedback.textContent=text('Please check the date, port and quantity.','日付・港・数量をご確認ください。');return;}
 if(records.length>=500){feedback.textContent=text('This local board is full (500 entries).','この端末の保存上限（500件）に達しました。');return;}
 if(save([record,...records])) {form.elements.quantity.value='';render();feedback.textContent=text('Prediction saved on this device.','見込みをこの端末に保存しました。');}
});
document.getElementById('language').addEventListener('click',()=>{lang=lang==='en'?'ja':'en';try{localStorage.setItem(LANG,lang);}catch{}feedback.textContent='';render();});
render();
