// Decorative movement for the processor workspace; order values and actions are unchanged.
const workspace=document.querySelector('.workspace');
if(workspace){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=false;try{paused=sessionStorage.getItem('gyosoku.processor.motion')==='paused';}catch{}
 const NS='http://www.w3.org/2000/svg';
 function svg(tag,attrs,...children){const node=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));node.append(...children.flat());return node;}
 const strip=document.createElement('div');strip.className='processor-harbor';
 const graphic=svg('svg',{viewBox:'0 0 1000 130',preserveAspectRatio:'xMidYMid slice','aria-hidden':'true',focusable:'false'},
  svg('path',{class:'pm-wave pm-wave-back',d:'M-100 85Q0 50 100 85T300 85T500 85T700 85T900 85T1100 85V180H-100Z'}),
  svg('g',{class:'pm-boat'},svg('path',{class:'pm-hull',d:'M140 66H245L225 88H155Z'}),svg('path',{class:'pm-cabin',d:'M171 65V37H211V65Z'}),svg('path',{class:'pm-window',d:'M178 44H204V57H178Z'}),svg('path',{class:'pm-antenna',d:'M191 36V20'}),svg('circle',{class:'pm-signal',cx:191,cy:18,r:5})),
  svg('g',{class:'pm-fish'},svg('image',{href:'/public/skipjack-real.png',x:605,y:49,width:120,height:60})),
  svg('g',{class:'pm-fish pm-fish-small'},svg('image',{href:'/public/skipjack-real.png',x:760,y:70,width:75,height:37})),
  svg('path',{class:'pm-wave pm-wave-front',d:'M-100 112Q0 80 100 112T300 112T500 112T700 112T900 112T1100 112V180H-100Z'}));
 strip.append(graphic);
 const controls=document.createElement('div');controls.className='pm-controls';
 const pause=document.createElement('button'),splash=document.createElement('button');pause.type=splash.type='button';controls.append(splash,pause);strip.append(controls);
 workspace.querySelector('.banner')?.after(strip);
 function labels(){const ja=document.documentElement.lang.startsWith('ja');pause.textContent=paused?(ja?'動きを再開 ▷':'Resume motion ▷'):(ja?'動きを一時停止 Ⅱ':'Pause motion Ⅱ');pause.setAttribute('aria-pressed',String(paused));splash.textContent=ja?'波を起こす ↗':'Make waves ↗';controls.hidden=reduced.matches;}
 function apply(){document.body.classList.add('processor-motion');document.body.classList.toggle('pm-paused',paused||document.hidden||reduced.matches);labels();}
 pause.addEventListener('click',()=>{paused=!paused;try{sessionStorage.setItem('gyosoku.processor.motion',paused?'paused':'playing');}catch{}apply();});
 let timer;splash.addEventListener('click',()=>{if(paused||reduced.matches)return;strip.classList.remove('pm-splash');void strip.offsetWidth;strip.classList.add('pm-splash');clearTimeout(timer);timer=setTimeout(()=>strip.classList.remove('pm-splash'),1200);});
 document.addEventListener('visibilitychange',apply);reduced.addEventListener('change',apply);new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('pm-arrived');observer.unobserve(entry.target);}},{threshold:.05});
 const seen=new WeakSet();let frame=0;
 function prepare(){frame=0;for(const view of document.querySelectorAll('.view:not([hidden]),.signal')){let i=0;for(const node of view.querySelectorAll('.panel,.figure,.ribbon,.lede,.next-steps,.overview-plain,.say,.suggestion')){if(seen.has(node))continue;seen.add(node);node.classList.add('pm-reveal');node.style.setProperty('--pm-delay',`${Math.min(i++,4)*65}ms`);observer.observe(node);}}}
 new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(prepare);}).observe(workspace,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});apply();prepare();
}
