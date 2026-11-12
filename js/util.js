/* ---------- utils, state, audio ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function addDays(str,n){const [y,m,d]=str.split('-').map(Number);const t=new Date(y,m-1,d+n);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function shuffle(a,seed){const r=seed===undefined?Math.random:rng(seed);a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const CY={'а':'a','б':'b','в':'v','г':'g','д':'d','ђ':'đ','е':'e','ж':'ž','з':'z','и':'i','ј':'j','к':'k','л':'l','љ':'lj','м':'m','н':'n','њ':'nj','о':'o','п':'p','р':'r','с':'s','т':'t','ћ':'ć','у':'u','ф':'f','х':'h','ц':'c','ч':'č','џ':'dž','ш':'š'};
const L2C={a:'а',b:'б',v:'в',g:'г',d:'д',đ:'ђ',e:'е',ž:'ж',z:'з',i:'и',j:'ј',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',r:'р',s:'с',t:'т',ć:'ћ',u:'у',f:'ф',h:'х',c:'ц',č:'ч',š:'ш'};
function toLat(s){return s.toLowerCase().replace(/[а-яђјљњћџ]/g,c=>CY[c]!==undefined?CY[c]:c)}
function norm(s){return toLat(s).replace(/[.,!?;:"'«»„“”()]/g,'').replace(/\s+/g,' ').trim()}
function flat(s){return norm(s).replace(/dž/g,'dz').replace(/đ/g,'dj').replace(/[čć]/g,'c').replace(/š/g,'s').replace(/ž/g,'z')}
function latToCyr(s){return s.replace(/(lj|nj|dž)|([a-zA-ZčćšđžČĆŠĐŽ])/gi,(m,di,ch)=>{
  if(di){const k=di.toLowerCase();const r=k==='lj'?'љ':k==='nj'?'њ':'џ';return di[0]===di[0].toUpperCase()?r.toUpperCase():r}
  const lo=ch.toLowerCase();const r=L2C[lo];if(!r)return ch;return ch===lo?r:r.toUpperCase()})}

/* ---------- state (device storage) ---------- */
const KEY='srpski-trener-v2';
const DEF={t:0,tab:'course',script:'lat',done:{},prog:{},srs:{},rev:null,days:[],last:null,car:{id:null,t:0},tot:{r:0,w:0},sub:'tables',stat:{},cst:{},tr:null,dlg:{},tsub:'weak',dopen:null};
function fresh(o){return Object.assign({},JSON.parse(JSON.stringify(DEF)),o||{})}
let S=fresh();
try{const raw=localStorage.getItem(KEY);if(raw)S=fresh(JSON.parse(raw))}catch(e){}
function save(){S.t=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function disp(s){return S.script==='cyr'?latToCyr(s):s}
function bump(right){const t=today();if(!S.days.includes(t)){S.days.push(t);if(S.days.length>500)S.days.shift()}if(right!==undefined){if(right)S.tot.r++;else S.tot.w++}}
function streak(){const t=today();let d=S.days.includes(t)?t:addDays(t,-1);let n=0;while(S.days.includes(d)){n++;d=addDays(d,-1)}return n}
function toast(m){const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),2400)}

/* ---------- course + audio manifest ---------- */
let COURSE={lessons:[]};
let DIALOGS=[];
let AUDIO={clips:{},car:{}};
let AUDIO_OK=false;
async function loadData(){
  try{const r=await fetch('data/course.json',{cache:'no-cache'});COURSE=await r.json()}catch(e){}
  try{const r=await fetch('data/dialogs.json',{cache:'no-cache'});if(r.ok){DIALOGS=(await r.json()).dialogs||[]}}catch(e){}
  try{const r=await fetch('audio/manifest.json',{cache:'no-cache'});if(r.ok){AUDIO=await r.json();AUDIO_OK=true}}catch(e){}
}
const lesson=id=>COURSE.lessons.find(l=>l.id===id);
const dialog=id=>DIALOGS.find(d=>d.id===id);
/* answer options are shuffled for display (the stored answer is always index 0 in newer lessons) */
function xShuf(L,i){const q=L.x[i];const idx=shuffle(q[1].map((_,k)=>k),hash(L.id+'x'+i));return [q[0],idx.map(k=>q[1][k]),idx.indexOf(q[2]),q[3]]}
function stat(id,right){const s=S.stat[id]||(S.stat[id]={r:0,w:0});if(right)s.r++;else s.w++}
function cstat(tag,right){const s=S.cst[tag]||(S.cst[tag]={r:0,w:0});if(right)s.r++;else s.w++}
let clipEl=null;
function stopClip(){try{if(clipEl){clipEl.pause();clipEl=null}}catch(e){}}
function playClip(text){
  const f=AUDIO.clips&&AUDIO.clips[text];
  const car=$('#car');if(car&&!car.paused)car.pause();
  if(f){stopClip();clipEl=new Audio('audio/'+f);clipEl.play().catch(()=>toast('Нажмите ещё раз: браузер не дал включить звук'));return}
  try{
    const ss=window.speechSynthesis;if(!ss)throw 0;
    const u=new SpeechSynthesisUtterance(text);const vs=ss.getVoices();
    const v=vs.find(x=>/^sr/i.test(x.lang))||vs.find(x=>/^(hr|bs)/i.test(x.lang));
    if(v){u.voice=v;u.lang=v.lang}else u.lang='sr-RS';u.rate=.85;ss.cancel();ss.speak(u);
  }catch(e){toast('Озвучка появится после сборки на GitHub')}
}
