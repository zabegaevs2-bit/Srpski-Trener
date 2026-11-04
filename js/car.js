/* ---------- car mode: long audio lessons with pauses for repeating aloud ---------- */
let carWake=null,carSaveAt=0;
const carIds=()=>COURSE.lessons.filter(l=>AUDIO.car&&AUDIO.car[l.id]).map(l=>l.id);
function carAudio(){return $('#car')}
function carLoad(id,t,play){
  const a=carAudio(),info=AUDIO.car&&AUDIO.car[id];if(!a||!info)return;
  stopClip();
  S.car={id:id,t:t||0};save();
  const src='audio/'+info.file;
  if(!a.src.endsWith(info.file)){a.src=src;a.load()}
  const go=()=>{try{a.currentTime=t||0}catch(e){}if(play)a.play().catch(()=>toast('Нажмите «Играть»: браузер не дал включить звук'))};
  if(a.readyState>0)go();else a.addEventListener('loadedmetadata',go,{once:true});
  setMedia(id);
  if(S.tab==='car')render();
}
function setMedia(id){
  try{
    const L=lesson(id);if(!L||!navigator.mediaSession)return;
    navigator.mediaSession.metadata=new MediaMetadata({title:L.lvl+' · '+L.n+'. '+L.title,artist:'Srpski trener',album:'Курс сербского'});
    const a=carAudio();
    navigator.mediaSession.setActionHandler('play',()=>a.play());
    navigator.mediaSession.setActionHandler('pause',()=>a.pause());
    navigator.mediaSession.setActionHandler('seekbackward',()=>{a.currentTime=Math.max(0,a.currentTime-15)});
    navigator.mediaSession.setActionHandler('seekforward',()=>{a.currentTime=Math.min(a.duration||1e9,a.currentTime+15)});
    navigator.mediaSession.setActionHandler('previoustrack',()=>carStep(-1));
    navigator.mediaSession.setActionHandler('nexttrack',()=>carStep(1));
  }catch(e){}
}
function carStep(d){
  const ids=carIds(),i=ids.indexOf(S.car.id),j=i+d;
  if(ids[j])carLoad(ids[j],0,true);
}
function carToggle(){
  const a=carAudio();if(!S.car.id){const ids=carIds();if(!ids.length)return;carLoad(ids[0],0,true);return}
  if(!a.src){carLoad(S.car.id,S.car.t,true);return}
  if(a.paused)a.play().catch(()=>{});else a.pause();
}
function fmt(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function carCue(a){
  const info=AUDIO.car&&AUDIO.car[S.car.id];if(!info)return null;
  let c=null;for(const x of info.cues){if(x[0]<=a.currentTime)c=x;else break}
  return c;
}
function carTick(){
  const a=carAudio();if(!a||!S.car.id)return;
  const seek=$('#cseek'),tm=$('#ctime'),cue=$('#ccue');
  if(seek&&!seek.dataset.drag){seek.max=Math.floor(a.duration||0);seek.value=Math.floor(a.currentTime)}
  if(tm)tm.textContent=fmt(a.currentTime)+' / '+fmt(a.duration);
  if(cue){const c=carCue(a);
    cue.innerHTML=c?(c[3]==='intro'?'<span class="label">Урок</span><span class="sr">'+esc(c[2])+'</span>':'<span class="label">'+(c[3]==='word'?'Слово':'Фраза')+'</span><span class="muted">'+esc(c[2])+'</span><span class="sr">'+esc(disp(c[1]))+'</span>'):'<span class="muted">Нажмите «Играть»</span>'}
  const now=Date.now();
  if(now-carSaveAt>5000&&!a.paused){carSaveAt=now;S.car.t=a.currentTime;save()}
}
function carPlayState(){
  const b=$('#cplay'),a=carAudio();if(b&&a)b.textContent=a.paused?'▶ Играть':'❚❚ Пауза';
}
function vCar(){
  const ids=carIds();
  if(!AUDIO_OK||!ids.length)return '<h2>В машине</h2><div class="card"><p>Аудиоуроки появятся после сборки сайта на GitHub: озвучка генерируется автоматически при публикации. Откройте вкладку Actions в репозитории и дождитесь зелёной отметки.</p></div>';
  const id=S.car.id&&ids.includes(S.car.id)?S.car.id:ids[0],L=lesson(id),info=AUDIO.car[id];
  const list=ids.map(i=>{const l=lesson(i);return '<button class="btn" data-a="cload" data-id="'+i+'"'+(i===id?' style="border-color:var(--plava)"':'')+'><b>'+l.lvl+' · '+l.n+'. '+esc(l.title)+'</b> <span class="muted small">'+fmt(AUDIO.car[i].dur)+'</span></button>'}).join('');
  return '<h2>В машине</h2><p class="muted small">Режим без экрана: русская фраза, пауза, сербская фраза, пауза, чтобы повторить вслух, и сербская фраза ещё раз. Уроки идут подряд, место запоминается.</p>'+
  '<div class="card"><span class="label">'+L.lvl+' · урок '+L.n+'</span><h3>'+esc(L.title)+'</h3><div class="cue" id="ccue"><span class="muted">Нажмите «Играть»</span></div>'+
  '<input type="range" id="cseek" min="0" max="'+Math.floor(info.dur)+'" value="0" aria-label="Положение">'+
  '<div class="row spread"><span class="mono small muted" id="ctime">0:00 / '+fmt(info.dur)+'</span></div>'+
  '<div class="car-big"><button class="btn" data-a="cseek" data-d="-15">−15 с</button><button class="btn primary" id="cplay" data-a="ctoggle">▶ Играть</button><button class="btn" data-a="cseek" data-d="15">+15 с</button></div>'+
  '<div class="car-big"><button class="btn" data-a="cstep" data-d="-1">← Урок</button><button class="btn" data-a="cstep" data-d="1">Урок →</button></div></div>'+
  '<div class="card"><span class="label">Все аудиоуроки</span><div class="opts">'+list+'</div></div>';
}
function carInit(){
  const a=carAudio();if(!a)return;
  a.addEventListener('timeupdate',carTick);
  a.addEventListener('play',async()=>{carPlayState();try{if(navigator.wakeLock)carWake=await navigator.wakeLock.request('screen')}catch(e){}});
  a.addEventListener('pause',()=>{carPlayState();S.car.t=a.currentTime;save();try{carWake&&carWake.release();carWake=null}catch(e){}});
  a.addEventListener('ended',()=>{const ids=carIds(),i=ids.indexOf(S.car.id);if(ids[i+1])carLoad(ids[i+1],0,true)});
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='cseek'){const a=carAudio();if(a.src)a.currentTime=+e.target.value}});
}
