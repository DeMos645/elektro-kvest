/* Рисунки елементів (ілюстрації) та умовні позначення (символи на схемах).
   Усе намальовано в SVG — працює без інтернету. */

const NAMES = {
  battery: 'Джерело живлення',
  lamp: 'Лампа розжарювання',
  switch: 'Ключ (вимикач)',
  resistor: 'Резистор',
  rheostat: 'Реостат',
  capacitor: 'Конденсатор',
  coil: 'Котушка',
  ammeter: 'Амперметр',
  voltmeter: 'Вольтметр',
  fuse: 'Запобіжник',
  led: 'Світлодіод',
  transformer: 'Трансформатор',
  diode: 'Діод',
  motor: 'Електродвигун',
  wires: "З'єднувальні дроти",
  electromagnet: 'Електромагніт',
  junction: "З'єднання проводів",
  ac: 'Джерело змінного струму'
};

const FACTS = {
  battery: 'Створює напругу в колі. Без джерела живлення струм не тече.',
  lamp: 'Струм розжарює тонку вольфрамову нитку понад 2000 °C — і вона світиться.',
  switch: 'Замикає і розмикає коло. Розімкнене коло — струму немає.',
  resistor: 'Має сталий опір і обмежує силу струму в колі.',
  rheostat: 'Змінний опір: рухаючи повзунок, регулюють силу струму в колі.',
  capacitor: 'Накопичує електричний заряд. Постійний струм не пропускає, а змінний — пропускає.',
  coil: 'Провід, намотаний витками. Коли через неї тече струм, навколо виникає магнітне поле.',
  ammeter: 'Вимірює силу струму в амперах. Вмикається в коло послідовно.',
  voltmeter: 'Вимірює напругу у вольтах. Вмикається паралельно ділянці кола.',
  fuse: 'При надмірному струмі перегорає й розриває коло — захищає від пожежі.',
  led: 'Світиться, коли через нього тече струм у прямому напрямку. В інший бік струм не пропускає.',
  transformer: 'Підвищує або знижує змінну напругу. Працює завдяки електромагнітній індукції.',
  diode: 'Пропускає струм лише в одному напрямку.',
  motor: 'Перетворює електричну енергію на механічну — обертання.',
  wires: "З'єднують елементи кола між собою. Усередині — мідний провід, зовні — ізоляція.",
  electromagnet: 'Котушка із залізним осердям. Поки тече струм — притягує залізні предмети, вимкнеш струм — відпускає.'
};

/* Факти для гри «Умовні позначення»: як запам'ятати сам знак */
const SYM_FACTS = {
  battery: 'Довга тонка риска — «+», коротка товста — «–». Риски різні — цим він відрізняється від конденсатора.',
  lamp: 'Коло з хрестиком. Не плутай з амперметром і вольтметром — у них у колі буква.',
  switch: 'Риска відведена вбік — коло розімкнене. Коли ключ замкнуть, риска ляже на лінію.',
  resistor: 'Порожній прямокутник. Якщо крізь нього проходить лінія — це запобіжник, а якщо є стрілка — реостат.',
  rheostat: 'Прямокутник резистора і стрілка — це повзунок, який рухається вздовж нього й змінює опір.',
  capacitor: 'Дві однакові пластини з проміжком. У джерела живлення риски різні, а тут — однакові.',
  coil: 'Півкола — це витки дроту, як на справжній котушці.',
  ammeter: 'Буква A в колі — від «ампер». На схемах амперметр вмикають послідовно.',
  voltmeter: 'Буква V в колі — від «вольт». На схемах вольтметр приєднують паралельно ділянці кола.',
  fuse: 'Лінія проходить крізь прямокутник — це тонкий дріт, який перегорить при надмірному струмі.',
  diode: 'Трикутник показує, куди діод пропускає струм, а риска — «стоп» для зворотного напрямку. Якщо поруч стрілки — це вже світлодіод.',
  motor: 'Коло з буквою M. M — від латинського motor, «той, що приводить у рух». Двигун перетворює електричну енергію на механічну.',
  led: 'Знак діода зі стрілками назовні. Стрілки — це світло, яке він випромінює.',
  transformer: 'Дві котушки, а між ними риски — спільне залізне осердя.',
  junction: "Жирна крапка — дроти з'єднані. Якщо лінії просто перетинаються без крапки — з'єднання немає."
};

