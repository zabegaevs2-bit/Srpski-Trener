/* ---------- course roadmap + lesson player ---------- */
const LEVELS=[
 ['A1','Начальный',['Алфавит и приветствия','Кто ты? Местоимения и глагол «быть»','Род существительных','Иметь и не иметь, числа','Настоящее время','Винительный падеж','Предложный падеж (где?)','Прилагательные и «мой/твой»','Родительный падеж','Дательный падеж','Творительный падеж','Звательный падеж и местоимения по падежам']],
 ['A2','Элементарный',['Прошедшее время','Будущее время','Вопросы и отрицание','Множественное число','Числа, цены, покупки','Время, дни, даты','Сравнение','Возвратные глаголы','Порядок слов и клитики','Движение и транспорт']],
 ['B1','Средний',['Повелительное наклонение','Условное наклонение','Придаточные предложения','Падежи во множественном числе','Вид глагола','Приставочные глаголы','Числительные и существительные','Безличные конструкции']],
 ['B2','Выше среднего',['Причастия и деепричастия','Страдательный залог','Сложные времена','Устойчивые выражения','Деловая и официальная речь','Новости и публицистика']],
 ['C1','Продвинутый',['Стилистика и регистры','Идиомы и пословицы','Диалекты и разговорная речь','Письменная речь и эссе']],
];
const STEPS=['Грамматика','Слова','Диалог','Практика','Итог'];
const slot=(lvl,n)=>COURSE.lessons.find(l=>l.lvl===lvl&&l.n===n);
function nextLesson(){return COURSE.lessons.find(l=>!S.done[l.id])}
function progOf(id){return S.prog[id]||(S.prog[id]={step:0,q:null,idx:0,r:0,w:0})}
let cur={};

function vCourse(){
  const nl=nextLesson(),lastL=S.last&&S.last.type==='lesson'?lesson(S.last.id):null;
  let cont='';
  const target=lastL&&!S.done[lastL.id]?lastL:nl;
  if(target){const p=S.prog[target.id];
    const where=p?STEPS[p.step]+(p.step===3&&p.q?' · '+Math.min(p.idx+1,p.q.length)+' из '+p.q.length:''):'начало урока';
    cont='<div class="card"><span class="label">'+(p?'Продолжить с того же места':'Следующий урок')+'</span><h2>'+target.lvl+' · '+target.n+'. '+esc(target.title)+'</h2><p class="muted">'+esc(where)+'</p><button class="btn primary" data-a="open" data-id="'+target.id+'">'+(p?'Продолжить':'Начать')+'</button></div>';
  }else cont='<div class="card"><h2>Все доступные уроки пройдены</h2><p class="muted">Новые блоки добавляются по мере готовности. Пока повторяйте слова и фразы.</p><button class="btn primary" data-a="tab" data-t="review">К повторению</button></div>';
  const due=dueKeys().length,learned=Object.keys(S.done).length;
  const stats='<div class="row"><div class="card stat"><span class="label">Серия</span><b>'+streak()+'</b><span class="small muted">дн. подряд</span></div><div class="card stat"><span class="label">Уроков</span><b>'+learned+'</b><span class="small muted">из '+COURSE.lessons.length+'</span></div><div class="card stat"><span class="label">К повтору</span><b>'+due+'</b><span class="small muted">карточек</span></div></div>';
  let lv='';
  for(const [code,name,titles] of LEVELS){
    const have=COURSE.lessons.filter(l=>l.lvl===code),dn=have.filter(l=>S.done[l.id]).length;
    lv+='<div class="lvl"><h2>'+code+'</h2><span class="muted">'+name+'</span><span class="mono small muted" style="margin-left:auto">'+dn+' / '+titles.length+'</span></div>';
    titles.forEach((t,i)=>{
      const L=slot(code,i+1);
      if(L){const done=S.done[L.id],isNext=nl&&nl.id===L.id,p=S.prog[L.id];
        lv+='<button class="card lesson btn'+(done?' done':isNext?' next':'')+'" data-a="open" data-id="'+L.id+'"><span class="num">'+(done?'✓':L.n)+'</span><span class="tt"><b>'+esc(L.title)+'</b><br><span class="small muted">'+(done?'пройден':p?'начат · '+STEPS[p.step]:'12 слов · диалог · практика')+'</span></span></button>';
      }else lv+='<div class="card lesson soon"><span class="num">'+(i+1)+'</span><span class="tt"><b>'+esc(t)+'</b><br><span class="small muted">скоро</span></span></div>';
    });
  }
  return '<h1>'+disp('Srpski trener')+'</h1><p class="muted small">Курс сербского от нуля до C1</p>'+cont+stats+lv;
}

