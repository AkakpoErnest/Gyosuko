function valid(data){return data && Number.isFinite(Date.parse(data.retrievedAt)) && Array.isArray(data.days) && data.days.length>0 && data.days.length<=3 && data.days.every(d=>d && typeof d.date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && [d.windMaxMs,d.rainMm,d.waveMaxM].every(v=>v===null||Number.isFinite(v)));}
const main=document.getElementById('main');
if(main){
 let data=null, failed=false, busy=false, fromCache=false;
 try {const stored=JSON.parse(localStorage.getItem('gyosoku.conditions.v1')||'null');if(valid(stored))data=stored;}catch{}
 const card=document.createElement('section');card.className='field-conditions';
 const text=(en,ja)=>document.documentElement.lang.startsWith('ja')?ja:en;
 const el=(tag,content,cls)=>{const n=document.createElement(tag);if(content!==undefined)n.textContent=content;if(cls)n.className=cls;return n;};
 function link(label,url){const a=el('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
 function render(){
  if(document.body.dataset.screen!=='sea'){card.remove();return;}
  if(!main.contains(card))main.append(card);
  card.replaceChildren(el('h2',text('Kesennuma · 3-day outlook','気仙沼 · 3日間の見通し')),el('p',text('Public weather forecasts for Kesennuma and an offshore reference point.','気仙沼の天気と沖合の基準地点の波の予報です。')));
  if(data){
   const retrieved=new Date(data.retrievedAt);const time=Number.isNaN(retrieved.valueOf())?'—':new Intl.DateTimeFormat(document.documentElement.lang,{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(retrieved);
   const table=el('table',undefined,'conditions-table');table.append(el('caption',text(`${fromCache?'Saved copy':'Retrieved'}: ${time} JST`,`${fromCache?'保存済みデータ':'取得時刻'}：${time}（日本時間）`)));
   const head=el('thead'),row=el('tr');for(const s of [text('Date','日付'),text('Wind max','最大風速'),text('Rain','降水量'),text('Waves max','最大波高')]){const th=el('th',s);th.scope='col';row.append(th);}head.append(row);table.append(head);
   const body=el('tbody');const num=v=>Number.isFinite(v)?v.toFixed(1):'—';for(const d of data.days.slice(0,3)){const r=el('tr');const date=el('th',d.date.slice(5).replace('-','/'));date.scope='row';r.append(date,el('td',num(d.windMaxMs)+' m/s'),el('td',num(d.rainMm)+' mm'),el('td',num(d.waveMaxM)+' m'));body.append(r);}table.append(body);card.append(table);
   if(Number.isFinite(data.seaPoint?.latitude)&&Number.isFinite(data.seaPoint?.longitude))card.append(el('p',text(`Offshore wave grid: ${data.seaPoint.latitude.toFixed(2)}°N, ${data.seaPoint.longitude.toFixed(2)}°E`,`沖合の波の基準地点：北緯${data.seaPoint.latitude.toFixed(2)}度、東経${data.seaPoint.longitude.toFixed(2)}度`),'conditions-note'));
   if(!data.weatherAvailable||!data.marineAvailable)card.append(el('p',text('Some forecast values are unavailable.','一部の予報値を取得できません。')));
  }else card.append(el('p',busy?text('Loading public data…','公開データを取得中…'):text('Forecast data is unavailable right now.','現在、予報データを取得できません。'),'conditions-note'));
  if(failed&&data)card.append(el('p',text('Could not refresh. Showing a previously saved forecast; check its date.','更新できませんでした。以前の予報を表示しています。日付をご確認ください。'),'conditions-note'));
  card.append(el('p',text('Model forecasts, not catch predictions or permission to sail. Check official warnings and local conditions. Wave values represent the offshore point, not conditions inside the harbor.','モデルによる予報で、漁獲量予測や出航判断ではありません。公式の警報と現地の状況をご確認ください。波の値は沖合の基準地点で、港内の状況ではありません。'),'conditions-note'));
  const sources=el('div',undefined,'conditions-sources');sources.append(link('Open-Meteo','https://open-meteo.com/'),link('DWD · GWAM','https://www.dwd.de/EN/ourservices/abbe_wellenmodelle/abbe_wellenmodelle.html'),link(text('JMA warnings ↗','気象庁の警報 ↗'),'https://www.jma.go.jp/bosai/warning/'));card.append(sources);
  const refresh=el('button',busy?text('Updating…','更新中…'):text('Refresh outlook','見通しを更新'));refresh.type='button';refresh.disabled=busy;refresh.addEventListener('click',load);card.append(refresh);
  const trial=el('a',text('Try it with a fisherman ↗','漁業者と試してみる ↗'),'field-test-link');trial.href='/field-test/';card.append(trial);
 }
 async function load(){if(busy)return;busy=true;render();try{const r=await fetch('/api/conditions',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();const next=await r.json();if(!valid(next))throw Error();data=next;failed=false;fromCache=false;try{localStorage.setItem('gyosoku.conditions.v1',JSON.stringify(data));}catch{}}catch{failed=true;fromCache=!!data;}finally{busy=false;render();}}
 new MutationObserver(()=>{render();if(document.body.dataset.screen==='sea'&&!busy&&!failed&&(!data||Date.now()-Date.parse(data.retrievedAt)>1800000))load();}).observe(document.body,{attributes:true,attributeFilter:['data-screen']});
 new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 render();if(document.body.dataset.screen==='sea')load();
}
