/* Гра «Знайди пару»: картинка ↔ назва. Два набори: elements (ілюстрації) і symbols (умовні позначення). */

const SETS = {
  elements: {
    id: 'match_elements',
    title: 'Знайди пару',
    task: 'Знайди назву для кожного елемента електричного кола.',
    keys: ['battery', 'lamp', 'switch', 'resistor', 'rheostat', 'capacitor', 'coil', 'ammeter', 'voltmeter', 'fuse', 'led', 'transformer', 'wires', 'electromagnet'],
    draw: illSVG,
    facts: FACTS
  },
  symbols: {
    id: 'match_symbols',
    title: 'Умовні позначення',
    task: 'Так елементи позначають на електричних схемах. Знайди назву для кожного знака.',
    keys: ['battery', 'lamp', 'switch', 'resistor', 'rheostat', 'capacitor', 'coil', 'ammeter', 'voltmeter', 'fuse', 'diode', 'motor', 'led', 'transformer'],
    draw: symSVG,
    facts: SYM_FACTS,
    // Групи схожих знаків: у кожному раунді обов'язково є одна з них, щоб вчитися розрізняти
    groups: [
      ['resistor', 'rheostat', 'fuse'],
      ['lamp', 'ammeter', 'voltmeter', 'motor'],
      ['battery', 'capacitor'],
      ['diode', 'led']
    ]
  }
};
const PER_ROUND = 8; // скільки пар у одному раунді (з 12 обираються випадкові)

const params = new URLSearchParams(location.search);
const SET = SETS[params.get('set')] || SETS.elements;
document.title = SET.title;
document.getElementById('title').textContent = SET.title;
document.getElementById('task').textContent = SET.task;

let state, timer;

const FACT_EMPTY = `<div class="panel-h"><span>💡 Цікаво знати</span></div>
  <p class="fact-empty">Знайди першу пару — і тут з'явиться цікавий факт про цей елемент.</p>`;
const isNarrow = () => matchMedia('(max-width: 1100px)').matches;

// Обирає елементи раунду. Якщо в наборі є групи схожих — бере 2–3 з однієї випадкової групи, решту — випадково.
function pickRound() {
  if (!SET.groups) return shuffle(SET.keys).slice(0, PER_ROUND);
  const g = SET.groups[Math.floor(Math.random() * SET.groups.length)];
  const fromGroup = shuffle(g).slice(0, Math.min(3, g.length));
  const rest = shuffle(SET.keys.filter(k => !fromGroup.includes(k))).slice(0, PER_ROUND - fromGroup.length);
  return shuffle([...fromGroup, ...rest]);
}

function start() {
  const keys = pickRound();
  state = { keys, found: 0, errors: 0, sec: 0, selPic: null, selName: null };
  document.getElementById('s-total').textContent = keys.length;
  document.getElementById('fact').innerHTML = FACT_EMPTY;
  update();

  const pics = document.getElementById('pics');
  pics.innerHTML = '';
  keys.forEach(k => {
    const card = el(`<button class="pic" data-key="${k}"><div class="pic-art">${SET.draw(k)}</div>
      <div class="cap"><span class="cap-q">Перетягни назву сюди</span></div></button>`);
    card.onclick = () => pick('pic', card);
    pics.appendChild(card);
  });

  const names = document.getElementById('names');
  names.innerHTML = '';
  shuffle(keys).forEach(k => {
    const chip = el(`<button class="chip" data-key="${k}">${NAMES[k]}</button>`);
    chip.onclick = () => { if (performance.now() - (chip._dragEnd || 0) > 300) pick('name', chip); };
    enableDrag(chip);
    names.appendChild(chip);
  });

  clearInterval(timer);
  timer = setInterval(() => { state.sec++; update(); }, 1000);
}

function update() {
  document.getElementById('s-pairs').textContent = state.found;
  document.getElementById('s-bar').style.width = (state.found / state.keys.length * 100) + '%';
  document.getElementById('s-err').textContent = state.errors;
  document.getElementById('s-time').textContent = fmtTime(state.sec);
}

function pick(kind, node) {
  if (node.classList.contains('done')) return;
  const prop = kind === 'pic' ? 'selPic' : 'selName';
  if (state[prop]) state[prop].classList.remove('sel');
  state[prop] = state[prop] === node ? null : node;
  if (state[prop]) node.classList.add('sel');
  if (state.selPic && state.selName) tryPair(state.selPic, state.selName);
}

