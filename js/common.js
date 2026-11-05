/* Спільні функції: збереження прогресу, перемішування, вікно результату, конфеті */

const STORE_KEY = 'elektro_kvest_progress';

/* Нагорода — блискавки. Чим складніша гра, тим більше блискавок можна здобути.
   Разом 12 — як шкільна оцінка. Порядок — від легкої гри до складної. */
const GAME_LIST = [
  { id: 'match_elements', href: 'match.html?set=elements', title: 'Знайди пару', max: 2 },
  { id: 'match_symbols', href: 'match.html?set=symbols', title: 'Умовні позначення', max: 3 },
  { id: 'circuit', href: 'circuit.html', title: 'Збери коло', max: 3 },
  { id: 'quiz', href: 'quiz.html', title: 'Хто хоче стати електриком?', max: 4 }
];
const MAX_TOTAL = GAME_LIST.reduce((s, g) => s + g.max, 0); // 12
const gameMax = id => (GAME_LIST.find(g => g.id === id) || { max: 3 }).max;

function loadProgress() {
  let p = {};
  try { p = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { /* порожньо */ }
  for (const k in p) p[k] = Math.min(p[k], gameMax(k)); // старі результати (зі зірками) не перевищують нового максимуму
  return p;
}
function saveStars(game, stars) {
  try {
    const p = loadProgress();
    if (!p[game] || p[game] < stars) p[game] = stars;
    localStorage.setItem(STORE_KEY, JSON.stringify(p));
  } catch (e) { /* без збереження — не страшно */ }
}
const totalBolts = () => Object.values(loadProgress()).reduce((s, n) => s + n, 0);
/* Гравець: ім'я та дані для сертифіката (зберігаються лише в цьому браузері) */
const PLAYER_KEY = 'elektro_kvest_player';
function loadPlayer() {
  try { return JSON.parse(localStorage.getItem(PLAYER_KEY)) || null; } catch (e) { return null; }
}
function savePlayer(p) {
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); } catch (e) { /* без збереження */ }
}
/* ---------- Перевірка даних для сертифіката ----------
   Не дає вписати лайку, образи чи «абракадабру». Ловить і хитрощі:
   латинські літери замість кириличних (xyй), цифри (п1зд), пробіли й крапки між літерами (х.у.й). */

// Корені, які шукаємо будь-де в тексті (навіть склеєному без пробілів)
const BAD_ANY = ['хуй', 'хуе', 'хуё', 'хуя', 'хуї', 'пизд', 'пізд', 'бляд', 'блят', 'ебат', 'ебан', 'ебал', 'ебуч', 'єбан', 'єбат',
  'уеб', 'уёб', 'уєб', 'заеб', 'заєб', 'наеб', 'наєб', 'выеб', 'виеб', 'виєб', 'долбо', 'мудак', 'мудил', 'гандон', 'гондон',
  'залуп', 'шлюх', 'курва', 'сучар', 'педик', 'підор', 'пидор', 'підар', 'пидар', 'дроч', 'порн', 'нацис', 'сран', 'срак', 'засер', 'обсер', 'гитлер', 'гітлер',
  // транслітом латиницею
  'fuck', 'shit', 'bitch', 'cunt', 'porn', 'huy', 'hui', 'xuy', 'xui', 'pizd', 'blya', 'blyat', 'eban', 'ebat', 'nahui', 'nahuy', 'pidor', 'mudak'];
// Слова, які перевіряємо лише на початку слова (щоб не зачепити справжні прізвища й назви на кшталт «Лохвиця» чи «Козел»)
const BAD_WORD = ['бля', 'еба', 'ебл', 'єба', 'ёб', 'сука', 'суки', 'сучк', 'лошар', 'дебіл', 'дебил', 'даун', 'дурак', 'дурень', 'ідіот', 'идиот',
  'придур', 'тупий', 'тупой', 'тупая', 'урод', 'чмо', 'жоп', 'дупа', 'срак', 'говн', 'секс', 'sex', 'suka', 'dick', 'xxx', 'какашк', 'мразь', 'тварь', 'тварюк'];
const LOOKALIKE = { a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', i: 'і', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у', '0': 'о', '3': 'з', '1': 'і', '@': 'а', '$': 'с' };

