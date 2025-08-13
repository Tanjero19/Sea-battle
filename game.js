document.addEventListener('DOMContentLoaded', () => {
  const N = 10;
  const FLEET = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

  let P, E;                 // Доски: Player, Enemy
  let phase = 'place';      // 'place' | 'battle' | 'end'
  let turn = 'p';           // 'p' | 'e'
  let lock = false;         // Блокировка хода (анимация/ИИ)
  let ori = 'h';            // 'h' | 'v' — ориентация при расстановке
  let qi = 0;               // Индекс следующего корабля из FLEET
  let stack = [];           // Стек для undo при ручной расстановке

  const $ = id => document.getElementById(id);
  const $p = $('player'), $e = $('enemy'), $m = $('msg'), $s = $('status');

  // Утилиты
  const empty = () => Array.from({ length: N }, () => Array(N).fill(0));
  const ok = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

  function can(board, x, y, len, dx, dy) {
    for (let i = 0; i < len; i++) {
      const cx = x + i * dx, cy = y + i * dy;
      if (!ok(cx, cy) || board[cy][cx] !== 0) return false;
      for (let yy = -1; yy <= 1; yy++) {
        for (let xx = -1; xx <= 1; xx++) {
          const nx = cx + xx, ny = cy + yy;
          if (ok(nx, ny) && board[ny][nx] === 1) return false;
        }
      }
    }
    return true;
  }

  function placeRandom(board, len) {
    for (let t = 0; t < 999; t++) {
      const h = Math.random() < 0.5;
      const dx = h ? 1 : 0, dy = h ? 0 : 1;
      const x = Math.floor(Math.random() * (N - (h ? len : 0)));
      const y = Math.floor(Math.random() * (N - (h ? 0 : len)));
      if (can(board, x, y, len, dx, dy)) {
        for (let i = 0; i < len; i++) board[y + i * dy][x + i * dx] = 1;
        return;
      }
    }
    throw new Error('Не удалось разместить корабль');
  }

  const fleet = board => FLEET.forEach(l => placeRandom(board, l));
  const allSunk = board => board.every(r => r.every(v => v !== 1));
  const setMsg = t => { if ($m) $m.textContent = t; };

  function status() {
    const left = FLEET.slice(qi).reduce((a, l) => (a[l] = (a[l] || 0) + 1, a), {});
    if ($s) {
      $s.textContent = `Ориентация: ${ori === 'h' ? 'гор.' : 'верт.'} | Осталось: ` +
        `4:${left[4] || 0}  3:${left[3] || 0}  2:${left[2] || 0}  1:${left[1] || 0}`;
    }
  }

  function draw(root, board, hideShips, placing) {
    root.innerHTML = '';
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const d = document.createElement('div');
        d.className = 'cell';
        const v = board[y][x];
        if (!hideShips && v === 1) d.classList.add('ship');
        if (v === 2) d.classList.add('miss');
        if (v === 3) d.classList.add('hit');
        if (placing) d.onclick = () => placeShip(x, y);
        else if (hideShips && phase === 'battle') d.onclick = () => shoot(x, y);
        root.appendChild(d);
      }
    }
    root.classList.toggle('click', placing);
  }

  // Расстановка игрока
  function placeShip(x, y) {
    if (phase !== 'place') return;
    const len = FLEET[qi];
    const dx = ori === 'h' ? 1 : 0;
    const dy = ori === 'h' ? 0 : 1;
    if (!can(P, x, y, len, dx, dy)) return setMsg('Нельзя ставить здесь');

    for (let i = 0; i < len; i++) P[y + i * dy][x + i * dx] = 1;
    stack.push({ x, y, len, dx, dy });
    qi++;
    status();
    draw($p, P, false, true);
    $('start').disabled = qi < FLEET.length;

    if (qi >= FLEET.length) {
      setMsg('Игра началась! Стреляйте по противнику');
      start();
    }
  }

  function undo() {
    if (phase !== 'place' || !stack.length) return;
    const s = stack.pop();
    for (let i = 0; i < s.len; i++) P[s.y + i * s.dy][s.x + i * s.dx] = 0;
    qi--;
    status();
    draw($p, P, false, true);
    $('start').disabled = qi < FLEET.length;
  }

  function resetPlace() {
    if (phase !== 'place') return;
    P = empty(); qi = 0; stack = [];
    status();
    draw($p, P, false, true);
    $('start').disabled = true;
  }

  function autoPlace() {
    if (phase !== 'place') return;
    P = empty(); qi = 0; stack = [];
    for (const l of FLEET) { placeRandom(P, l); qi++; }
    draw($p, P, false, true);
    status();
    $('start').disabled = false;
    setMsg('Игра началась! Стреляйте по противнику');
    start();
  }

  // Бой
  function start() {
    if (phase !== 'place' || qi < FLEET.length) return;
    E = empty();
    fleet(E);
    phase = 'battle';
    turn = 'p';
    lock = false;
    draw($e, E, true, false);
    draw($p, P, false, false);
    toggle();
    setMsg('Стреляйте по противнику');
  }

  function toggle() {
    $e.classList.toggle('disabled', phase !== 'battle');
    $p.classList.toggle('disabled', phase === 'battle');
  }

  function shoot(x, y) {
    if (lock || phase !== 'battle' || turn !== 'p') return;
    const v = E[y][x];
    if (v >= 2) return;

    if (v === 1) {
      E[y][x] = 3;
      setMsg('Попали!');
      draw($e, E, true, false);
      if (allSunk(E)) return end('Вы победили!');
    } else {
      E[y][x] = 2;
      setMsg('Мимо');
      draw($e, E, true, false);
      turn = 'e';
      lock = true;
      setTimeout(ai, 450);
    }
  }

  function ai() {
    let x, y, v;
    do {
      x = Math.floor(Math.random() * N);
      y = Math.floor(Math.random() * N);
      v = P[y][x];
    } while (v >= 2);

    if (v === 1) {
      P[y][x] = 3;
      setMsg('Вам попали');
      draw($p, P, false, false);
      if (allSunk(P)) return end('Вы проиграли');
      return setTimeout(ai, 550);
    }

    P[y][x] = 2;
    setMsg('Ваш ход');
    draw($p, P, false, false);
    turn = 'p';
    lock = false;
  }

  function end(t) {
    setMsg(t);
    lock = true;
    phase = 'end';
    toggle();
  }

  // Инициализация
  function init() {
    P = empty();
    E = empty();
    phase = 'place';
    turn = 'p';
    lock = false;
    ori = 'h';
    qi = 0;
    stack = [];
    draw($p, P, false, true);
    draw($e, E, true, false);
    $('start').disabled = true;
    toggle();
    setMsg('Расставьте корабли (R — поворот)');
    status();
  }

  // События
  $('new')?.addEventListener('click', init);
  $('start')?.addEventListener('click', start);
  $('auto')?.addEventListener('click', autoPlace);
  $('reset')?.addEventListener('click', resetPlace);
  $('undo')?.addEventListener('click', undo);
  $('rotate')?.addEventListener('click', () => { ori = ori === 'h' ? 'v' : 'h'; status(); });
  document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'r') $('rotate')?.click();
  });

  // Старт
  init();
});