/* Перетягування назви на картинку. Pointer Events — працює і мишкою, і пальцем на сенсорному екрані. */
function enableDrag(chip) {
  chip.addEventListener('pointerdown', e => {
    if (e.button > 0 || chip.classList.contains('gone')) return;
    const sx = e.clientX, sy = e.clientY;
    let ghost = null, over = null, offX = 0, offY = 0, lastX = sx, lastY = sy, raf = 0;

    // Пошук картки під курсором — не частіше одного разу на кадр (сама плашка рухається одразу)
    const hitTest = () => {
      raf = 0;
      const t = document.elementFromPoint(lastX, lastY);
      const p = t && t.closest('.pic:not(.done)');
      if (p !== over) {
        if (over) over.classList.remove('over');
        over = p;
        if (over) over.classList.add('over');
      }
    };

    const move = ev => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; // ще не тягнемо — це може бути клік
        const r = chip.getBoundingClientRect();
        offX = sx - r.left; offY = sy - r.top;
        ghost = chip.cloneNode(true);
        ghost.classList.remove('sel');
        ghost.classList.add('ghost');
        ghost.style.width = r.width + 'px';
        document.body.appendChild(ghost);
        chip.classList.add('dragging');
        document.body.classList.add('is-dragging');
      }
      lastX = ev.clientX; lastY = ev.clientY;
      ghost.style.transform = `translate3d(${lastX - offX}px, ${lastY - offY}px, 0) rotate(-3deg)`;
      if (!raf) raf = requestAnimationFrame(hitTest);
    };
    const up = () => {
      chip.removeEventListener('pointermove', move);
      chip.removeEventListener('pointerup', up);
      chip.removeEventListener('pointercancel', up);
      if (!ghost) return; // не тягнули — спрацює звичайний клік
      if (raf) { cancelAnimationFrame(raf); hitTest(); } // остання перевірка точно в точці відпускання
      chip._dragEnd = performance.now();
      ghost.remove();
      chip.classList.remove('dragging');
      document.body.classList.remove('is-dragging');
      if (over) { over.classList.remove('over'); tryPair(over, chip); }
    };

    chip.setPointerCapture(e.pointerId);
    chip.addEventListener('pointermove', move);
    chip.addEventListener('pointerup', up);
    chip.addEventListener('pointercancel', up);
  });
}

function showFact(k) {
  document.getElementById('fact').innerHTML = `<div class="panel-h"><span>💡 Цікаво знати</span></div>
    <div class="fact-card"><div class="fact-art">${SET.draw(k)}</div>
    <div class="fact-name">${NAMES[k]}</div><p class="fact-text">${SET.facts[k]}</p></div>`;
}

function tryPair(p, n) {
  if (state.selPic) state.selPic.classList.remove('sel');
  if (state.selName) state.selName.classList.remove('sel');
  state.selPic = state.selName = null;

  if (p.dataset.key === n.dataset.key) {
    const k = p.dataset.key;
    p.classList.add('done');
    p.querySelector('.cap').innerHTML = `✓ ${NAMES[k]}`;
    n.classList.add('gone');
    state.found++;
    showFact(k);
    if (isNarrow()) toast(`<b>${NAMES[k]}</b> — ${SET.facts[k]}`, 'ok');
    if (state.found === state.keys.length) finish();
  } else {
    state.errors++;
    [p, n].forEach(x => { x.classList.remove('bad'); void x.offsetWidth; x.classList.add('bad'); });
    setTimeout(() => [p, n].forEach(x => x.classList.remove('bad')), 450);
    toast(`Ні, це не <b>${NAMES[n.dataset.key].toLowerCase()}</b>. Спробуй ще!`, 'err');
  }
  update();
}

function finish() {
  clearInterval(timer);
  // Блискавки: «Знайди пару» — до 2, «Умовні позначення» — до 3 (менше помилок — більше блискавок)
  const max = gameMax(SET.id);
  const e = state.errors;
  const stars = max === 2 ? (e <= 2 ? 2 : 1) : (e <= 1 ? 3 : e <= 4 ? 2 : 1);
  saveStars(SET.id, stars);
  setTimeout(() => showResult({
    stars, game: SET.id,
    title: stars === max ? 'Чудово!' : stars > 1 ? 'Добре!' : 'Непогано!',
    text: `Усі пари знайдено за ${fmtTime(state.sec)}. Помилок: ${state.errors}.` + (stars < max ? ' Спробуй ще раз з меншою кількістю помилок — і отримаєш більше блискавок!' : ''),
    again: start
  }), 700);
}

start();