function normalizeForCheck(s) {
  const low = s.toLowerCase().replace(/ё/g, 'е');
  const cyr = low.replace(/[a-z0-9@$]/g, ch => LOOKALIKE[ch] || ch); // латиниця й цифри → схожі кириличні
  return { low, cyr, glued: cyr.replace(/[^a-zа-яіїєґ]/g, '') };     // склеєно без пробілів і розділових знаків
}
function hasBadWords(s) {
  const { low, cyr, glued } = normalizeForCheck(s);
  const latin = low.replace(/[^a-z]/g, '');
  if (BAD_ANY.some(w => glued.includes(w) || latin.includes(w))) return true;
  const words = (cyr + ' ' + low).split(/[^a-zа-яіїєґ]+/).filter(Boolean);
  return words.some(w => BAD_WORD.some(b => w.startsWith(b)));
}

// Повертає текст помилки або '' якщо все гаразд. kind: name | school | grade | city
function checkField(kind, raw) {
  const v = (raw || '').trim().replace(/\s+/g, ' ');
  const optional = kind !== 'name';
  if (!v) return optional ? '' : 'Впиши своє ім\'я.';
  if (hasBadWords(v)) return 'Тут є неприйнятні слова. Впиши, будь ласка, справжні дані.';
  if (/(.)\1{3,}/i.test(v.replace(/\s/g, ''))) return 'Схоже на випадковий набір символів.';
  if (kind === 'name') {
    if (!/^[A-Za-zА-Яа-яІіЇїЄєҐґЁё' ʼ-]+$/.test(v)) return 'Ім\'я може містити лише літери, пробіл, дефіс та апостроф.';
    const words = v.split(' ');
    if (words.length > 3) return 'Забагато слів — достатньо імені та прізвища.';
    if (words.some(w => w.replace(/['ʼ-]/g, '').length < 2)) return 'Кожне слово має містити щонайменше 2 літери.';
    if (v.length > 40) return 'Занадто довге ім\'я.';
    if (!/[аеєиіїоуюяёыэaeiouy]/i.test(v)) return 'Схоже на випадковий набір літер.';
  }
  if (kind === 'city') {
    if (!/^[A-Za-zА-Яа-яІіЇїЄєҐґЁё' ʼ.-]+$/.test(v)) return 'Назва міста — лише літери, пробіл і дефіс.';
    if (v.replace(/[^A-Za-zА-Яа-яІіЇїЄєҐґ]/g, '').length < 2) return 'Занадто коротка назва міста.';
  }
  if (kind === 'school') {
    if (!/^[A-Za-zА-Яа-яІіЇїЄєҐґЁё0-9№"«»'ʼ.,() -]+$/.test(v)) return 'У назві навчального закладу є недопустимі символи.';
    if (v.replace(/[^A-Za-zА-Яа-яІіЇїЄєҐґ]/g, '').length < 3) return 'Впиши назву навчального закладу, наприклад «Ліцей № 5» або «КНУ».';
  }
  if (kind === 'grade') {
    // клас 1–11 (з літерою чи без, можна дописати «клас») або курс 1–6 (для коледжів і університетів)
    const cls = /^(1[01]?|[2-9])(\s?-?\s?[А-ЯІЄЇа-яієїA-Za-z])?(\s?клас)?$/i;
    const course = /^[1-6]\s?(-?\s?(й|ий))?\s?курс$/i;
    if (!cls.test(v) && !course.test(v)) return 'Напиши клас (наприклад 7, 9-А, 11Б) або курс (наприклад 2 курс).';
  }
  return '';
}
// Охайний запис: «9-а» → «9-А», «9а клас» → «9А клас», «2 КУРС» → «2 курс»
function tidyGrade(v) {
  if (!v) return '';
  if (/курс/i.test(v)) return v.toLowerCase();
  return v.replace(/клас/i, '').trim().toUpperCase() + (/клас/i.test(v) ? ' клас' : '');
}
// Як показати клас/курс на сертифікаті: «9-А» → «9-А клас», «2 курс» → як є
function gradeLabel(v) {
  if (!v) return '';
  return /курс|клас/i.test(v) ? v : v + ' клас';
}
/* Здогадка про стать за ім'ям — лише для початкового вибору перемикача «Учень / Учениця».
   Більшість жіночих імен закінчується на -а/-я, але є чоловічі винятки (Микола, Микита, Ілля…). */
const MALE_A = ['микола', 'микита', 'ілля', 'илья', 'никита', 'николя', 'сава', 'савва', 'лука', 'кузьма', 'фома', 'хома', 'данила', 'гаврила',
  'юзя', 'захара', 'омеля', 'саша', 'женя', 'міша', 'миша', 'вова', 'діма', 'дима', 'петя', 'коля', 'толя', 'паша', 'гоша', 'ваня', 'сеня', 'стьопа', 'льоша', 'леша', 'юра'];
const FEMALE_OTHER = ['любов', 'любовь', 'нінель', 'адель', 'ассоль', 'ізабель', 'рут', 'естер'];
function guessGender(name) {
  const first = (name || '').trim().split(/\s+/)[0].toLowerCase().replace(/ʼ/g, "'");
  if (!first) return '';
  if (MALE_A.includes(first)) return 'm';
  if (FEMALE_OTHER.includes(first)) return 'f';
  return /[ая]$/.test(first) ? 'f' : 'm';
}

// Приводимо до охайного вигляду: «олена коваль» → «Олена Коваль»
function tidyName(v) {
  return v.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Новий гравець: стираємо зірки та дані попереднього
function resetAll() {
  try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(PLAYER_KEY); } catch (e) { /* нічого */ }
}

// Ряд блискавок: n здобутих із total можливих (векторна іконка — однакова всюди)
const BOLT_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 1.5 4 13.5h6.2L9 22.5l10.5-12.8h-6.4z"/></svg>';
function starsHTML(n, total = 3) {
  let s = `<span class="bolts" title="${n} з ${total}" aria-label="${n} з ${total} блискавок">`;
  for (let i = 0; i < total; i++) s += `<span class="bolt-ic ${i < n ? 'on' : ''}">${BOLT_SVG}</span>`;
  return s + '</span>';
}
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// Яку гру запропонувати далі: наступну ще не пройдену на максимум (по колу від поточної)
function nextGame(currentId) {
  const p = loadProgress();
  const i = GAME_LIST.findIndex(g => g.id === currentId);
  for (let k = 1; k < GAME_LIST.length; k++) {
    const g = GAME_LIST[(i + k) % GAME_LIST.length];
    if ((p[g.id] || 0) < g.max) return g;
  }
  return null; // усе пройдено на максимум
}

// Вікно результату. game — id гри (для максимуму блискавок і кнопки «Наступна гра»)
function showResult({ stars, title, text, again, game }) {
  const max = gameMax(game);
  const next = nextGame(game);
  const t = document.querySelector('.toast'); if (t) t.classList.remove('show'); // підказка не має перекривати результат
  const allDone = !next;
  const box = el(`<div class="modal-bg"><div class="modal">
    <div class="stars big">${starsHTML(stars, max)}</div>
    <div class="got">${stars} з ${max} ⚡ · усього ${totalBolts()} з ${MAX_TOTAL}</div>
    <h2>${title}</h2><p>${text}</p>
    <div class="row">
      ${next ? `<a class="btn" href="${next.href}">Наступна гра: ${next.title} →</a>`
             : `<a class="btn" href="index.html#cert">🎓 До сертифіката →</a>`}
    </div>
    <div class="row" style="margin-top:10px">
      <button class="btn btn-ghost" id="m-again">↻ Зіграти ще</button>
      <a class="btn btn-ghost" href="index.html#choose">Усі ігри</a>
    </div>
    ${typeof CONFIG !== 'undefined' && CONFIG.admission ? `<a class="admit" href="${CONFIG.admission}" target="_blank" rel="noopener">⚡ Хочеш вчитися на електрика? ${CONFIG.admissionLabel} →</a>` : ''}
    </div></div>`);
  document.body.appendChild(box);
  box.querySelector('#m-again').onclick = () => { box.remove(); again(); };
  if (stars >= Math.ceil(max / 2) || allDone) confetti();
}

function confetti() {
  const colors = ['#ffc533', '#2fb36d', '#3c7fe0', '#e5484d', '#ffffff'];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
    c.style.animationDelay = Math.random() * 0.4 + 's';
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4200);
  }
}

function toast(text, kind = '') {
  let t = document.querySelector('.toast');
  if (!t) { t = el('<div class="toast"></div>'); document.body.appendChild(t); }
  t.className = 'toast show ' + kind;
  t.innerHTML = text;
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 4200);
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}
