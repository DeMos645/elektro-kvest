/* Гра «Збери коло»: добудуй схему, виміряй, досліджуй з'єднання.
   Кожен рівень описує власну схему (parts, wires), фізику (model) і мету (goal).
   Деталі можна перетягувати з панелі на «?» або натискати: деталь → «?».
   Правило для текстів: умова ставить задачу, але не підказує відповідь. */

const U = 4.5;        // напруга джерела, В
const R_LAMP = 15;    // опір лампи, Ом
const R_RHEO = 45;    // максимальний опір реостата, Ом
const I0 = U / R_LAMP; // струм через одну лампу, 0,3 А

// Типові місця на прямокутній схемі (viewBox 720×400)
const P = {
  left:   { x: 110, y: 200, r: 90 },
  top:    { x: 320, y: 80,  r: 0 },
  right:  { x: 530, y: 200, r: 90 },
  bottom: { x: 320, y: 320, r: 0 },
  par:    { x: 620, y: 200, r: 90 }
};
const at = (pos, extra) => Object.assign({}, P[pos], extra);

const LOOP = 'M110 200 V80 H530 V320 H110 Z';           // основне коло (від «+» батарейки вгору)
const PAR_WIRE = 'M530 140 H620 V260 H530';               // гілка паралельно лампі справа
const SHORT_LOOP = 'M110 200 V80 H530 V140 H620 V260 H530 V320 H110 Z'; // струм в обхід лампи
// Паралельне з'єднання
const PL_OUTER = 'M110 200 V80 H560 V320 H110 Z';
const PL_VIA_L1 = 'M110 200 V80 H400 V320 H110 Z';
const PL_BRANCH = 'M400 80 H560 V320 H400';
// Конденсатор з перемикачем: A — до батарейки (заряд), B — до лампи (розряд)
const SW3 = { A: [300, 80], B: [420, 80], pivot: [360, 128] };
const CH_LOOP = 'M110 220 V80 H300 L360 128 V340 H110 Z';
const DIS_LOOP = 'M360 220 V128 L420 80 H610 V340 H360 Z';

const SWITCH_OFF = 'Ключ розімкнено — коло розірване, струму немає.';

/* ---------- Розрахунок для простої схеми «батарейка — ключ — лампа (+ ще щось)» ---------- */
function simpleModel() {
  const L = LEVELS[lv];
  const res = { I: 0, lamps: {}, flows: [], readings: [] };
  let ok = allPlaced() && st.closed && !st.blown && !(L.diodeFlip && !st.diodeFwd);
  // коротке замикання: риски біжать помітно швидше (0,4 с), але так, щоб їх було видно
  if (ok && st.short) { res.flows.push({ d: SHORT_LOOP, dur: 0.4 }); ok = false; }
  if (ok) {
    const R = R_LAMP + (st.placed.bottom === 'rheostat' ? st.rh * R_RHEO : 0);
    res.I = U / R;
    res.lamps.right = res.I / I0;
    res.flows.push({ d: LOOP, I: res.I });
    if (st.placed.par === 'voltmeter') res.flows.push({ d: PAR_WIRE, faint: true });
  }
  if (st.placed.bottom === 'ammeter') res.readings.push({ x: 320, y: 378, text: fmt(res.I) + ' А' });
  if (st.placed.par === 'voltmeter') res.readings.push({ x: 652, y: 206, text: fmt(res.I * R_LAMP, 1) + ' В', cls: 'v', anchor: 'start' });
  return res;
}

const BASE = { left: at('left', { type: 'battery' }), top: at('top', { type: 'switch' }), right: at('right', { type: 'lamp' }) };

