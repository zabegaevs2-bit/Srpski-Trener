/* ---------- reference, navigation, events ---------- */
const TABS=[['course','К','Курс'],['review','П','Повтор'],['car','М','В машине'],['ref','С','Справка']];
function tbl(head,rows){
  return '<div class="tbl"><table><thead><tr>'+head.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+
  rows.map(r=>'<tr>'+r.map((c,i)=>i===0?'<td><b>'+esc(c)+'</b></td>':'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
function vRef(){
  const subs=[['tables','Таблицы'],['traps','Ловушки'],['me','Прогресс']];
  const nav='<div class="row">'+subs.map(s=>'<button class="btn'+(S.sub===s[0]?' primary':'')+'" style="flex:1 1 90px;padding:10px 6px;text-align:center" data-a="sub" data-s="'+s[0]+'">'+s[1]+'</button>').join('')+'</div>';
  let b='';
  if(S.sub==='tables'){
    b='<div class="card"><h3>Семь падежей</h3>'+tbl(['Падеж','Вопрос','Когда'],CASE_INFO.map(c=>[c[0],c[1],c[3]]))+'</div>'+
    '<div class="card"><h3>Окончания, единственное число</h3>'+tbl(['','м.р. (grad)','ж.р. (žena)','ср.р. (selo)'],ENDINGS_SG)+'</div>'+
    '<div class="card"><h3>Окончания, множественное число</h3>'+tbl(['','м.р.','ж.р.','ср.р.'],ENDINGS_PL)+'</div>'+
    '<div class="card"><h3>Личные местоимения</h3>'+tbl(['','Nom','Gen','Dat','Akk','Ins','Lok'],PRON)+'<p class="small muted">Слева полная форма, справа клитик. Клитик стоит на втором месте во фразе.</p></div>';
  }else if(S.sub==='traps'){
    b='<div class="card"><h3>Ловушки русского</h3>'+TRAPS.map(t=>'<div class="expl"><b>'+esc(t[0])+'</b><br>'+esc(t[1])+'</div>').join('')+'</div>'+
    '<div class="card"><h3>Звуки и произношение</h3>'+SOUNDS.map(t=>'<div class="expl"><b>'+esc(t[0])+'</b><br>'+esc(t[1])+'</div>').join('')+'</div>';
  }else{
    const acc=S.tot.r+S.tot.w?Math.round(100*S.tot.r/(S.tot.r+S.tot.w))+'%':'—';
    b='<div class="row"><div class="card stat"><span class="label">Серия</span><b>'+streak()+'</b></div><div class="card stat"><span class="label">Уроков</span><b>'+Object.keys(S.done).length+'</b></div><div class="card stat"><span class="label">Точность</span><b>'+acc+'</b></div></div>'+
    '<div class="card"><span class="label">Письмо</span><div class="row"><button class="btn'+(S.script==='lat'?' primary':'')+'" style="flex:1" data-a="script" data-v="lat">Latinica</button><button class="btn'+(S.script==='cyr'?' primary':'')+'" style="flex:1" data-a="script" data-v="cyr">Ћирилица</button></div></div>'+
    '<div class="card"><span class="label">Копия прогресса</span><p class="small muted">Прогресс хранится в браузере этого устройства. Чтобы перенести его на другое устройство или не потерять при очистке данных Safari, сохраните код и вставьте его там.</p><textarea id="bk" placeholder="Код прогресса" spellcheck="false">'+esc(cur.bk||'')+'</textarea><div class="row"><button class="btn" style="flex:1;text-align:center" data-a="export">Показать код</button><button class="btn" style="flex:1;text-align:center" data-a="import">Восстановить</button></div></div>'+
    '<div class="card"><span class="label">Сброс</span>'+(cur.rs?'<p>Весь прогресс будет удалён.</p><div class="row"><button class="btn bad" style="flex:1;text-align:center" data-a="reset">Удалить</button><button class="btn" style="flex:1;text-align:center" data-a="noreset">Отмена</button></div>':'<button class="btn" data-a="askreset">Сбросить прогресс</button>')+'</div>';
  }
  return '<h2>Справка</h2>'+nav+b;
}

function renderTabs(){
  const due=dueKeys().length;
  $('#tabs').innerHTML=TABS.map(t=>'<button class="tab" data-a="tab" data-t="'+t[0]+'" aria-current="'+(S.tab===t[0])+'"><b>'+t[1]+'</b>'+t[2]+(t[0]==='review'&&due?' <span class="dot"></span>':'')+'</button>').join('');
}
function render(){
  renderTabs();
  let h;
  if(S.tab==='course')h=S.open&&lesson(S.open)?vLesson():vCourse();
  else if(S.tab==='review')h=vReview();
  else if(S.tab==='car')h=vCar();
  else h=vRef();
  $('#app').innerHTML=h;
  if(S.tab==='car'){carTick();carPlayState()}
}
function up(){window.scrollTo(0,0)}
function record(L,p,t,i,right){
  if(right)p.r++;else{p.w++;srsAdd(qKey(L,t,i))}
  bump(right);save();render();
}
function playSeq(texts){
  let i=0;
  const step=()=>{
    if(i>=texts.length)return;
    const f=AUDIO.clips&&AUDIO.clips[texts[i++]];
    if(!f){step();return}
    stopClip();clipEl=new Audio('audio/'+f);clipEl.onended=()=>setTimeout(step,450);clipEl.play().catch(()=>{});
  };
  step();
}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]');if(!el)return;
  const a=el.dataset.a,d=el.dataset;
  const L=S.open?lesson(S.open):null,p=L?progOf(L.id):null;
  switch(a){
  case'tab':S.tab=d.t;cur={};save();render();up();return;
  case'open':S.open=d.id;S.tab='course';S.last={type:'lesson',id:d.id};progOf(d.id);cur={};save();render();up();return;
  case'home':S.open=null;cur={};save();render();up();return;
  case'step':p.step=+d.n;cur={};save();render();up();return;
  case'startq':p.q=buildQ(L);p.idx=0;p.r=0;p.w=0;p.step=3;cur={};save();render();up();return;
  case'hide':cur.hide=!cur.hide;render();return;
  case'open-w':cur.open=cur.open||{};cur.open[d.i]=true;render();return;
  case'clip':playClip(d.t);return;
  case'seq':playSeq(L.d.map(x=>x[0]));return;
  case'pick':{
    if(cur.pick!==undefined)return;
    const [t,i]=p.q[p.idx];const ans=t==='x'?L.x[i][2]:wordOpts(L,i).ans;
    cur.pick=+d.k;record(L,p,t,i,cur.pick===ans);return;
  }
  case'tok':cur.built.push(+d.k);render();return;
  case'untok':cur.built=cur.built.filter(k=>k!==+d.k);render();return;
  case'bcheck':{
    const [t,i]=p.q[p.idx];const toks=L.d[i][0].split(' ');
    const ok=norm(cur.built.map(k=>toks[k]).join(' '))===norm(L.d[i][0]);
    cur.res=ok?'ok':'bad';record(L,p,t,i,ok);return;
  }
  case'dcheck':{
    const inp=$('#wi');if(!inp||cur.res)return;const v=inp.value.trim();if(!v)return;
    const [t,i]=p.q[p.idx];const tgt=L.d[i][0];
    const ok=norm(v)===norm(tgt),near=!ok&&flat(v)===flat(tgt);
    cur.val=v;cur.res=ok?'ok':near?'near':'bad';record(L,p,t,i,ok||near);return;
  }
  case'ins':{const i=$('#wi');if(!i)return;const s=i.selectionStart||i.value.length,en=i.selectionEnd||s;i.value=i.value.slice(0,s)+d.c+i.value.slice(en);cur.val=i.value;i.focus();try{i.setSelectionRange(s+1,s+1)}catch(x){}return}
  case'next':p.idx++;cur={};if(p.idx>=p.q.length)p.step=4;save();render();up();if(p.step===3){const i=$('#wi');if(i&&false)i.focus()}return;
  case'finish':S.done[L.id]=true;addLessonToSrs(L);S.open=null;cur={};save();render();up();return;
  case'cartab':S.tab='car';S.open=null;if(AUDIO.car&&AUDIO.car[d.id]){S.car={id:d.id,t:0}}cur={};save();render();if(AUDIO.car&&AUDIO.car[d.id])carLoad(d.id,0,false);up();return;
  case'rstart':S.rev={keys:dueKeys().slice(0,15),pos:0,ok:0,no:0,re:[]};cur={};save();render();up();return;
  case'flip':cur.flip=true;render();{const it=item(S.rev.keys[S.rev.pos]);if(it&&it.sr)playClip(it.sr)}return;
  case'rate':{const r=S.rev,k=r.keys[r.pos],right=d.k==='1';rateKey(k,right);if(right)r.ok++;else{r.no++;if(!r.re.includes(k)){r.re.push(k);r.keys.push(k)}}r.pos++;cur={};bump(right);save();render();up();return}
  case'rpick':{
    if(cur.pick!==undefined)return;const r=S.rev,k=r.keys[r.pos],it=item(k);
    cur.pick=+d.k;const right=cur.pick===it.x[2];rateKey(k,right);
    if(right)r.ok++;else{r.no++;if(!r.re.includes(k)){r.re.push(k);r.keys.push(k)}}
    bump(right);save();render();return;
  }
  case'rnext':S.rev.pos++;cur={};save();render();up();return;
  case'cload':carLoad(d.id,0,true);return;
  case'ctoggle':carToggle();return;
  case'cseek':{const au=carAudio();if(au&&au.src)au.currentTime=Math.max(0,Math.min(au.duration||1e9,au.currentTime+(+d.d)));return}
  case'cstep':carStep(+d.d);return;
  case'sub':S.sub=d.s;cur={};save();render();return;
  case'script':S.script=d.v;save();render();return;
  case'export':cur.bk=JSON.stringify(S);render();{const t=$('#bk');if(t){t.focus();t.select()}}return;
  case'import':{try{const v=JSON.parse(($('#bk')||{}).value||'');if(!v||typeof v!=='object'||!v.srs)throw 0;S=fresh(v);save();cur={};render();toast('Прогресс восстановлен')}catch(x){toast('Код не распознан')}return}
  case'askreset':cur.rs=true;render();return;
  case'noreset':cur.rs=false;render();return;
  case'reset':S=fresh();save();cur={};render();toast('Прогресс удалён');return;
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='wi'){e.preventDefault();const b=document.querySelector('[data-a=dcheck]');if(b)b.click()}});
document.addEventListener('input',e=>{if(e.target&&e.target.id==='wi')cur.val=e.target.value;if(e.target&&e.target.id==='bk')cur.bk=e.target.value});
document.addEventListener('visibilitychange',()=>{if(document.hidden){const a=carAudio();if(a&&a.src&&S.car.id){S.car.t=a.currentTime;save()}}});

(async function(){
  await loadData();
  carInit();
  if(S.car&&S.car.id&&AUDIO.car&&AUDIO.car[S.car.id]){const a=carAudio();a.src='audio/'+AUDIO.car[S.car.id].file;a.addEventListener('loadedmetadata',()=>{try{a.currentTime=S.car.t||0}catch(e){}},{once:true});setMedia(S.car.id)}
  render();
})();
