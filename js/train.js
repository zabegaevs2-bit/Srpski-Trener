/* ---------- trainer: weak spots, case drills, dialogs ---------- */
function topicName(id){const L=lesson(id);return L?L.lvl+' · '+L.n+'. '+L.title:id}
const TSUBS=[['weak','Слабые места'],['drill','Падежи'],['dlg','Диалоги']];

function qGet(key){
  const [t,a,b]=key.split(':');
  if(t==='x'){const L=lesson(a);if(!L||!L.x||!L.x[b])return null;const q=xShuf(L,+b);return {text:q[0],opts:q[1],ans:q[2],expl:q[3]||'',tag:L.lvl+' · '+L.n+'. '+L.title,lid:L.id}}
  const src=t==='c'?CASE_DRILL:t==='p'?PRON_DRILL:null;if(!src||!src[a])return null;
  const q=src[a];const idx=shuffle(q[1].map((_,k)=>k),hash(key));
  return {text:q[0],opts:idx.map(k=>q[1][k]),ans:idx.indexOf(q[2]),expl:q[4]||'',tag:q[3],cs:q[3],kind:t}
}
function accPct(s){return Math.round(100*s.r/Math.max(1,s.r+s.w))}
function weakLessons(){
  return Object.entries(S.stat).map(([id,s])=>({id,s,n:s.r+s.w,acc:s.r/(s.r+s.w)})).filter(o=>o.n>=3&&lesson(o.id)&&o.acc<0.9).sort((a,b)=>a.acc-b.acc);
}
function weakCases(){
  return Object.entries(S.cst).map(([tag,s])=>({tag,s,n:s.r+s.w,acc:s.r/(s.r+s.w)})).filter(o=>o.n>=3&&o.acc<0.9).sort((a,b)=>a.acc-b.acc);
}
function buildSession(kind){
  let keys=[];
  const cAll=CASE_DRILL.map((_,i)=>'c:'+i),pAll=PRON_DRILL.map((_,i)=>'p:'+i);
  if(kind==='weak'){
    weakLessons().slice(0,3).forEach(o=>{const L=lesson(o.id);(L.x||[]).forEach((_,i)=>keys.push('x:'+o.id+':'+i))});
    const wc=new Set(weakCases().slice(0,3).map(o=>o.tag));
    CASE_DRILL.forEach((q,i)=>{if(wc.has(q[3]))keys.push('c:'+i)});
    PRON_DRILL.forEach((q,i)=>{if(wc.has(q[3]))keys.push('p:'+i)});
    Object.keys(S.srs).forEach(k=>{if(k.startsWith('x:')&&S.srs[k].box===0&&qGet(k))keys.push(k)});
  }else if(kind==='cases')keys=cAll;
  else if(kind==='pron')keys=pAll;
  else keys=cAll.concat(pAll);
  keys=[...new Set(keys)].filter(k=>qGet(k));
  keys=shuffle(keys).slice(0,12);
  if(!keys.length)return null;
  return {kind,keys,pos:0,r:0,w:0,miss:[]};
}
function barRow(name,s){
  const p=accPct(s);
  return '<div class="arow"><span class="nm">'+esc(name)+'</span><span class="acc'+(p<75?' weak':'')+'"><i style="width:'+p+'%"></i></span><span class="pc">'+p+'%</span></div>';
}
function vTrain(){
  const nav='<div class="row">'+TSUBS.map(s=>'<button class="btn'+(S.tsub===s[0]?' primary':'')+'" style="flex:1 1 90px;padding:10px 6px;text-align:center" data-a="tsub" data-s="'+s[0]+'">'+s[1]+'</button>').join('')+'</div>';
  let b='';
  if(S.tr&&S.tsub!=='dlg')b=vTrRun();
  else if(S.tsub==='weak')b=vWeak();
  else if(S.tsub==='drill')b=vDrill();
  else b=vDialogs();
  return '<h2>Тренер</h2>'+nav+b;
}
function vWeak(){
  const wl=weakLessons(),wc=weakCases();
  const all=Object.entries(S.stat).filter(([id,s])=>s.r+s.w>=3&&lesson(id)).sort((a,b)=>accPct(a[1])-accPct(b[1])).slice(0,8);
  let h='<div class="card"><span class="label">Что хуже всего получается</span>';
  if(!all.length&&!wc.length)h+='<p class="muted">Пока мало данных. Пройдите несколько уроков или падежный тренажёр, и здесь появится список тем, где вы чаще всего ошибаетесь.</p>';
  else{
    h+=all.map(([id,s])=>barRow(topicName(id),s)).join('');
    const cs=Object.entries(S.cst).filter(([t,s])=>s.r+s.w>=3).sort((a,b)=>accPct(a[1])-accPct(b[1]));
    if(cs.length)h+='<span class="label" style="margin-top:8px">По падежам</span>'+cs.map(([t,s])=>barRow(t,s)).join('');
  }
  h+='</div>';
  const can=wl.length||wc.length||Object.keys(S.srs).some(k=>k.startsWith('x:')&&S.srs[k].box===0);
  h+='<div class="card"><h3>Тренировка слабых мест</h3><p class="muted">12 вопросов из тем, где точность ниже 90%, и из тех, где вы уже ошибались.</p>'+(can?'<button class="btn primary" data-a="tstart" data-k="weak">Начать</button>':'<p>Слабых мест не найдено. Продолжайте уроки или выберите падежный тренажёр.</p><button class="btn" data-a="tsub" data-s="drill">К тренажёру падежей</button>')+'</div>';
  return h;
}
function vDrill(){
  const cs=Object.entries(S.cst).filter(([t,s])=>s.r+s.w>0).sort((a,b)=>accPct(a[1])-accPct(b[1]));
  return '<div class="card"><h3>Падежи и местоимения</h3><p class="muted">Короткие серии по 12 вопросов. После каждого ответа показано правило. Слова с беглыми гласными, чередованиями k → c и клитики встречаются часто.</p>'+
  '<button class="btn primary" data-a="tstart" data-k="cases">Падежи: существительные</button>'+
  '<button class="btn primary" data-a="tstart" data-k="pron">Местоимения по падежам</button>'+
  '<button class="btn" data-a="tstart" data-k="mix">Всё вперемешку</button></div>'+
  (cs.length?'<div class="card"><span class="label">Точность по падежам</span>'+cs.map(([t,s])=>barRow(t,s)).join('')+'</div>':'');
}
function vTrRun(){
  const r=S.tr;
  if(r.pos>=r.keys.length){
    const tot=r.r+r.w;
    return '<div class="card"><span class="label">Серия завершена</span><h2>'+r.r+' из '+tot+' верно</h2><div class="bar"><i style="width:'+accPct({r:r.r,w:r.w})+'%"></i></div>'+
    (r.miss.length?'<button class="btn primary" data-a="tretry">Повторить ошибки ('+r.miss.length+')</button>':'<p class="muted">Ошибок нет.</p>')+
    '<button class="btn" data-a="tstart" data-k="'+r.kind+'">Новая серия</button><button class="btn ghost" data-a="tend">Закрыть</button></div>';
  }
  const key=r.keys[r.pos],q=qGet(key);
  if(!q){r.pos++;save();return vTrRun()}
  const done=cur.pick!==undefined,right=cur.pick===q.ans;
  const opts=q.opts.map((x,k)=>{let c='btn';if(done)c+=k===q.ans?' ok':(k===cur.pick?' bad':'');return '<button class="'+c+'" '+(done?'disabled':'')+' data-a="tpick" data-k="'+k+'">'+esc(disp(x))+'</button>'}).join('');
  return '<div class="card"><div class="row spread"><span class="label">Вопрос '+(r.pos+1)+' / '+r.keys.length+'</span><button class="btn ghost" style="width:auto;padding:6px 12px;min-height:36px" data-a="tend">Закрыть</button></div>'+
  '<div class="bar"><i style="width:'+Math.round(100*r.pos/r.keys.length)+'%"></i></div>'+
  (done?'<span class="pill r" style="align-self:flex-start">'+esc(q.tag)+'</span>':'')+
  sentenceHtml(q.text,done?q.opts[q.ans]:'')+'<div class="opts">'+opts+'</div>'+
  (done?'<div class="expl '+(right?'ok':'bad')+'"><b>'+(right?'Верно. ':'Не совсем. ')+'</b>'+esc(q.expl)+'</div><button class="btn primary" data-a="tnext">Дальше</button>':'')+'</div>';
}