const LEVELS = [
  {
    title: 'Чого бракує?',
    task: 'Лампа не світить. Перетягни на «?» елемент, без якого струму в колі не буде.',
    parts: { ...BASE, left: at('left', { slot: 'battery' }) },
    wires: [LOOP],
    palette: ['resistor', 'battery', 'capacitor', 'ammeter'],
    wrong: { left: {
      resistor: 'Резистор лише обмежує струм, але сам його не створює.',
      capacitor: 'Конденсатор не створює напругу і не пропускає постійний струм.',
      ammeter: 'Амперметр тільки вимірює струм — створити його він не може.' } },
    model: simpleModel, goal: m => m.I > 0,
    done: 'Є струм! Джерело створює напругу, і по замкненому колу тече струм — жовті риски показують його напрямок від «+» до «–». Натисни на ключ угорі: так коло розмикають і замикають.'
  },
  {
    title: 'Виміряй струм і напругу',
    task: 'Дізнайся силу струму в колі та напругу на лампі. Подумай, який прилад куди поставити.',
    parts: { ...BASE, bottom: at('bottom', { slot: 'ammeter' }), par: at('par', { slot: 'voltmeter' }) },
    wires: [LOOP, PAR_WIRE], dots: [[530, 140], [530, 260]],
    palette: ['voltmeter', 'ammeter', 'resistor'],
    wrong: {
      bottom: {
        voltmeter: 'Вольтметр має дуже великий опір — увімкнений в коло послідовно, він майже «перекриє» струм.',
        resistor: 'Резистор не покаже жодних значень. Тут потрібен вимірювальний прилад.' },
      par: {
        ammeter: 'Небезпечно! Опір амперметра майже нульовий — паралельно лампі він створить коротке замикання.',
        resistor: 'Резистор не покаже жодних значень. Тут потрібен вимірювальний прилад.' }
    },
    model: simpleModel, goal: m => m.I > 0,
    done: 'Правильно! Амперметр вмикають послідовно — він показує 0,30 А. Вольтметр — паралельно лампі, він показує 4,5 В. За законом Ома опір лампи R = U / I = 4,5 / 0,3 = 15 Ом.'
  },
  {
    title: 'Регулюй яскравість',
    task: 'Зроби так, щоб яскравість лампи можна було плавно змінювати.',
    parts: { ...BASE, bottom: at('bottom', { slot: 'rheostat' }) },
    wires: [LOOP],
    palette: ['resistor', 'rheostat', 'capacitor'],
    wrong: { bottom: {
      resistor: 'Резистор має сталий опір — яскравість буде одна й та сама.',
      capacitor: 'Конденсатор не пропускає постійний струм — лампа не засвітиться.' } },
    afterPlace: { rheostat: 'Деталь на місці. Тепер скористайся повзунком і подивись на лампу.' },
    slider: true,
    model: simpleModel, goal: m => m.I > 0 && st.rhMoved,
    done: 'Більший опір — менший струм — тьмяніша лампа. Реостатом плавно змінюють силу струму: у лабораторіях, на виробництві, для керування двигунами.'
  },
  {
    title: 'Ялинкова гірлянда',
    task: 'У старих гірляндах лампочки з\'єднані одна за одною. Добудуй таку «гірлянду» й перевір: що буде, якщо одна лампочка перегорить?',
    parts: {
      left: at('left', { type: 'battery' }), bottom: at('bottom', { type: 'switch' }),
      l1: { x: 230, y: 80, r: 0, type: 'lamp' }, l2: { x: 420, y: 80, r: 0, slot: 'lamp' }
    },
    wires: [LOOP],
    palette: ['resistor', 'lamp', 'capacitor'],
    wrong: { l2: {
      resistor: 'Резистор не світиться — гірлянда з нього не вийде.',
      capacitor: 'Конденсатор не пропускає постійний струм — гірлянда не світитиме.' } },
    afterPlace: { lamp: 'Гірлянда світить. Зверни увагу на яскравість. А тепер «викрути» будь-яку лампу — просто натисни на неї.' },
    lampToggle: true,
    model() {
      const res = { I: 0, lamps: {}, flows: [], readings: [] };
      if (!allPlaced() || !st.closed || st.out.l1 || st.out.l2) return res;
      res.I = U / (2 * R_LAMP);
      res.lamps.l1 = res.lamps.l2 = res.I / I0;
      res.flows.push({ d: LOOP, I: res.I });
      return res;
    },
    goal: () => allPlaced() && st.closed && (st.out.l1 || st.out.l2),
    status: () => !st.closed ? SWITCH_OFF : (st.out.l1 || st.out.l2) ? null : 'Лампу вкручено — коло знову замкнене, обидві лампи світять.',
    done: 'Згасли обидві! Це послідовне з\'єднання: струм іде одним шляхом, і розрив у будь-якому місці зупиняє його всюди. А ще лампи світили тьмяніше — напруга ділиться між ними. Натисни на лампу ще раз, щоб вкрутити її.'
  },
  {
    title: 'Як у квартирі',
    task: 'Підключи другу лампу на окрему гілку. Потім «викрути» одну з ламп, натиснувши на неї. Що станеться з другою?',
    parts: {
      left: at('left', { type: 'battery' }), top: { x: 250, y: 80, r: 0, type: 'switch' },
      l1: { x: 400, y: 200, r: 90, type: 'lamp' }, l2: { x: 560, y: 200, r: 90, slot: 'lamp' }
    },
    wires: [PL_OUTER, 'M400 80 V320'], dots: [[400, 80], [400, 320]],
    palette: ['capacitor', 'resistor', 'lamp'],
    wrong: { l2: {
      resistor: 'Резистор не світиться — а на гілці має бути друга лампа для досліду.',
      capacitor: 'Конденсатор не пропускає постійний струм — друга гілка не працюватиме.' } },
    afterPlace: { lamp: 'Обидві лампи світять. Порівняй їхню яскравість з попереднім завданням. Тепер «викрути» будь-яку лампу.' },
    lampToggle: true,
    model() {
      const res = { I: 0, lamps: {}, flows: [], readings: [] };
      if (!st.closed) return res;
      const a = !st.out.l1, b = st.placed.l2 === 'lamp' && !st.out.l2;
      if (a) res.lamps.l1 = 1;
      if (b) res.lamps.l2 = 1;
      res.I = (a + b) * I0;
      if (a) res.flows.push({ d: PL_VIA_L1, I: res.I });
      if (b) res.flows.push({ d: a ? PL_BRANCH : PL_OUTER, I: I0 });
      return res;
    },
    goal: m => st.placed.l2 === 'lamp' && st.closed && Object.keys(m.lamps).length === 1,
    status: m => {
      const n = Object.keys(m.lamps).length;
      return !st.closed ? SWITCH_OFF : n === 1 ? null : n === 2 ? 'Обидві лампи світять — у кожної свій шлях для струму.' : 'Обидві лампи викручені — струму немає.';
    },
    done: 'Друга лампа світить далі! Це паралельне з\'єднання: кожна лампа має свій шлях струму й отримує повну напругу, тому обидві світять яскраво. Саме так підключені всі прилади у твоїй квартирі.'
  },
  {
    title: 'Вулиця з одностороннім рухом',
    task: 'Встав у коло елемент, який пропускає струм лише в одному напрямку, і доможися, щоб лампа світила.',
    parts: { ...BASE, bottom: at('bottom', { slot: 'diode' }) },
    wires: [LOOP],
    palette: ['resistor', 'diode', 'fuse'],
    wrong: { bottom: {
      resistor: 'Резистор пропускає струм в обидва боки — це не «односторонній рух».',
      fuse: 'Запобіжник пропускає струм в обидва боки — це не «односторонній рух».' } },
    afterPlace: { diode: 'Елемент на місці, але лампа не світить. Подивись, куди тече струм (від «+» батарейки), і куди «дивиться» трикутник. Елементи на схемі можна натискати.' },
    diodeFlip: true,
    model: simpleModel, goal: m => m.I > 0,
    status: m => m.I > 0 ? null : !st.closed ? SWITCH_OFF : 'Діод повернутий проти струму — він його не пропускає, лампа згасла.',
    done: 'Світить! Діод пропускає струм лише туди, куди «дивиться» трикутник. Діоди є в кожному зарядному пристрої: вони перетворюють змінний струм на постійний.'
  },
  {
    title: 'Захист від пожежі',
    task: 'Встав у коло елемент, який захистить проводку, якщо струм стане небезпечно великим.',
    parts: { ...BASE, bottom: at('bottom', { slot: 'fuse' }) },
    wires: [LOOP],
    palette: ['resistor', 'fuse', 'capacitor'],
    wrong: { bottom: {
      resistor: 'Резистор обмежить струм, але при аварії не розірве коло.',
      capacitor: 'Конденсатор не пропускає постійний струм — лампа не засвітиться.' } },
    afterPlace: { fuse: 'Елемент на місці, лампа світить. А тепер — аварія! Натисни «Замкнути накоротко» і подивись, що буде.' },
    shortBtn: true,
    model: simpleModel, goal: () => st.blown,
    status: () => null,
    done: 'Запобіжник перегорів і розірвав коло! При короткому замиканні струм стає величезним, дроти розжарюються — і може статися пожежа. Тому в кожній квартирі є запобіжники або автоматичні вимикачі.'
  },
  {
    title: 'Постійний чи змінний?',
    task: 'У колі вже стоїть конденсатор. Обери джерело, з яким лампа світитиме.',
    parts: { ...BASE, left: at('left', { slot: 'ac' }), bottom: at('bottom', { type: 'capacitor' }) },
    wires: [LOOP],
    palette: ['battery', 'ac', 'resistor'],
    labels: { battery: 'Джерело постійного струму' },
    wrong: { left: {
      battery: 'Від батарейки йде постійний струм, а конденсатор його не пропускає — лампа не світить.',
      resistor: 'Резистор не створює напругу — це не джерело.' } },
    model() {
      const res = { I: 0, lamps: {}, flows: [], readings: [] };
      if (st.placed.left !== 'ac' || !st.closed) return res;
      res.I = I0;
      res.lamps.right = 1;
      res.flows.push({ d: LOOP, ac: true });
      return res;
    },
    goal: m => m.I > 0,
    done: 'Світить! У розетці змінний струм частотою 50 Гц: щосекунди він 50 разів тече в один бік і 50 разів — в інший. Конденсатор весь час перезаряджається то в один, то в інший бік, тому в колі тече струм. Отже, змінний струм конденсатор пропускає, а постійний — ні.'
  },
  {
    title: 'Що вміє конденсатор',
    task: 'У минулому завданні постійний струм через конденсатор не йшов. Але зарядитися від батарейки він може! Перемкни його на батарейку й подивись, скільки триватиме струм. Потім — на лампу.',
    parts: {
      bat: { x: 110, y: 220, r: 90, type: 'battery' },
      cap: { x: 360, y: 220, r: 90, type: 'capacitor' },
      lamp: { x: 610, y: 220, r: 90, type: 'lamp' }
    },
    wires: ['M110 168 V80 H300', 'M610 168 V80 H420', 'M360 168 V128', 'M110 272 V340 H610 V272', 'M360 272 V340'],
    dots: [[360, 340]],
    sw3: true,
    palette: [],
    model() {
      const res = { I: 0, lamps: {}, flows: [], readings: [] };
      // швидкість рисок стала, а «слабшання» струму показуємо прозорістю
      if (st.sw === 'A' && st.q < 0.98) res.flows.push({ d: CH_LOOP, I: I0, op: 0.25 + 0.75 * (1 - st.q) });
      if (st.sw === 'B' && st.q > 0.02) { res.lamps.lamp = Math.min(1, st.q * 1.2); res.flows.push({ d: DIS_LOOP, I: I0, op: 0.25 + 0.75 * st.q }); }
      res.readings.push({ x: 398, y: 226, text: 'заряд ' + Math.round(st.q * 100) + ' %', cls: 'q', anchor: 'start' });
      return res;
    },
    goal: () => st.flashed,
    status: () => null,
    done: 'Бачиш? Від батарейки струм ішов лише кілька секунд — поки конденсатор заряджався, а потім зупинився. Тому й кажуть, що постійний струм він не пропускає. Зате запасений заряд конденсатор віддав лампі — так працює спалах фотоапарата.'
  }
];