/* ---- queue ---- */
function buildQ(L){
  const q=[];
  (L.x||[]).forEach((_,i)=>q.push(['x',i]));
  L.w.slice(0,8).forEach((_,i)=>q.push(['w',i]));
  const lines=L.d.map((_,i)=>i);
  lines.filter(i=>L.d[i][0].split(' ').length>=3).slice(0,4).forEach(i=>q.push(['b',i]));
  lines.slice(-3).forEach(i=>q.push(['d',i]));
  return shuffle(q);
}
function wordOpts(L,i){
  let pool=L.w.map((w,j)=>j).filter(j=>j!==i).map(j=>L.w[j][0]);
  if(pool.length<3)COURSE.lessons.forEach(o=>{if(o.id!==L.id)o.w.forEach(w=>pool.push(w[0]))});
  pool=[...new Set(pool)].filter(x=>x!==L.w[i][0]);
  const opts=shuffle([L.w[i][0],...shuffle(pool,hash(L.id+i)).slice(0,3)],hash(L.id+'o'+i));
  return {opts,ans:opts.indexOf(L.w[i][0])};
}
function srsAdd(key){S.srs[key]={box:0,due:today()}}
function qKey(L,t,i){return (t==='w'?'w':t==='x'?'x':'l')+':'+L.id+':'+i}