/* ---------- Умовні позначення: viewBox 0 0 80 40, виводи на y=20 по краях ---------- */
function symInner(key, opt = {}) {
  const L = (a, b) => `<line x1="${a}" y1="20" x2="${b}" y2="20"/>`;
  const leads = (a, b) => L(0, a) + L(b, 80);
  const meter = (ch) => leads(24, 56) + `<circle cx="40" cy="20" r="16"/>` +
    `<text ${opt.rot ? `transform="rotate(${-opt.rot} 40 20)"` : ''} x="40" y="26.5" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor" stroke="none" font-family="Arial, sans-serif">${ch}</text>`;
  switch (key) {
    case 'battery':
      return leads(35, 45) + `<line x1="35" y1="5" x2="35" y2="35"/>` +
        `<line x1="45" y1="12" x2="45" y2="28" stroke-width="6" stroke-linecap="butt"/>` +
        `<text x="27" y="10" font-size="11" fill="currentColor" stroke="none" font-family="Arial">+</text>`;
    case 'lamp':
      return (opt.glow != null ? `<circle cx="40" cy="20" r="15" fill="#ffd84d" stroke="none" opacity="${opt.glow}"/>` : '') +
        leads(24, 56) + `<circle cx="40" cy="20" r="16"/>` +
        `<line x1="28.7" y1="8.7" x2="51.3" y2="31.3"/><line x1="28.7" y1="31.3" x2="51.3" y2="8.7"/>`;
    case 'switch':
      return leads(24, 56) + `<circle cx="24" cy="20" r="2.6" fill="currentColor"/><circle cx="56" cy="20" r="2.6" fill="currentColor"/>` +
        (opt.closed === true ? `<line x1="24" y1="20" x2="56" y2="20"/>` : `<line x1="24" y1="20" x2="53" y2="3"/>`);
    case 'resistor':
      return leads(20, 60) + `<rect x="20" y="12" width="40" height="16"/>`;
    case 'rheostat':
      // як у шкільному підручнику: стрілка-повзунок притискається до резистора зверху і з'єднана з виводом
      return leads(20, 60) + `<rect x="20" y="12" width="40" height="16"/>` +
        // наконечник без обводки (інакше він «товстий»), вістря — рівно на верхній грані прямокутника
        `<path d="M68 20 V2 H40 V5"/><path d="M40 10.6 L36.6 4.4 H43.4 Z" fill="currentColor" stroke="none"/>`;
    case 'capacitor':
      return leads(36, 44) + `<line x1="36" y1="5" x2="36" y2="35"/><line x1="44" y1="5" x2="44" y2="35"/>`;
    case 'coil':
      return leads(16, 64) + `<path d="M16 20 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0"/>`;
    case 'ac':
      // джерело змінного струму: коло з синусоїдою (синусоїда не повертається разом зі схемою)
      return leads(24, 56) + `<circle cx="40" cy="20" r="16"/>` +
        `<path ${opt.rot ? `transform="rotate(${-opt.rot} 40 20)"` : ''} d="M29 20 q5.5 -11 11 0 t11 0"/>`;
    case 'ammeter': return meter('A');
    case 'voltmeter': return meter('V');
    case 'motor': return meter('M');
    case 'fuse':
      if (opt.blown) // перегорілий: дріт усередині розірваний, на місці розриву — іскра
        return L(0, 34) + L(46, 80) + `<rect x="20" y="13" width="40" height="14"/>` +
          `<path d="M40 7 L42.5 15 L50 13 L44.5 19 L50 25 L42.5 23.5 L40 32 L37.5 23.5 L30 25 L35.5 19 L30 13 L37.5 15 Z" fill="#e5484d" stroke="none"/>`;
      return L(0, 80) + `<rect x="20" y="13" width="40" height="14"/>`;
    case 'diode':
      return leads(28, 50) + `<path d="M28 8 L28 32 L50 20 Z" fill="currentColor"/><line x1="50" y1="8" x2="50" y2="32"/>`;
    case 'led': {
      // діод + дві стрілки назовні (світло)
      const arrow = (x, y) => `<line x1="${x}" y1="${y}" x2="${x + 8}" y2="${y - 8}"/><path d="M${x + 10} ${y - 10} L${x + 3.5} ${y - 7.5} L${x + 7.5} ${y - 3.5} Z" fill="currentColor"/>`;
      return leads(24, 46) + `<path d="M24 8 L24 32 L46 20 Z" fill="currentColor"/><line x1="46" y1="8" x2="46" y2="32"/>` +
        arrow(46, 8) + arrow(54, 13);
    }
    case 'transformer':
      // дві котушки (півкола), між ними — дві риски спільного осердя
      return `<path d="M30 4 a4 4 0 0 1 0 8 a4 4 0 0 1 0 8 a4 4 0 0 1 0 8 a4 4 0 0 1 0 8"/>` +
        `<path d="M50 4 a4 4 0 0 0 0 8 a4 4 0 0 0 0 8 a4 4 0 0 0 0 8 a4 4 0 0 0 0 8"/>` +
        `<line x1="38" y1="2" x2="38" y2="38"/><line x1="42" y1="2" x2="42" y2="38"/>` +
        `<path d="M30 4 H8 M30 36 H8 M50 4 H72 M50 36 H72"/>`;
    case 'junction':
      // з'єднання проводів: лінії перетинаються, жирна крапка — дроти з'єднані
      return L(0, 80) + `<line x1="40" y1="0" x2="40" y2="40"/><circle cx="40" cy="20" r="4.5" fill="currentColor"/>`;
  }
  return '';
}
function symSVG(key, opt) {
  return `<svg viewBox="-4 -4 88 48" class="sym" aria-label="${NAMES[key]}"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${symInner(key, opt)}</g></svg>`;
}

