document.addEventListener('DOMContentLoaded', () => {
  const N=10,F=[4,3,3,2,2,2,1,1,1,1];
  let P,E,ph='place',turn='p',lock=false,ori='h',qi=0,stack=[];
  const g=id=>document.getElementById(id);
  const on=(id,ev,fn)=>{const el=g(id); if(el) el.addEventListener(ev,fn);};

  const $p=g('player'),$e=g('enemy'),$m=g('msg'),$s=g('status');
  if(!$p||!$e){console.error('Нет контейнеров #player или #enemy в HTML'); return;}

  on('new','click',init);
  on('start','click',start);
  on('auto','click',autoPlace);
  on('reset','click',resetPlace);
  on('undo','click',undo);
  on('rotate','click',()=>{ori=ori==='h'?'v':'h';status()});
  document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'){const btn=g('rotate'); if(btn) btn.click();}});

  const empty=()=>Array.from({length:N},()=>Array(N).fill(0)),ok=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
  function can(b,x,y,l,dx,dy){for(let i=0;i<l;i++){let cx=x+i*dx,cy=y+i*dy;if(!ok(cx,cy)||b[cy][cx]!==0)return false;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){let nx=cx+xx,ny=cy+yy;if(ok(nx,ny)&&b[ny][nx]===1)return false}}return true}
  function place(b,l){for(let t=0;t<999;t++){let h=Math.random()<.5,dx=h?1:0,dy=h?0:1,x=Math.floor(Math.random()*(N-(h?l:0))),y=Math.floor(Math.random()*(N-(h?0:l)));if(can(b,x,y,l,dx,dy)){for(let i=0;i<l;i++)b[y+i*dy][x+i*dx]=1;return}}throw Error('place fail')}
  const fleet=b=>F.forEach(l=>place(b,l));

  function draw($r,b,en,placing){
    $r.innerHTML='';
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      let d=document.createElement('div');d.className='cell';
      let v=b[y][x];
      if(!en&&v===1)d.classList.add('ship');
      if(v===2)d.classList.add('miss');
      if(v===3)d.classList.add('hit');
      if(placing)d.onclick=()=>placeShip(x,y);
      else if(en&&ph==='battle')d.onclick=()=>shoot(x,y);
      $r.appendChild(d);
    }
    $r.classList.toggle('click',placing);
  }

  function placeShip(x,y){
    if(ph!=='place')return;
    let l=F[qi],dx=ori==='h'?1:0,dy=ori==='h'?0:1;
    if(!can(P,x,y,l,dx,dy))return msg('Нельзя ставить здесь');
    for(let i=0;i<l;i++)P[y+i*dy][x+i*dx]=1;
    stack.push({x,y,l,dx,dy}); qi++; status(); draw($p,P,false,true);
    const startBtn=g('start'); if(startBtn) startBtn.disabled=qi<F.length;
    if(qi>=F.length){msg('Игра началась! Стреляйте по противнику'); start()}
  }

  function undo(){
    if(ph!=='place'||!stack.length)return;
    let s=stack.pop(); for(let i=0;i<s.l;i++)P[s.y+i*s.dy][s.x+i*s.dx]=0;
    qi--; status(); draw($p,P,false,true);
    const startBtn=g('start'); if(startBtn) startBtn.disabled=qi<F.length;
  }

  function resetPlace(){
    if(ph!=='place')return;
    P=empty(); qi=0; stack=[]; status(); draw($p,P,false,true);
    const startBtn=g('start'); if(startBtn) startBtn.disabled=true;
  }

  function autoPlace(){
    if(ph!=='place')return;
    P=empty(); qi=0; stack=[];
    for(const l of F){place(P,l); stack.push('a'); qi++}
    draw($p,P,false,true); status();
    const startBtn=g('start'); if(startBtn) startBtn.disabled=false;
    msg('Игра началась! Стреляйте по противнику'); start();
  }

  function start(){
    if(ph!=='place'||qi<F.length)return;
    E=empty(); fleet(E); ph='battle'; turn='p'; lock=false;
    draw($e,E,true,false); draw($p,P,false,false);
    msg('Стреляйте по противнику'); toggle();
  }

  function toggle(){
    $e.classList.toggle('disabled',ph!=='battle');
    $p.classList.toggle('disabled',ph==='battle');
  }

  function shoot(x,y){
    if(lock||ph!=='battle'||turn!=='p')return;
    let v=E[y][x]; if(v>=2)return;
    if(v===1){E[y][x]=3; msg('Попали!'); if(allSunk(E))return end('Вы победили!')}
    else{E[y][x]=2; msg('Мимо'); turn='e'; lock=true; setTimeout(ai,450)}
    draw($e,E,true,false);
  }

  function ai(){
    let x,y,v;
    do{x=Math.floor(Math.random()*N); y=Math.floor(Math.random()*N); v=P[y][x]}while(v>=2);
    if(v===1){P[y][x]=3; msg('Вам попали'); if(allSunk(P))return end('Вы проиграли'); draw($p,P,false,false); setTimeout(ai,550); return}
    P[y][x]=2; msg('Ваш ход'); turn='p'; lock=false; draw($p,P,false,false);
  }

  const allSunk=b=>b.every(r=>r.every(v=>v!==1));
  const msg=t=>{if($m)$m.textContent=t};

  function status(){
    const left=F.slice(qi).reduce((a,l)=>(a[l]=(a[l]||0)+1,a),{});
    if($s)$s.textContent=`Ориентация: ${ori==='h'?'гор.':'верт.'} | Осталось: 4:${left[4]||0}  3:${left[3]||0}  2:${left[2]||0}  1:${left[1]||0}`;
  }

  function init(){
    P=empty(); E=empty(); ph='place'; ori='h'; qi=0; stack=[];
    draw($p,P,false,true); draw($e,E,true,false);
    const startBtn=g('start'); if(startBtn) startBtn.disabled=true;
    toggle(); msg('Расставьте корабли (R — поворот)'); status();
  }

  function end(t){msg(t); lock=true; ph='end'; toggle()}

  init();
});