/* ---------- dialogs ---------- */
function vDialogs(){
  if(!DIALOGS.length)return '<div class="card"><p class="muted">Диалоги загружаются. Если они не появились, обновите страницу.</p></div>';
  if(S.dopen&&dialog(S.dopen))return vDialog(dialog(S.dopen));
  const order=['A1','A2','B1','B2','C1'];
  const sorted=DIALOGS.slice().sort((a,b)=>order.indexOf(a.lvl)-order.indexOf(b.lvl));
  return '<p class="muted small">Живые диалоги по ситуациям: слушайте, читайте, отвечайте на вопросы. Те же диалоги есть в режиме «В машине».</p>'+
  sorted.map(d=>{const p=S.dlg[d.id];
    return '<button class="card lesson btn" data-a="dopen" data-id="'+d.id+'"><span class="num">'+(p&&p.best===d.q.length?'✓':d.lvl)+'</span><span class="tt"><b>'+esc(d.title)+'</b><br><span class="small muted">'+d.lvl+' · '+(p?'вопросы: '+p.best+' из '+d.q.length:'не пройден')+'</span></span></button>'}).join('');
}
function vDialog(D){
  const hide=cur.dhide,qi=cur.dq;
  const lines=D.lines.map((l,i)=>'<div class="dline'+(l[0]==='B'?' b':'')+'"><button class="play" aria-label="Слушать" data-a="clip" data-t="'+esc(l[1])+'">▶</button><div class="wt"><span class="who">'+(l[0]==='A'?'Собеседник 1':'Собеседник 2')+'</span><br><span class="sent" style="font-size:19px">'+(hide==='sr'?'· · ·':esc(disp(l[1])))+'</span><br><span class="muted small">'+(hide==='ru'?'':esc(l[2]))+'</span></div></div>').join('');
  let q='';
  if(qi===undefined)q='<button class="btn primary" data-a="dstartq">Проверить понимание</button>';
  else if(qi>=D.q.length){
    const p=S.dlg[D.id]||{best:0};
    q='<div class="card"><span class="label">Итог</span><h2>'+cur.dr+' из '+D.q.length+' верно</h2><button class="btn primary" data-a="dstartq">Ещё раз</button><button class="btn" data-a="dclose">К списку диалогов</button></div>';
  }else{
    const it=D.q[qi],idx=shuffle(it[1].map((_,k)=>k),hash(D.id+qi));
    const opts=idx.map((k,pos)=>{let c='btn';if(cur.dp!==undefined)c+=k===it[2]?' ok':(k===cur.dp?' bad':'');return '<button class="'+c+'" '+(cur.dp!==undefined?'disabled':'')+' data-a="dpick" data-k="'+k+'">'+esc(it[1][k])+'</button>'}).join('');
    q='<div class="card"><span class="label">Вопрос '+(qi+1)+' / '+D.q.length+'</span><p class="sent" style="font-size:19px">'+esc(it[0])+'</p><div class="opts">'+opts+'</div>'+(cur.dp!==undefined?'<div class="expl '+(cur.dp===it[2]?'ok':'bad')+'"><b>'+(cur.dp===it[2]?'Верно. ':'Не совсем. ')+'</b>'+esc(it[3]||'')+'</div><button class="btn primary" data-a="dnext">Дальше</button>':'')+'</div>';
  }
  return '<div class="row spread"><button class="btn ghost" style="width:auto" data-a="dclose">← Диалоги</button><span class="label">'+D.lvl+'</span></div><h2>'+esc(D.title)+'</h2><p class="muted small">'+esc(D.scene||'')+'</p>'+
  '<div class="card"><div class="row"><button class="btn primary" style="flex:1 1 140px;text-align:center" data-a="dseq">▶ Слушать диалог</button><button class="btn" style="flex:1 1 140px;text-align:center" data-a="dcar">В машине</button></div>'+
  '<div class="row"><button class="btn'+(hide==='sr'?' primary':'')+'" style="flex:1 1 120px;text-align:center" data-a="dhide" data-v="sr">Скрыть сербский</button><button class="btn'+(hide==='ru'?' primary':'')+'" style="flex:1 1 120px;text-align:center" data-a="dhide" data-v="ru">Скрыть перевод</button></div>'+lines+'</div>'+q;
}