/* ---- views ---- */
function stepsBar(p){return '<div class="steps">'+STEPS.map((s,i)=>'<i class="'+(i<=p.step?'on':'')+'"></i>').join('')+'</div>'}
function vLesson(){
  const L=lesson(S.open);if(!L)return vCourse();
  const p=progOf(L.id);
  const head='<div class="row spread"><button class="btn ghost" style="width:auto" data-a="home">← Курс</button><span class="label">'+L.lvl+' · урок '+L.n+'</span></div><h2>'+esc(L.title)+'</h2>'+stepsBar(p)+'<p class="small muted">Шаг '+(p.step+1)+' из 5: '+STEPS[p.step]+'. Можно закрыть в любой момент, приложение вернёт вас сюда.</p>';
  let body='';
  if(p.step===0){
    body=L.g.map(b=>'<div class="card"><h3>'+esc(b.h)+'</h3><p>'+b.t+'</p></div>').join('')+(L.pr?'<div class="card"><h3>Произношение</h3><p>'+L.pr+'</p></div>':'')+'<button class="btn primary" data-a="step" data-n="1">К словам</button>';
  }else if(p.step===1){
    body='<div class="card"><div class="row spread"><span class="label">Слова урока</span><button class="btn ghost" style="width:auto;padding:8px 12px;min-height:40px" data-a="hide">'+(cur.hide?'Показать перевод':'Скрыть перевод')+'</button></div>'+
    L.w.map((w,i)=>'<div class="wrow"><button class="play" aria-label="Слушать" data-a="clip" data-t="'+esc(w[0])+'">▶</button><div class="wt"><span class="sr" style="font-size:20px">'+esc(disp(w[0]))+'</span><br><span class="muted" '+(cur.hide&&!(cur.open||{})[i]?'data-a="open-w" data-i="'+i+'" style="cursor:pointer"':'')+'>'+(cur.hide&&!(cur.open||{})[i]?'· · · нажмите, чтобы показать':esc(w[1]))+'</span></div></div>').join('')+'</div>'+
    '<button class="btn primary" data-a="step" data-n="2">К диалогу</button>';
  }else if(p.step===2){
    body='<div class="card"><div class="row spread"><span class="label">Диалог</span><button class="btn ghost" style="width:auto;padding:8px 12px;min-height:40px" data-a="hide">'+(cur.hide?'Показать перевод':'Скрыть перевод')+'</button></div>'+
    L.d.map((d,i)=>'<div class="wrow"><button class="play" aria-label="Слушать" data-a="clip" data-t="'+esc(d[0])+'">▶</button><div class="wt"><span class="sent" style="font-size:19px">'+esc(disp(d[0]))+'</span><br><span class="muted small">'+(cur.hide?'':esc(d[1]))+'</span></div></div>').join('')+
    '<button class="btn" data-a="seq">Прослушать весь диалог</button></div><button class="btn primary" data-a="startq">К практике</button>';
  }else if(p.step===3){
    body=practiceView(L,p);
  }else{
    const tot=p.r+p.w,pc=tot?Math.round(100*p.r/tot):0,ok=pc>=70;
    body='<div class="card"><span class="label">Итог урока</span><h2>'+p.r+' из '+tot+' верно · '+pc+'%</h2><div class="bar"><i style="width:'+pc+'%"></i></div>'+
    (ok?'<p>Урок засчитан. Слова и фразы добавлены в повторение, ошибки вернутся раньше остальных.</p>':'<p class="muted">Для зачёта нужно 70%. Повторите практику: вопросы перемешаются заново.</p>')+
    (ok?'':'<button class="btn primary" data-a="startq">Повторить практику</button><button class="btn" data-a="finish">Всё равно завершить</button>')+
    (ok?'<button class="btn primary" data-a="finish">Завершить и перейти дальше</button>':'')+
    '<button class="btn" data-a="cartab" data-id="'+L.id+'">Слушать этот урок в машине</button></div>';
  }
  return head+body;
}
function sentenceHtml(s,fill){
  if(!s.includes('___'))return '<p class="sent">'+esc(disp(s))+'</p>';
  const parts=s.split('___');
  const mid=fill?'<span class="blank" style="border-color:var(--ok);color:var(--ok)">'+esc(disp(fill))+'</span>':'<span class="blank">&nbsp;</span>';
  return '<p class="sent">'+esc(disp(parts[0]))+mid+esc(disp(parts[1]||''))+'</p>';
}
function practiceView(L,p){
  if(!p.q||p.idx>=p.q.length){return '<div class="card"><p>Практика завершена.</p><button class="btn primary" data-a="step" data-n="4">К итогу</button></div>'}
  const [t,i]=p.q[p.idx];const done=cur.res!==undefined||cur.pick!==undefined;
  const label='<div class="row spread"><span class="label">Практика · '+(p.idx+1)+' / '+p.q.length+'</span></div><div class="bar"><i style="width:'+Math.round(100*p.idx/p.q.length)+'%"></i></div>';
  const next='<button class="btn primary" data-a="next">Дальше</button>';
  const mcq=(text,opts,ans,expl,fill)=>{
    const o=opts.map((x,k)=>{let c='btn';if(cur.pick!==undefined)c+=k===ans?' ok':(k===cur.pick?' bad':'');return '<button class="'+c+'" '+(cur.pick!==undefined?'disabled':'')+' data-a="pick" data-k="'+k+'">'+esc(disp(x))+'</button>'}).join('');
    const right=cur.pick===ans;
    return '<div class="card">'+label+text+'<div class="opts">'+o+'</div>'+(cur.pick!==undefined?'<div class="expl '+(right?'ok':'bad')+'"><b>'+(right?'Верно. ':'Не совсем. ')+'</b>'+esc(expl||'')+'</div>'+next:'')+'</div>';
  };
  if(t==='x'){const it=L.x[i];return mcq(sentenceHtml(it[0],cur.pick!==undefined?it[1][it[2]]:''),it[1],it[2],it[3])}
  if(t==='w'){const {opts,ans}=wordOpts(L,i);return mcq('<p class="label">Как по-сербски?</p><p class="sr" style="font-weight:500">'+esc(L.w[i][1])+'</p>',opts,ans,L.w[i][0]+' — '+L.w[i][1])}
  if(t==='b'){
    const toks=L.d[i][0].split(' ');
    if(!cur.order){let o=shuffle(toks.map((_,k)=>k),hash(L.id+'b'+i));if(toks.length>1&&o.every((v,k)=>v===k))o.reverse();cur.order=o;cur.built=[]}
    const rest=cur.order.filter(k=>!cur.built.includes(k));
    const builtH=cur.built.map(k=>'<button class="tok" '+(cur.res?'disabled':'')+' data-a="untok" data-k="'+k+'">'+esc(disp(toks[k]))+'</button>').join('');
    const restH=rest.map(k=>'<button class="tok" data-a="tok" data-k="'+k+'">'+esc(disp(toks[k]))+'</button>').join('');
    return '<div class="card">'+label+'<p class="label">Соберите фразу</p><p class="sent">'+esc(L.d[i][1])+'</p><div class="built">'+builtH+'</div>'+(cur.res?'':'<div class="toks">'+restH+'</div><button class="btn primary" data-a="bcheck" '+(rest.length?'disabled':'')+'>Проверить</button>')+
    (cur.res?'<div class="expl '+(cur.res==='ok'?'ok':'bad')+'"><b>'+(cur.res==='ok'?'Верно.':'Не совсем.')+'</b><br><span class="sent" style="font-size:18px">'+esc(disp(L.d[i][0]))+'</span></div>'+next:'')+'</div>';
  }
  const chars=['č','ć','š','ž','đ'].map(c=>'<button class="btn ghost" style="flex:1;padding:8px 0;min-height:44px;text-align:center" data-a="ins" data-c="'+c+'">'+(S.script==='cyr'?latToCyr(c):c)+'</button>').join('');
  const head=cur.res==='ok'?'Верно.':cur.res==='near'?'Почти: проверьте č / ć / š / ž / đ.':'Не совсем.';
  return '<div class="card">'+label+'<p class="label">Диктант: послушайте и запишите</p><div class="row"><button class="btn primary" style="flex:1" data-a="clip" data-t="'+esc(L.d[i][0])+'">▶ Слушать</button></div>'+
  '<input type="text" id="wi" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Напишите услышанное" value="'+esc(cur.val||'')+'" '+(cur.res?'readonly':'')+'>'+
  (cur.res?'<div class="expl '+(cur.res==='bad'?'bad':'ok')+'"><b>'+head+'</b><br><span class="sent" style="font-size:18px">'+esc(disp(L.d[i][0]))+'</span><br><span class="small">'+esc(L.d[i][1])+'</span></div>'+next:'<div class="row" style="flex-wrap:nowrap">'+chars+'</div><button class="btn primary" data-a="dcheck">Проверить</button>')+'</div>';
}
