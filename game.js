(()=>{const N=10,F=[4,3,3,2,2,2,1,1,1,1];
let P,E,turn='p',lock=false,phase='place',rot=1,idx=0,q=[];
const $p=document.getElementById('player'),$e=document.getElementById('enemy'),$m=document.getElementById('msg'),$new=document.getElementById('new'),$rot=document.getElementById('rotate'),$ready=document.getElementById('ready');
$new.onclick=init;$rot.onclick=()=>{rot^=1;hint()};document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r')$rot.click()});$ready.onclick=()=>{if(idx===F.length)startBattle()};
const empty=()=>Array.from({length:N},()=>Array(N).fill(0)),ok=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
function can(b,x,y,l,dx,dy){for(let i=0;i<l;i++){let cx=x+i*dx,cy=y+i*dy;if(!ok(cx,cy)||b[cy][cx]!==0)return false;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){let nx=cx+xx,ny=cy+yy;if(ok(nx,ny)&&b[ny][nx]===1)return false;}}return true;}
function placeRand(b,l){for(let t=0;t<999;t++){let h=Math.random()<.5,dx=h?1:0,dy=h?0:1,x=Math.floor(Math.random()*(N-(h?l:0))),y=Math.floor(Math.random()*(N-(h?0:l)));if(can(b,x,y,l,dx,dy)){for(let i=0;i<l;i++)b[y+i*dy][x+i*dx]=1;return;}}}
const fleet=b=>F.forEach(l=>placeRand(b,l));
function draw(){$p.innerHTML='';for(let y=0;y<N;y++)for(let x=0;x<N;x++){const d=document.createElement('div');d.className='cell';let v=P[y][x];if(v===1)d.classList.add('ship');if(v===2)d.classList.add('miss');if(v===3)d.classList.add('hit');if(phase==='place')d.onclick=()=>placeManual(x,y);$p.appendChild(d);}
$e.innerHTML='';for(let y=0;y<N;y++)for(let x=0;x<N;x++){const d=document.createElement('div');d.className='cell';let v=E[y][x];if(v===2)d.classList.add('miss');if(v===3)d.classList.add('hit');if(phase==='battle')d.onclick=()=>shoot(x,y);$e.appendChild(d);}
$p.classList.toggle('click',phase==='place');$e.classList.toggle('click',phase==='battle'&&turn==='p'&&!lock);}
function placeManual(x,y){if(phase!=='place')return;let l=F[idx],dx=rot?1:0,dy=rot?0:1;if(can(P,x,y,l,dx,dy)){for(let i=0;i<l;i++)P[y+i*dy][x+i*dx]=1;idx++;$ready.disabled=idx!==F.length;draw();hint()}else msg('Сюда нельзя поставить');}
function shoot(x,y){if(lock||phase!=='battle'||turn!=='p')return;let v=E[y][x];if(v>=2)return;if(v===1){E[y][x]=3;msg('Попали!');draw();if(allSunk(E))return end('Вы победили!');}else{E[y][x]=2;msg('Мимо');turn='e';lock=true;setTimeout(ai,500);}draw();}
function ai(){let x,y,v;if(q.length){[x,y]=q.shift();if(!ok(x,y)||P[y][x]>=2)return setTimeout(ai,10);}else{do{x=Math.floor(Math.random()*N);y=Math.floor(Math.random()*N);v=P[y][x];}while(v>=2);}v=P[y][x];if(v===1){P[y][x]=3;msg('Вам попали');draw();if(allSunk(P))return end('Вы проиграли');[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{let nx=x+dx,ny=y+dy;if(ok(nx,ny)&&P[ny][nx]<2)q.unshift([nx,ny])});setTimeout(ai,550);return;}P[y][x]=2;msg('Ваш ход');turn='p';lock=false;draw();}
const allSunk=b=>b.every(r=>r.every(v=>v!==1)),msg=t=>($m.textContent=t);
function end(t){msg(t);lock=true;turn='e';}
function hint(){if(phase==='place'){let l=F[idx]||0;msg('Расставьте корабли. Длина: '+l+' | Поворот: '+(rot?'гор':'вер'))}}
function startBattle(){phase='battle';draw();msg('Стреляйте по полю противника')}
function init(){P=empty();E=empty();fleet(E);turn='p';lock=false;phase='place';rot=1;idx=0;q=[];$ready.disabled=true;draw();hint()}
init();})();