/* ---------- events for the trainer ---------- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]');if(!el)return;
  const a=el.dataset.a,d=el.dataset;
  switch(a){
  case'tsub':S.tsub=d.s;S.tab='train';cur={};save();render();up();return;
  case'tstart':{const s=buildSession(d.k);if(!s){toast('Пока нет подходящих вопросов');return}S.tr=s;S.tab='train';cur={};save();render();up();return}
  case'tpick':{
    if(cur.pick!==undefined)return;const r=S.tr,key=r.keys[r.pos],q=qGet(key);
    cur.pick=+d.k;const right=cur.pick===q.ans;
    if(right)r.r++;else{r.w++;if(!r.miss.includes(key))r.miss.push(key)}
    if(q.lid)stat(q.lid,right);if(q.cs)cstat(q.cs,right);
    bump(right);save();render();return;
  }
  case'tnext':S.tr.pos++;cur={};save();render();up();return;
  case'tretry':{const r=S.tr;S.tr={kind:r.kind,keys:shuffle(r.miss),pos:0,r:0,w:0,miss:[]};cur={};save();render();up();return}
  case'tend':S.tr=null;cur={};save();render();up();return;
  case'dopen':S.dopen=d.id;S.tab='train';S.tsub='dlg';cur={};save();render();up();return;
  case'dclose':S.dopen=null;cur={};save();render();up();return;
  case'dhide':cur.dhide=cur.dhide===d.v?undefined:d.v;render();return;
  case'dseq':{const D=dialog(S.dopen);if(D)playSeq(D.lines.map(l=>l[1]));return}
  case'dcar':{const D=dialog(S.dopen);if(D&&AUDIO.car&&AUDIO.car[D.id]){S.tab='car';S.car={id:D.id,t:0};save();render();carLoad(D.id,0,false);up()}else toast('Аудио появится после сборки сайта');return}
  case'dstartq':cur.dq=0;cur.dr=0;cur.dp=undefined;render();return;
  case'dpick':{if(cur.dp!==undefined)return;const D=dialog(S.dopen),it=D.q[cur.dq];cur.dp=+d.k;const right=cur.dp===it[2];if(right)cur.dr++;bump(right);save();render();return}
  case'dnext':{const D=dialog(S.dopen);cur.dq++;cur.dp=undefined;if(cur.dq>=D.q.length){const p=S.dlg[D.id]||(S.dlg[D.id]={best:0});if(cur.dr>p.best)p.best=cur.dr;save()}render();up();return}
  }
});
