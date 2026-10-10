import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const code=fs.readFileSync('src/fisherman.js','utf8');
const tracking=fs.readFileSync('src/track.js','utf8');
const shared=new Map([['gyosoku.app.v2',JSON.stringify({profile:{name:'Normal sentinel',role:'fisherman'},records:[{id:'normal'}]})],['gyosoku.session.v1','session sentinel']]);
const sessions=new Map();
const calls=[];const requests=[];
function storage(map){return {getItem(k){calls.push(['read',k]);return map.get(k)??null},setItem(k,v){calls.push(['write',k]);map.set(k,v)},removeItem(k){calls.push(['remove',k]);map.delete(k)}}}
function run(search){
 const c=vm.createContext({URLSearchParams,location:{search,href:''},localStorage:storage(shared),sessionStorage:storage(sessions),crypto,Date,console,navigator:{},window:{},document:{},fetch(url){requests.push(url);return Promise.resolve({})},backend:{getSession:()=>null,init(){throw Error('backend init called')},onSessionLost(){}},render(){},go(){},toast(){},jst:()=> '2026-10-10',addDays:(_,n)=>`2026-10-${10+n}`});
 const head=code.slice(code.indexOf('const DEMO'),code.indexOf('// ------------------------------------------------------------------ helpers'));
 vm.runInContext(head,c);
 vm.runInContext(code.slice(code.indexOf('function seedDemo()'),code.indexOf('function demoBar()')),c);
 vm.runInContext(code.slice(code.indexOf('async function saveRecord()'),code.indexOf('function detailView')),c);
 // Execute production boot with rendering stubbed; tests real data/backend branch.
 vm.runInContext(code.slice(code.indexOf('async function boot()'),code.indexOf('// Page-wide backdrop')),c);
 if(search || sessions.has('gy.demo')) vm.runInContext(tracking,c);
 return c;
}
const before=new Map(shared);const demo=run('?demo=1');
await vm.runInContext('boot()',demo);
assert.equal(vm.runInContext('S.records.length',demo),9);
vm.runInContext("S.draft={species:'tuna',quantity:800,date:'2026-10-10'}",demo);
await vm.runInContext('saveRecord()',demo);
assert.equal(JSON.parse(shared.get('gyosoku.app.demo')).records.length,10);
assert.equal(shared.get('gyosoku.app.v2'),before.get('gyosoku.app.v2'));
assert.equal(shared.get('gyosoku.session.v1'),before.get('gyosoku.session.v1'));
assert(!calls.some(([,k])=>['gyosoku.app.v2','gyosoku.session.v1'].includes(k)));
assert.equal(requests.length,0);
const reload=run(''); await vm.runInContext('boot()',reload); assert.equal(vm.runInContext('S.records.length',reload),10); assert.equal(requests.length,0); assert(!calls.some(([,k])=>['gyosoku.app.v2','gyosoku.session.v1'].includes(k))); const demoCalls=[...calls];
// Execute the actual exit click body, extracted from the owned frontend source.
const exit=code.match(/click: \(\) => \{ (try \{ sessionStorage.removeItem\('gy.demo'\).*?location.href = '\/fisherman\/';) \}/)[1];
vm.runInContext(exit,demo);assert.equal(demo.location.href,'/fisherman/');
const normal=run('');assert.equal(vm.runInContext('S.profile.name',normal),'Normal sentinel');assert.equal(vm.runInContext('S.records[0].id',normal),'normal');
console.log(JSON.stringify({result:'PASS',scope:'Node VM production storage/boot/save/track/exit logic; rendering stubbed, not browser',demoStorageOperations:demoCalls,networkCalls:requests.length,savedDemoRecords:10,exitNormalProfile:'Normal sentinel'},null,2));