let lv, st, mistakes = 0, dragEnd = 0, anim = 0, lastT = 0;
const board = document.getElementById('board');
const side = document.getElementById('side');
const fmt = (x, d = 2) => x.toFixed(d).replace('.', ',');

function startGame() {
  mistakes = 0;
  document.getElementById('s-err').textContent = 0;
  loadLevel(0);
}

function loadLevel(i) {
  lv = i;
  if (anim) { cancelAnimationFrame(anim); anim = 0; }
  st = { placed: {}, closed: true, sel: null, rh: 0.5, rhMoved: false, done: false,
         out: {}, diodeFwd: false, short: false, blown: false,
         sw: 'B', q: 0, flash: false, flashed: false,   // для рівня з конденсатором
         msg: { text: '', kind: '' } };
  render();
}

function allPlaced() {
  const L = LEVELS[lv];
  for (const id in L.parts) if (L.parts[id].slot && st.placed[id] !== L.parts[id].slot) return false;
  return true;
}
const model = () => LEVELS[lv].model();

function render() { renderSide(drawBoard()); }

function placeG(p, inner, cls = '', attrs = '') {
  return `<g class="${cls}" ${attrs} transform="translate(${p.x},${p.y}) rotate(${p.r}) scale(1.3) translate(-40,-20)">
    <rect x="2" y="16" width="76" height="8" fill="#fbfaf6"/>
    <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${inner}</g></g>`;
}