/* ---------- Ілюстрації: viewBox 0 0 120 100 ---------- */
function stripes(x0, x1, step, y, h, w, color) {
  let s = '';
  for (let x = x0; x <= x1; x += step) s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${color}" stroke="#8a4f1c" stroke-width="1"/>`;
  return s;
}
function meterIll(ch, color) {
  return `<rect x="14" y="8" width="92" height="84" rx="9" fill="#eef0f3" stroke="#a0a7b1" stroke-width="2"/>
  <rect x="15" y="70" width="90" height="21" fill="#3a3f47"/>
  <rect x="22" y="15" width="76" height="50" rx="4" fill="#fff" stroke="#c7ccd3"/>
  <path d="M30 52 A34 34 0 0 1 90 52" fill="none" stroke="#333" stroke-width="1.5"/>
  <g stroke="#333" stroke-width="1.5"><line x1="30" y1="52" x2="34" y2="49"/><line x1="40" y1="31" x2="43" y2="35"/><line x1="60" y1="24" x2="60" y2="29"/><line x1="80" y1="31" x2="77" y2="35"/><line x1="90" y1="52" x2="86" y2="49"/></g>
  <text x="44" y="58" font-size="20" font-weight="800" fill="${color}" text-anchor="middle" font-family="Arial">${ch}</text>
  <line x1="62" y1="60" x2="80" y2="30" stroke="#d6332b" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="62" cy="60" r="3.5" fill="#333"/>
  <circle cx="38" cy="81" r="6" fill="#d6332b"/><circle cx="82" cy="81" r="6" fill="#111" stroke="#666"/>`;
}

/* Лабораторний дріт: крива + штекер на кожному кінці (лівий дивиться вліво, правий — вправо) */
function plugWire(d, x1, y1, x2, y2, color, dark) {
  const plug = (x, y, dir) => {
    const bx = dir < 0 ? x : x - 14;           // корпус штекера
    const px = dir < 0 ? x - 6 : x + 0;         // металевий штир
    return `<rect x="${px}" y="${y - 2}" width="6" height="4" rx="1.5" fill="#c9ced6"/>
      <rect x="${bx}" y="${y - 5}" width="14" height="10" rx="3" fill="${color}" stroke="${dark}" stroke-width="1"/>`;
  };
  return `<path d="${d}" fill="none" stroke="${dark}" stroke-width="5" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    ${plug(x1, y1, -1)}${plug(x2 + 14, y2, 1)}`;
}

