/* ---------- spaced repetition (words, phrases, past mistakes) ---------- */
const INT=[0,1,3,7,14,30];
function item(key){
  const [t,id,i]=key.split(':');const L=lesson(id);if(!L)return null;
  if(t==='w'&&L.w[i])return {t,L,i:+i,sr:L.w[i][0],ru:L.w[i][1]};
  if(t==='l'&&L.d[i])return {t,L,i:+i,sr:L.d[i][0],ru:L.d[i][1]};
  if(t==='x'&&L.x&&L.x[i])return {t,L,i:+i,x:xShuf(L,+i)};
  return null;
}
function dueKeys(){const d=today();return Object.keys(S.srs).filter(k=>S.srs[k].due<=d&&item(k)).sort((a,b)=>S.srs[a].due<S.srs[b].due?-1:1)}
function addLessonToSrs(L){
  const t=today();
  L.w.forEach((_,i)=>{const k='w:'+L.id+':'+i;if(!S.srs[k])S.srs[k]={box:1,due:addDays(t,1)}});
  L.d.forEach((_,i)=>{const k='l:'+L.id+':'+i;if(!S.srs[k])S.srs[k]={box:1,due:addDays(t,1)}});
}
function vReview(){
  const r=S.rev;
  if(r&&r.pos<r.keys.length){
    const key=r.keys[r.pos],it=item(key);
    if(!it){r.pos++;save();return vReview()}
    const head='<div class="row spread"><span class="label">Повторение · '+(r.pos+1)+' / '+r.keys.length+'</span><span class="pill">уровень '+S.srs[key].box+'</span></div><div class="bar"><i style="width:'+Math.round(100*r.pos/r.keys.length)+'%"></i></div>';
    if(it.t==='x'){
      const o=it.x[1].map((x,k)=>{let c='btn';if(cur.pick!==undefined)c+=k===it.x[2]?' ok':(k===cur.pick?' bad':'');return '<button class="'+c+'" '+(cur.pick!==undefined?'disabled':'')+' data-a="rpick" data-k="'+k+'">'+esc(disp(x))+'</button>'}).join('');
      const right=cur.pick===it.x[2];
      return '<h2>Повторение</h2><div class="card">'+head+sentenceHtml(it.x[0],cur.pick!==undefined?it.x[1][it.x[2]]:'')+'<div class="opts">'+o+'</div>'+(cur.pick!==undefined?'<div class="expl '+(right?'ok':'bad')+'"><b>'+(right?'Верно. ':'Не совсем. ')+'</b>'+esc(it.x[3]||'')+'</div><button class="btn primary" data-a="rnext" data-k="'+(right?1:0)+'">Дальше</button>':'')+'</div>';
    }
    return '<h2>Повторение</h2><div class="card">'+head+'<p class="label">'+(it.t==='w'?'Как по-сербски?':'Скажите по-сербски')+'</p><p class="'+(it.t==='w'?'sr':'sent')+'" style="font-weight:500">'+esc(it.ru)+'</p>'+
    (cur.flip?'<hr style="border:0;border-top:1px solid var(--line);width:100%"><p class="'+(it.t==='w'?'sr':'sent')+'">'+esc(disp(it.sr))+'</p><button class="btn ghost" data-a="clip" data-t="'+esc(it.sr)+'">▶ Послушать</button><div class="row" style="flex-wrap:nowrap"><button class="btn" style="text-align:center" data-a="rate" data-k="0">Не знал</button><button class="btn primary" data-a="rate" data-k="1">Знал</button></div>':'<button class="btn primary" data-a="flip">Показать ответ</button>')+'</div>';
  }
  const n=dueKeys().length,total=Object.keys(S.srs).length;
  const box=r?'<div class="card"><span class="label">Сессия завершена</span><h2>'+r.ok+' знал, '+r.no+' не знал</h2><div class="bar"><i style="width:'+Math.round(100*r.ok/Math.max(1,r.ok+r.no))+'%"></i></div></div>':'';
  return '<h2>Повторение</h2>'+box+'<div class="card"><span class="label">Интервальное повторение</span><h2>К повтору: '+n+'</h2><p class="muted">Сюда попадают слова и фразы из пройденных уроков и всё, в чём вы ошиблись. Верные ответы возвращаются через 1, 3, 7, 14 и 30 дней. Всего карточек: '+total+'.</p>'+
  (n?'<button class="btn primary" data-a="rstart">Начать ('+Math.min(n,15)+')</button>':'<p>На сегодня всё повторено.</p>')+'</div>';
}
function rateKey(key,right){
  const st=S.srs[key],t=today();
  if(right){st.box=Math.min(st.box+1,5);st.due=addDays(t,INT[st.box])}else{st.box=0;st.due=t}
}