// Перемикач на два положення (для рівня з конденсатором)
function sw3G() {
  const [px, py] = SW3.pivot, [tx, ty] = SW3[st.sw];
  const dot = ([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="currentColor"/>`;
  return `<g class="comp click" data-id="sw3" data-type="sw3">
    <rect x="270" y="52" width="180" height="96" rx="14" class="sw-hit"/>
    <line x1="${px}" y1="${py}" x2="${tx}" y2="${ty}" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    ${dot(SW3.A)}${dot(SW3.B)}${dot(SW3.pivot)}</g>`;
}

// Малює лише схему і повертає результат розрахунку
function drawBoard() {
  const L = LEVELS[lv];
  const m = model();
  let svg = `<defs><radialGradient id="glow"><stop offset="0" stop-color="#ffe066" stop-opacity=".95"/><stop offset="1" stop-color="#ffe066" stop-opacity="0"/></radialGradient></defs>`;

  // сяйво ламп
  for (const id in m.lamps) {
    const p = L.parts[id];
    svg += `<circle data-glow="${id}" cx="${p.x}" cy="${p.y}" r="85" fill="url(#glow)" opacity="${Math.min(1, m.lamps[id])}"/>`;
  }

  svg += '<g id="bd-main">'; // усе, крім сяйва, — для підгонки масштабу на телефоні
  // дроти, вузли, коротке замикання
  L.wires.forEach(d => svg += `<path class="wire" d="${d}"/>`);
  if (st.short) svg += `<path class="wire short" d="${PAR_WIRE}"/>`;
  (L.dots || []).concat(st.short ? [[530, 140], [530, 260]] : []).forEach(([x, y]) => svg += `<circle cx="${x}" cy="${y}" r="5" style="fill:var(--navy)"/>`);

  // струм
  m.flows.forEach((f, i) => {
    if (f.ac) { svg += `<path class="flow ac" d="${f.d}"/>`; return; } // змінний струм: риски бігають туди-сюди
    const dur = f.dur || (f.faint ? 6 : Math.max(0.12, 0.3 / f.I));
    const op = f.op != null ? f.op : f.faint ? 0.5 : 1;
    svg += `<path class="flow" data-flow="${i}" style="--dur:${dur.toFixed(2)}s;opacity:${op.toFixed(2)}" d="${f.d}"/>`;
  });

  if (L.sw3) svg += sw3G();

  // елементи та порожні місця
  for (const id in L.parts) {
    const p = L.parts[id];
    const type = p.type || st.placed[id];
    if (!type) {
      svg += `<g class="slot" data-slot="${id}" transform="translate(${p.x},${p.y}) rotate(${p.r}) scale(1.3) translate(-40,-20)">
        <rect x="-1" y="1" width="82" height="38" fill="#fbfaf6"/><rect class="box" x="6" y="0" width="68" height="40" rx="7"/></g>
        <text class="slot-q pulse" x="${p.x}" y="${p.y + 11}" text-anchor="middle">?</text>`;
      continue;
    }
    const opt = { rot: p.r };
    let pp = p, cls = 'comp', clickable = false;
    if (type === 'switch') { opt.closed = st.closed; clickable = true; }
    if (type === 'lamp') { opt.glow = m.lamps[id] ? Math.min(1, m.lamps[id]) : 0; clickable = !!L.lampToggle; }
    if (type === 'diode' && L.diodeFlip) { pp = { ...p, r: p.r + (st.diodeFwd ? 180 : 0) }; clickable = true; }
    if (type === 'fuse') opt.blown = st.blown;
    if (type === 'fuse' && st.short && !st.blown) cls += ' hot'; // запобіжник розжарюється перед тим, як перегоріти
    if (type === 'lamp' && st.out[id]) cls += ' out';
    if (clickable) cls += ' click';
    svg += placeG(pp, symInner(type, opt), cls, `data-id="${id}" data-type="${type}"`);
    if (type === 'lamp' && st.out[id]) {
      svg += p.r ? `<text class="out-label" x="${p.x + 42}" y="${p.y + 5}">викручена</text>`
                 : `<text class="out-label" x="${p.x}" y="${p.y - 36}" text-anchor="middle">викручена</text>`;
    }
  }

  // покази приладів
  m.readings.forEach((r, i) => svg += `<text data-read="${i}" class="reading ${r.cls || ''}" x="${r.x}" y="${r.y}" text-anchor="${r.anchor || 'middle'}">${r.text}</text>`);

  svg += '</g>';
  board.innerHTML = svg;
  boardSig = sigOf(m);
  fitBoard();
  return m;
}

/* На телефоні схема дрібна: обрізаємо порожні поля навколо неї, щоб вона була якомога більшою.
   Межі лише розширюються в межах рівня (коли з'являються покази приладів), тож схема не «стрибає». */
let fit = { lv: -1, box: null };
const narrow = () => matchMedia('(max-width: 760px)').matches;
function fitBoard() {
  if (!narrow()) { board.setAttribute('viewBox', '0 0 720 400'); fit = { lv: -1, box: null }; return; }
  const b = board.querySelector('#bd-main').getBBox();
  const pad = 26;
  let box = { x1: b.x - pad, y1: b.y - pad, x2: b.x + b.width + pad, y2: b.y + b.height + pad };
  if (fit.lv === lv && fit.box) box = { x1: Math.min(box.x1, fit.box.x1), y1: Math.min(box.y1, fit.box.y1), x2: Math.max(box.x2, fit.box.x2), y2: Math.max(box.y2, fit.box.y2) };
  fit = { lv, box };
  board.setAttribute('viewBox', `${box.x1} ${box.y1} ${box.x2 - box.x1} ${box.y2 - box.y1}`);
}
window.addEventListener('resize', () => { fit = { lv: -1, box: null }; fitBoard(); });

/* Під час плавних змін (заряд конденсатора) схему не перемальовуємо повністю —
   інакше анімація рисок щокадру починалася б спочатку й риски «стояли б». Оновлюємо лише цифри та яскравість. */
let boardSig = '';
const sigOf = m => m.flows.map(f => f.d).join('|') + '#' + Object.keys(m.lamps).join(',');
function updateBoard() {
  const m = model();
  if (sigOf(m) !== boardSig) return drawBoard();
  m.flows.forEach((f, i) => {
    const p = board.querySelector(`[data-flow="${i}"]`);
    if (p && f.op != null) p.style.opacity = f.op.toFixed(2);
  });
  for (const id in m.lamps) {
    const b = Math.min(1, m.lamps[id]).toFixed(2);
    const g = board.querySelector(`[data-glow="${id}"]`);
    if (g) g.setAttribute('opacity', b);
    const c = board.querySelector(`[data-id="${id}"] circle[fill="#ffd84d"]`);
    if (c) c.setAttribute('opacity', b);
  }
  m.readings.forEach((r, i) => {
    const t = board.querySelector(`[data-read="${i}"]`);
    if (t) t.textContent = r.text;
  });
  return m;
}

function renderSide(m) {
  const L = LEVELS[lv];
  const used = Object.values(st.placed);
  let h = `<div class="levels">${LEVELS.map((_, i) => `<span class="${i === lv ? 'cur' : i < lv ? 'ok' : ''}">${i + 1}</span>`).join('')}</div>
    <h3>${L.title}</h3><p class="desc">${L.task}</p>
    <div class="palette" ${L.palette.length ? '' : 'hidden'}>${L.palette.map(t => `<button class="part ${st.sel === t ? 'sel' : ''} ${used.includes(t) ? 'used' : ''}" data-part="${t}">
      <svg viewBox="-4 -4 88 48"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">${symInner(t, t === 'switch' ? { closed: false } : {})}</g></svg>${(L.labels && L.labels[t]) || NAMES[t]}</button>`).join('')}</div>`;
  if (L.slider && st.placed.bottom === 'rheostat') {
    h += `<div class="slider"><label><b>Повзунок реостата</b></label>
      <input type="range" id="rh" min="0" max="100" value="${Math.round(st.rh * 100)}">
      <div class="readout" id="readout"></div></div>`;
  }
  if (L.shortBtn && st.placed.bottom === 'fuse' && !st.short) {
    h += `<div class="row" style="margin-top:14px;justify-content:flex-start"><button class="btn btn-danger" id="short">⚡ Замкнути накоротко</button></div>`;
  }
  h += `<div class="msg" id="msg"></div><div id="next-wrap"></div>`;
  side.innerHTML = h;
  syncSide(m);

  // Повзунок оновлює лише схему й підписи — сам елемент не перемальовується, тож перетягування не зривається
  const rh = document.getElementById('rh');
  if (rh) rh.oninput = () => {
    st.rh = rh.value / 100; st.rhMoved = true;
    checkDone(model());
    syncSide(drawBoard());
  };
  const sh = document.getElementById('short');
  if (sh) sh.onclick = shortCircuit;
}

// Оновлює змінні частини бічної панелі: покази, повідомлення, кнопку «Далі»
function syncSide(m) {
  const ro = document.getElementById('readout');
  if (ro) ro.innerHTML = `Опір реостата: <b>${Math.round(st.rh * R_RHEO)} Ом</b><br>Струм у колі: <b>${fmt(m.I)} А</b>`;
  const msgEl = document.getElementById('msg');
  msgEl.className = 'msg ' + st.msg.kind;
  msgEl.innerHTML = st.msg.text;
  msgEl.hidden = !st.msg.text;
  const nw = document.getElementById('next-wrap');
  if (st.done && !nw.firstChild) {
    nw.innerHTML = `<div class="row" style="margin-top:14px"><button class="btn" id="next">${lv < LEVELS.length - 1 ? 'Далі →' : 'Завершити'}</button></div>`;
    document.getElementById('next').onclick = () => lv < LEVELS.length - 1 ? loadLevel(lv + 1) : finish();
  }
}

function checkDone(m) {
  const L = LEVELS[lv];
  if (st.done || !L.goal(m)) return;
  st.done = true;
  st.msg = { text: L.done, kind: 'ok' };
}

// Після будь-якої дії на вже пройденому рівні — пояснюємо, що зараз відбувається
function refreshStatus(m) {
  const L = LEVELS[lv];
  if (!st.done) return checkDone(m);
  const s = L.status ? L.status(m) : (m.I > 0 ? null : SWITCH_OFF);
  st.msg = s ? { text: s, kind: '' } : { text: L.done, kind: 'ok' };
}

/* ---------- Дії гравця ---------- */
function placePart(id, type) {
  const L = LEVELS[lv];
  if (!type) { st.msg = { text: 'Спочатку вибери елемент у списку, а потім натисни на «?» — або просто перетягни його.', kind: '' }; render(); return; }
  if (type === L.parts[id].slot) {
    st.placed[id] = type;
    if (type === 'switch') st.closed = false;
    if (type === 'diode') st.diodeFwd = false;
    const after = L.afterPlace && L.afterPlace[type];
    const swOpen = !after && allPlaced() && !st.closed ? ' Але ключ розімкнений — натисни на нього, щоб замкнути коло.' : '';
    st.msg = { text: after || `Так! ${NAMES[type]} на своєму місці.${swOpen}`, kind: 'ok' };
  } else {
    mistakes++;
    document.getElementById('s-err').textContent = mistakes;
    const w = (L.wrong[id] && L.wrong[id][type]) || `${NAMES[type]} сюди не підходить. Подумай ще!`;
    st.msg = { text: w, kind: 'err' };
  }
  st.sel = null;
  checkDone(model());
  render();
}

function interact(id, type) {
  const L = LEVELS[lv];
  if (type === 'sw3') return toggleSw3();
  if (type === 'switch') st.closed = !st.closed;
  else if (type === 'lamp' && L.lampToggle) {
    if (!allPlaced()) { st.msg = { text: 'Спочатку заповни порожнє місце на схемі.', kind: '' }; render(); return; }
    st.out[id] = !st.out[id];
  } else if (type === 'diode' && L.diodeFlip) st.diodeFwd = !st.diodeFwd;
  else return;
  if (st.blown) { st.msg = { text: 'Запобіжник перегорів — коло розірване. Щоб лампа знову світила, його треба замінити.', kind: '' }; render(); return; }
  refreshStatus(model());
  render();
}

/* ---------- Конденсатор: заряд і розряд з плавною анімацією ---------- */
function toggleSw3() {
  st.sw = st.sw === 'A' ? 'B' : 'A';
  if (st.sw === 'A') {
    st.msg = { text: 'Конденсатор з\'єднаний з батарейкою. Стеж за жовтими рисками й показником заряду.', kind: '' };
  } else if (st.q > 0.3) {
    st.flash = true;
    st.msg = { text: 'Конденсатор з\'єднаний з лампою — дивись!', kind: '' };
  } else {
    st.msg = { text: 'Конденсатор ще не заряджений — лампі нічого віддати. Спершу з\'єднай його з батарейкою.', kind: '' };
  }
  render();
  if (!anim) { lastT = performance.now(); anim = requestAnimationFrame(step); }
}

// Заряд — за ~4 с, розряд — за ~4 с: достатньо повільно, щоб устигнути роздивитися
function step(t) {
  anim = 0;
  if (!LEVELS[lv].sw3) return;
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  let moving = false;
  if (st.sw === 'A' && st.q < 1) { st.q += (1 - st.q) * dt / 1.1; if (st.q > 0.995) st.q = 1; moving = true; }
  if (st.sw === 'B' && st.q > 0) { st.q *= Math.exp(-dt / 1.4); if (st.q < 0.01) st.q = 0; moving = true; }
  if (st.sw === 'B' && st.flash && st.q < 0.05 && !st.done) {
    st.flashed = true;
    checkDone(model());
    render();
  } else updateBoard();
  if (moving) anim = requestAnimationFrame(step);
}

function shortCircuit() {
  if (!(model().I > 0)) { st.msg = { text: 'Спочатку замкни ключ — лампа має світити.', kind: '' }; render(); return; }
  const level = lv;
  st.short = true;
  st.msg = { text: 'Дріт з\'єднав виводи лампи — струм пішов в обхід неї і став дуже великим! Лампа згасла. Дивись на запобіжник…', kind: 'err' };
  render();
  // 3 секунди, щоб устигнути побачити струм в обхід лампи й розжарений запобіжник
  setTimeout(() => {
    if (lv !== level) return;
    st.blown = true;
    checkDone(model());
    render();
  }, 3000);
}

side.addEventListener('click', e => {
  if (performance.now() - dragEnd < 300) return;
  const b = e.target.closest('[data-part]');
  if (!b) return;
  st.sel = st.sel === b.dataset.part ? null : b.dataset.part;
  render();
});

board.addEventListener('click', e => {
  if (performance.now() - dragEnd < 300) return;
  const slot = e.target.closest('[data-slot]');
  if (slot) return placePart(slot.dataset.slot, st.sel);
  const c = e.target.closest('[data-id]');
  if (c) interact(c.dataset.id, c.dataset.type);
});

/* ---------- Перетягування деталі з панелі на «?» (мишкою або пальцем) ---------- */
side.addEventListener('pointerdown', e => {
  const b = e.target.closest('.part[data-part]');
  if (!b || e.button > 0 || b.classList.contains('used')) return;
  const type = b.dataset.part, sx = e.clientX, sy = e.clientY;
  let ghost = null, over = null, offX = 0, offY = 0, lx = sx, ly = sy, raf = 0;

  const hitTest = () => {
    raf = 0;
    const t = document.elementFromPoint(lx, ly);
    const s = t && t.closest('[data-slot]');
    if (s !== over) {
      if (over) over.classList.remove('over');
      over = s;
      if (over) over.classList.add('over');
    }
  };
  const move = ev => {
    if (!ghost) {
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; // ще не тягнемо — це може бути клік
      const r = b.getBoundingClientRect();
      offX = sx - r.left; offY = sy - r.top;
      ghost = b.cloneNode(true);
      ghost.classList.remove('sel');
      ghost.classList.add('part-ghost');
      ghost.style.width = r.width + 'px';
      document.body.appendChild(ghost);
      b.classList.add('dragging');
      document.body.classList.add('is-dragging');
    }
    lx = ev.clientX; ly = ev.clientY;
    ghost.style.transform = `translate3d(${lx - offX}px, ${ly - offY}px, 0) rotate(-3deg)`;
    if (!raf) raf = requestAnimationFrame(hitTest);
  };
  const up = () => {
    b.removeEventListener('pointermove', move);
    b.removeEventListener('pointerup', up);
    b.removeEventListener('pointercancel', up);
    if (!ghost) return; // не тягнули — спрацює звичайний клік
    if (raf) { cancelAnimationFrame(raf); hitTest(); }
    dragEnd = performance.now();
    ghost.remove();
    b.classList.remove('dragging');
    document.body.classList.remove('is-dragging');
    if (over) { over.classList.remove('over'); placePart(over.dataset.slot, type); }
  };

  b.setPointerCapture(e.pointerId);
  b.addEventListener('pointermove', move);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
});

function finish() {
  const stars = mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1; // до 3 блискавок
  saveStars('circuit', stars);
  showResult({
    stars, game: 'circuit',
    title: 'Усі схеми зібрано!',
    text: `Помилок: ${mistakes}. Ти зібрав коло, виміряв струм і напругу, порівняв послідовне й паралельне з'єднання, приборкав діод, побачив, як запобіжник рятує від пожежі, дізнався, чому конденсатор пропускає лише змінний струм, і зарядив його від батарейки. Саме це щодня роблять електрики!`,
    again: startGame
  });
}

startGame();