const ILL = {
  /* Батарейка (пальчикова): «–» зліва на плоскому кінці, «+» справа біля виступу */
  battery: `<path d="M104 43.5 H108 a2.5 2.5 0 0 1 2.5 2.5 V54 a2.5 2.5 0 0 1 -2.5 2.5 H104 Z" fill="#c9ced6" stroke="#9aa1aa" stroke-width=".8"/>
    <rect x="8" y="36" width="97" height="28" rx="5" fill="#262b33"/>
    <path d="M78 36 H100 a5 5 0 0 1 5 5 V59 a5 5 0 0 1 -5 5 H78 Z" fill="#f2b42c"/>
    <path d="M8 41 a5 5 0 0 1 5 -5 h1.5 V64 H13 a5 5 0 0 1 -5 -5 Z" fill="#b9bec6"/>
    <line x1="78" y1="36" x2="78" y2="64" stroke="#c98f12" stroke-width="1"/>
    <rect x="15" y="37.5" width="84" height="2.5" rx="1.25" fill="#fff" opacity=".25"/>
    <rect x="15" y="60.5" width="84" height="2.5" rx="1.25" fill="#000" opacity=".18"/>
    <text x="46" y="55" fill="#fff" font-size="14" font-weight="800" text-anchor="middle" font-family="Arial">1,5 В</text>
    <text x="91.5" y="57.5" fill="#262b33" font-size="20" font-weight="900" text-anchor="middle" font-family="Arial">+</text>
    <text x="11" y="32" fill="#2563c9" font-size="17" font-weight="900" text-anchor="middle" font-family="Arial">–</text>
    <text x="107" y="32.5" fill="#d6332b" font-size="17" font-weight="900" text-anchor="middle" font-family="Arial">+</text>`,
  lamp: `<circle cx="60" cy="36" r="34" fill="#ffe680" opacity=".35"/>
    <path d="M60 8 A28 28 0 0 1 76 59 V68 H44 V59 A28 28 0 0 1 60 8 Z" fill="#fff4bf" stroke="#d8b44a" stroke-width="2"/>
    <path d="M54 62 V44 M66 62 V44" stroke="#8a8f96" stroke-width="1.5"/>
    <path d="M54 44 l3 -6 l3 6 l3 -6 l3 6" fill="none" stroke="#e8892b" stroke-width="2.2"/>
    <rect x="44" y="68" width="32" height="18" rx="3" fill="#b9bec6"/>
    <line x1="44" y1="74" x2="76" y2="76" stroke="#8a9099" stroke-width="2"/><line x1="44" y1="80" x2="76" y2="82" stroke="#8a9099" stroke-width="2"/>
    <path d="M54 86 h12 l-3 6 h-6z" fill="#555"/>`,
  switch: `<rect x="8" y="70" width="104" height="16" rx="4" fill="#3c7fb6"/>
    <rect x="8" y="80" width="104" height="6" rx="3" fill="#2d6595"/>
    <rect x="22" y="58" width="12" height="14" fill="#c99a2e"/><rect x="86" y="56" width="12" height="16" fill="#c99a2e"/>
    <rect x="88" y="52" width="3" height="8" fill="#a77e1f"/><rect x="93" y="52" width="3" height="8" fill="#a77e1f"/>
    <line x1="28" y1="62" x2="82" y2="28" stroke="#d9ad3c" stroke-width="7" stroke-linecap="round"/>
    <line x1="80" y1="29" x2="96" y2="19" stroke="#222" stroke-width="10" stroke-linecap="round"/>
    <circle cx="28" cy="62" r="4" fill="#7a5a14"/>`,
  resistor: `<line x1="4" y1="50" x2="116" y2="50" stroke="#9aa1aa" stroke-width="4" stroke-linecap="round"/>
    <rect x="30" y="36" width="60" height="28" rx="12" fill="#e9c99a"/>
    <rect x="40" y="36" width="6" height="28" fill="#7b4a1e"/><rect x="51" y="36" width="6" height="28" fill="#111"/>
    <rect x="62" y="36" width="6" height="28" fill="#d6332b"/><rect x="75" y="36" width="5" height="28" fill="#d4a72c"/>`,
  rheostat: `<rect x="8" y="30" width="9" height="54" rx="2" fill="#555"/><rect x="103" y="30" width="9" height="54" rx="2" fill="#555"/>
    <rect x="17" y="54" width="86" height="26" rx="6" fill="#efe9da"/>
    ${Array.from({ length: 20 }, (_, i) => `<line x1="${21 + i * 4}" y1="54" x2="${21 + i * 4}" y2="80" stroke="#a9773f" stroke-width="1.6"/>`).join('')}
    <line x1="17" y1="38" x2="103" y2="38" stroke="#9aa1aa" stroke-width="4"/>
    <rect x="56" y="31" width="16" height="27" rx="3" fill="#2b2f36"/>
    <rect x="60" y="22" width="8" height="11" rx="2" fill="#d6332b"/>`,
  capacitor: `<line x1="52" y1="76" x2="52" y2="96" stroke="#9aa1aa" stroke-width="3"/><line x1="68" y1="76" x2="68" y2="90" stroke="#9aa1aa" stroke-width="3"/>
    <rect x="38" y="14" width="44" height="66" rx="8" fill="#2c5aa0"/>
    <rect x="68" y="16" width="9" height="62" fill="#c9d6ea"/>
    <text x="72.5" y="44" font-size="12" fill="#2c5aa0" text-anchor="middle" font-weight="900" font-family="Arial">–</text>
    <text x="72.5" y="60" font-size="12" fill="#2c5aa0" text-anchor="middle" font-weight="900" font-family="Arial">–</text>
    <ellipse cx="60" cy="16" rx="21" ry="4" fill="#b8c2cf"/>`,
  /* Котушка: мідний провід, намотаний витками на каркас, на підставці з двома клемами */
  coil: `<rect x="8" y="80" width="104" height="12" rx="4" fill="#3c7fb6"/>
    <rect x="8" y="87" width="104" height="5" rx="2.5" fill="#2d6595"/>
    <path d="M24 70 L24 80 M96 70 L96 80" stroke="#3a3f47" stroke-width="6"/>
    <ellipse cx="24" cy="46" rx="7" ry="28" fill="#3a3f47"/>
    <rect x="24" y="26" width="72" height="40" fill="#a85a22"/>
    ${Array.from({ length: 13 }, (_, i) => `<path d="M${28 + i * 5.3} 26 q 3.2 20 0 40" fill="none" stroke="#e8a060" stroke-width="2.6" stroke-linecap="round"/>`).join('')}
    <rect x="24" y="28" width="72" height="5" fill="#fff" opacity=".2"/>
    <ellipse cx="96" cy="46" rx="7" ry="28" fill="#4a505a"/>
    <ellipse cx="96" cy="46" rx="2.5" ry="9" fill="#2a2e35"/>
    <path d="M28 26 C 24 14, 16 12, 14 20 V80" fill="none" stroke="#cd7f35" stroke-width="2.2"/>
    <path d="M92 66 C 104 66, 106 70, 106 80" fill="none" stroke="#cd7f35" stroke-width="2.2"/>
    <circle cx="14" cy="84" r="5" fill="#d6332b"/><circle cx="106" cy="84" r="5" fill="#111" stroke="#666"/>`,
  ammeter: meterIll('A', '#c0392b'),
  voltmeter: meterIll('V', '#1e5fae'),
  fuse: `<line x1="2" y1="50" x2="14" y2="50" stroke="#9aa1aa" stroke-width="3"/><line x1="106" y1="50" x2="118" y2="50" stroke="#9aa1aa" stroke-width="3"/>
    <rect x="26" y="38" width="68" height="24" rx="4" fill="#d6ecfa" stroke="#8fb3cc" stroke-width="2"/>
    <path d="M28 50 C45 44 55 56 70 48 S85 52 92 50" fill="none" stroke="#7d8590" stroke-width="1.5"/>
    <rect x="12" y="35" width="18" height="30" rx="4" fill="#c4c9d0"/><rect x="90" y="35" width="18" height="30" rx="4" fill="#c4c9d0"/>
    <rect x="30" y="41" width="60" height="4" rx="2" fill="#fff" opacity=".7"/>`,
  led: `<circle cx="60" cy="36" r="30" fill="#ff6b6b" opacity=".18"/>
    <line x1="52" y1="62" x2="52" y2="96" stroke="#9aa1aa" stroke-width="3"/><line x1="68" y1="62" x2="68" y2="88" stroke="#9aa1aa" stroke-width="3"/>
    <path d="M44 62 V34 a16 16 0 0 1 32 0 V62 Z" fill="#ff4d4d"/>
    <rect x="40" y="58" width="40" height="7" rx="2" fill="#d93636"/>
    <ellipse cx="53" cy="34" rx="4" ry="9" fill="#fff" opacity=".5"/>`,
  /* Трансформатор: замкнене залізне осердя, дві котушки з різною кількістю витків.
     Підписи показують головне — напруга на вході й виході різна. */
  transformer: `<rect x="34" y="12" width="52" height="66" fill="none" stroke="#8b9098" stroke-width="12"/>
    <rect x="28" y="6" width="64" height="78" fill="none" stroke="#a7adb5" stroke-width="1"/>
    <rect x="40" y="18" width="40" height="54" fill="none" stroke="#6f757e" stroke-width="1"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="21" y="${17 + i * 6}" width="26" height="5" rx="2.5" fill="#cd7f35" stroke="#8a4f1c" stroke-width=".8"/>`).join('')}
    ${Array.from({ length: 4 }, (_, i) => `<rect x="73" y="${30 + i * 8}" width="26" height="7" rx="3.5" fill="#cd7f35" stroke="#8a4f1c" stroke-width=".8"/>`).join('')}
    <path d="M22 19 H6 M22 67 H6" stroke="#cd7f35" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M98 33 H114 M98 57 H114" stroke="#cd7f35" stroke-width="2.4" stroke-linecap="round"/>
    <text x="14" y="97" font-size="11" font-weight="800" fill="#d6332b" text-anchor="middle" font-family="Arial">230 В</text>
    <text x="106" y="97" font-size="11" font-weight="800" fill="#2563c9" text-anchor="middle" font-family="Arial">12 В</text>`,

  /* З'єднувальні дроти: два лабораторні дроти зі штекерами на кінцях */
  wires: `${plugWire('M20 30 C 52 -4, 66 98, 98 64', 6, 30, 98, 64, '#d6332b', '#a1231d')}
    ${plugWire('M20 70 C 48 102, 70 4, 98 30', 6, 70, 98, 30, '#2f6fd0', '#1f4f99')}`,

  /* Електромагніт: підковоподібне осердя з котушками, що притягує цвяхи */
  electromagnet: `<path d="M34 78 V44 A26 26 0 0 1 86 44 V78" fill="none" stroke="#8b9098" stroke-width="14"/>
    <path d="M34 78 V44 A26 26 0 0 1 86 44 V78" fill="none" stroke="#b9bec6" stroke-width="3" transform="translate(-3,0)" opacity=".6"/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="23" y="${44 + i * 5.4}" width="22" height="4.6" rx="2.3" fill="#cd7f35" stroke="#8a4f1c" stroke-width=".7"/><rect x="75" y="${44 + i * 5.4}" width="22" height="4.6" rx="2.3" fill="#cd7f35" stroke="#8a4f1c" stroke-width=".7"/>`).join('')}
    <path d="M45 46 C 54 40, 66 40, 75 46" fill="none" stroke="#cd7f35" stroke-width="2"/>
    <path d="M23 46 C 10 44, 8 30, 14 22 M97 46 C 110 44, 112 30, 106 22" fill="none" stroke="#cd7f35" stroke-width="2"/>
    <circle cx="14" cy="20" r="4" fill="#d6332b"/><circle cx="106" cy="20" r="4" fill="#111" stroke="#666"/>
    <g stroke="#6b7079" stroke-width="3" stroke-linecap="round">
      <line x1="30" y1="81" x2="26" y2="97"/><line x1="38" y1="81" x2="41" y2="96"/>
      <line x1="82" y1="81" x2="79" y2="96"/><line x1="90" y1="81" x2="95" y2="97"/></g>
    <g fill="#6b7079"><rect x="26" y="79" width="8" height="3" rx="1"/><rect x="35" y="79" width="7" height="3" rx="1"/>
      <rect x="78" y="79" width="8" height="3" rx="1"/><rect x="87" y="79" width="7" height="3" rx="1"/></g>`
};
function illSVG(key) {
  return `<svg viewBox="0 0 120 100" class="ill" aria-label="${NAMES[key]}">${ILL[key]}</svg>`;
}
