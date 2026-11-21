/**
 * Expressions mathématiques : lecture du LaTeX (tel que l'écrit MathLive ou un auteur) et comparaison de
 * deux expressions par évaluation en des points tirés au hasard. Fonctions pures, sans dépendance.
 *
 * Reconnu : nombres (virgule ou point décimal, `{,}`), variables d'une lettre (avec indice : `x_1`), lettres
 * grecques, `\pi`, `e` (constante d'Euler), `+ - \cdot \times / \div`, multiplication implicite (`2x`,
 * `x(x+1)`), puissances `^`, `\frac`, `\dfrac`, `\tfrac` (aussi `\frac12`), `\sqrt`, `\sqrt[n]`, valeur absolue,
 * parenthèses `( ) [ ] \left \right`, fonctions `\sin \cos \tan \ln \log \exp \arcsin \arccos \arctan \sinh
 * \cosh \tanh` (avec ou sans parenthèses : `\sin x`, `\sin^2 x`, `\log_{2}`), `\operatorname{…}`.
 *
 * Deux expressions sont tenues pour égales si elles prennent la même valeur en tous les points tirés où
 * l'attendue est définie (au moins 5). Ce n'est pas une preuve, mais avec des points tirés au hasard,
 * deux expressions différentes ne coïncident pratiquement jamais partout.
 */

export type Expr =
  | { k: 'num'; v: number }
  | { k: 'var'; name: string }
  | { k: 'neg'; a: Expr }
  | { k: 'add'; a: Expr; b: Expr }
  | { k: 'sub'; a: Expr; b: Expr }
  | { k: 'mul'; a: Expr; b: Expr }
  | { k: 'div'; a: Expr; b: Expr }
  | { k: 'pow'; a: Expr; b: Expr }
  | { k: 'fn'; name: string; a: Expr; base?: Expr }
  | { k: 'abs'; a: Expr };

export class ExprError extends Error {}

const MAX_LENGTH = 1000;
const MAX_DEPTH = 60;

const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'ln', 'log', 'exp', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'sqrt']);
const GREEK = new Set([
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta', 'iota', 'kappa',
  'lambda', 'mu', 'nu', 'xi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Sigma', 'Phi', 'Psi', 'Omega',
]);
/** Commandes sans effet sur la valeur : espaces, tailles, styles. */
const IGNORED = new Set([',', ';', ':', '!', ' ', 'quad', 'qquad', 'displaystyle', 'textstyle', 'limits', 'mathrm', 'mathit', 'mathbf', 'mathsf', 'left', 'right', 'big', 'Big', 'bigl', 'bigr', 'Bigl', 'Bigr']);

type Tok =
  | { t: 'num'; v: number }
  | { t: 'id'; name: string } // variable d'une lettre ou grecque
  | { t: 'cmd'; name: string } // \frac, \sqrt, \sin…
  | { t: 'op'; v: string }; // + - * / ^ _ ( ) [ ] { } | !

/** Découpe une source LaTeX en jetons. */
export function tokenize(src: string): Tok[] {
  if (src.length > MAX_LENGTH) throw new ExprError('expression trop longue');
  const out: Tok[] = [];
  let i = 0;
  const s = src.replace(/\{,\}/g, ',');
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c) || c === '&') {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c) || (c === ',' && /[0-9]/.test(s[i + 1] ?? '') && /[0-9]/.test(s[i - 1] ?? ''))) {
      let j = i;
      let seenSep = false;
      while (j < s.length) {
        const d = s[j];
        if (/[0-9]/.test(d)) j++;
        else if ((d === '.' || d === ',') && !seenSep && /[0-9]/.test(s[j + 1] ?? '')) {
          seenSep = true;
          j++;
        } else if (d === '.' && !seenSep && j > i) {
          seenSep = true;
          j++;
        } else break;
      }
      const v = Number(s.slice(i, j).replace(',', '.'));
      if (!Number.isFinite(v)) throw new ExprError(`nombre illisible : ${s.slice(i, j)}`);
      out.push({ t: 'num', v });
      i = j;
      continue;
    }
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
      if (!m) throw new ExprError('commande incomplète');
      const name = m[1];
      i += m[0].length;
      if (name === '{' || name === '}') out.push({ t: 'op', v: name === '{' ? '(' : ')' });
      else if (name === '|' || name === 'vert' || name === 'lvert' || name === 'rvert' || name === 'mid') out.push({ t: 'op', v: '|' });
      else if (name === 'lbrace' || name === 'rbrace') out.push({ t: 'op', v: name === 'lbrace' ? '(' : ')' });
      else if (name === 'cdot' || name === 'times' || name === 'ast') out.push({ t: 'op', v: '*' });
      else if (name === 'div') out.push({ t: 'op', v: '/' });
      else if (IGNORED.has(name)) continue;
      else if (GREEK.has(name)) out.push({ t: 'id', name: '\\' + name });
      else out.push({ t: 'cmd', name });
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      out.push({ t: 'id', name: c });
      i++;
      continue;
    }
    if ('+-*/^_()[]{}|!'.includes(c)) {
      // Les accolades groupent comme des parenthèses.
      out.push({ t: 'op', v: c === '{' ? '(' : c === '}' ? ')' : c });
      i++;
      continue;
    }
    if (c === '−' || c === '–') {
      out.push({ t: 'op', v: '-' });
      i++;
      continue;
    }
    if (c === '×' || c === '·') {
      out.push({ t: 'op', v: '*' });
      i++;
      continue;
    }
    if (c === "'" || c === '′') throw new ExprError('prime non pris en charge');
    throw new ExprError(`caractère inattendu : ${c}`);
  }
  return out;
}

/** Analyse une source LaTeX ; lève `ExprError` si elle n'est pas une expression lisible. */
export function parseExpr(src: string): Expr {
  const toks = tokenize(src);
  let pos = 0;
  let depth = 0;
  const peek = () => toks[pos];
  const isOp = (v: string, tk = peek()) => tk?.t === 'op' && tk.v === v;
  const eat = (v: string) => {
    if (!isOp(v)) throw new ExprError(`« ${v} » attendu`);
    pos++;
  };
  const enter = () => {
    if (++depth > MAX_DEPTH) throw new ExprError('expression trop imbriquée');
  };

  function expr(): Expr {
    enter();
    let left = term();
    while (isOp('+') || isOp('-')) {
      const op = (toks[pos++] as { v: string }).v;
      const right = term();
      left = op === '+' ? { k: 'add', a: left, b: right } : { k: 'sub', a: left, b: right };
    }
    depth--;
    return left;
  }

  /** Un atome peut-il commencer ici (multiplication implicite) ? */
  function startsAtom(): boolean {
    const tk = peek();
    if (!tk) return false;
    if (tk.t === 'num' || tk.t === 'id') return true;
    if (tk.t === 'cmd') return !['right', 'end'].includes(tk.name);
    return tk.v === '(' || tk.v === '[' || (tk.v === '|' && !absOpen);
  }

  let absOpen = 0;

  function term(): Expr {
    let left = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = (toks[pos++] as { v: string }).v;
        const right = unary();
        left = op === '*' ? { k: 'mul', a: left, b: right } : { k: 'div', a: left, b: right };
      } else if (startsAtom()) {
        left = { k: 'mul', a: left, b: power() };
      } else return left;
    }
  }

  function unary(): Expr {
    if (isOp('-')) {
      pos++;
      return { k: 'neg', a: unary() };
    }
    if (isOp('+')) {
      pos++;
      return unary();
    }
    return power();
  }

  function power(): Expr {
    const base = postfix();
    if (isOp('^')) {
      pos++;
      const exp = isOp('-') ? (pos++, { k: 'neg', a: argument() } as Expr) : argument();
      return { k: 'pow', a: base, b: exp };
    }
    return base;
  }

  function postfix(): Expr {
    const a = atom();
    if (isOp('!')) throw new ExprError('factorielle non prise en charge');
    return a;
  }

  /**
   * Argument d'une commande ou d'un exposant : un groupe `{…}`, ou un seul jeton. Comme en LaTeX, un nombre
   * nu n'y compte que pour son premier chiffre : `\frac12` = 1/2, `x^23` = x²·3.
   */
  function argument(): Expr {
    enter();
    const tk = peek();
    let r: Expr;
    if (isOp('(')) {
      pos++;
      r = expr();
      eat(')');
    } else if (tk?.t === 'num') {
      pos++;
      const raw = String(tk.v);
      if (/^\d{2,}$/.test(raw)) {
        toks.splice(pos, 0, { t: 'num', v: Number(raw.slice(1)) });
        r = { k: 'num', v: Number(raw[0]) };
      } else r = { k: 'num', v: tk.v };
    } else r = atom();
    depth--;
    return r;
  }

  function atom(): Expr {
    enter();
    const tk = peek();
    if (!tk) throw new ExprError('expression incomplète');
    let r: Expr;
    if (tk.t === 'num') {
      pos++;
      r = { k: 'num', v: tk.v };
    } else if (tk.t === 'id') {
      pos++;
      let name = tk.name;
      if (isOp('_')) {
        pos++;
        name += '_' + subscript();
      }
      r = name === 'e' ? { k: 'num', v: Math.E } : { k: 'var', name };
    } else if (tk.t === 'op') {
      if (tk.v === '(' || tk.v === '[') {
        pos++;
        r = expr();
        if (isOp(')') || isOp(']')) pos++;
        else throw new ExprError('parenthèse non fermée');
      } else if (tk.v === '|') {
        pos++;
        absOpen++;
        const inner = expr();
        absOpen--;
        eat('|');
        r = { k: 'abs', a: inner };
      } else throw new ExprError(`« ${tk.v} » inattendu`);
    } else r = command(tk.name);
    depth--;
    return r;
  }

  /** Indice d'une variable (`x_1`, `x_{12}`) : gardé comme texte. */
  function subscript(): string {
    const tk = peek();
    if (isOp('(')) {
      const start = pos;
      let level = 0;
      do {
        if (isOp('(')) level++;
        if (isOp(')')) level--;
        pos++;
      } while (level > 0 && pos < toks.length);
      const inner = toks.slice(start + 1, pos - 1);
      // Indice simple (`u_{n}`, `x_{12}`) : même nom que sans accolades.
      return inner.every((x) => x.t === 'num' || x.t === 'id')
        ? inner.map((x) => (x.t === 'num' ? String(x.v) : (x as { name: string }).name)).join('')
        : JSON.stringify(inner);
    }
    pos++;
    if (!tk) throw new ExprError('indice manquant');
    return tk.t === 'num' ? String(tk.v) : tk.t === 'id' ? tk.name : JSON.stringify(tk);
  }

  function command(name: string): Expr {
    pos++;
    if (name === 'frac' || name === 'dfrac' || name === 'tfrac' || name === 'cfrac') {
      const a = argument();
      const b = argument();
      return { k: 'div', a, b };
    }
    if (name === 'sqrt') {
      if (isOp('[')) {
        pos++;
        const n = expr();
        eat(']');
        return { k: 'pow', a: argument(), b: { k: 'div', a: { k: 'num', v: 1 }, b: n } };
      }
      return { k: 'fn', name: 'sqrt', a: argument() };
    }
    if (name === 'pi') return { k: 'num', v: Math.PI };
    if (name === 'exponentialE') return { k: 'num', v: Math.E };
    if (name === 'operatorname') {
      const tk = peek();
      // \operatorname{name} : lettres en jetons séparés.
      if (!isOp('(')) throw new ExprError('\\operatorname attend un nom');
      pos++;
      let fname = '';
      while (peek()?.t === 'id') fname += (toks[pos++] as { name: string }).name;
      eat(')');
      void tk;
      return applyFn(fname);
    }
    if (FUNCTIONS.has(name)) return applyFn(name);
    if (name === 'placeholder') throw new ExprError('case vide');
    if (name === 'infty') throw new ExprError('l’infini n’est pas une valeur');
    throw new ExprError(`commande non prise en charge : \\${name}`);
  }

  /** Fonction appliquée : `\sin(x)`, `\sin x`, `\sin^2 x`, `\log_{2} x`, `\ln|x|`. */
  function applyFn(name: string): Expr {
    if (!FUNCTIONS.has(name)) throw new ExprError(`fonction inconnue : ${name}`);
    let base: Expr | undefined;
    if (isOp('_')) {
      pos++;
      base = argument();
    }
    let exponent: Expr | undefined;
    if (isOp('^')) {
      pos++;
      exponent = isOp('-') ? (pos++, { k: 'neg', a: argument() } as Expr) : argument();
    }
    let arg: Expr;
    if (isOp('(') || isOp('[') || isOp('|')) arg = atom();
    else {
      // Sans parenthèses : produit des atomes qui suivent (`\sin 2x`), jusqu'à un opérateur ou une fonction.
      arg = power();
      while (startsAtom() && !(peek()?.t === 'cmd' && FUNCTIONS.has((peek() as { name: string }).name))) arg = { k: 'mul', a: arg, b: power() };
    }
    let r: Expr = { k: 'fn', name, a: arg, ...(base ? { base } : {}) };
    if (exponent) r = { k: 'pow', a: r, b: exponent };
    return r;
  }

  if (!toks.length) throw new ExprError('expression vide');
  const result = expr();
  if (pos < toks.length) {
    const tk = toks[pos];
    throw new ExprError(`suite inattendue : ${tk.t === 'op' ? tk.v : tk.t === 'num' ? tk.v : tk.name}`);
  }
  return result;
}

/** Variables d'une expression, triées. */
export function variablesOf(e: Expr): string[] {
  const out = new Set<string>();
  const walk = (x: Expr) => {
    if (x.k === 'var') out.add(x.name);
    else if (x.k === 'num') return;
    else if (x.k === 'neg' || x.k === 'abs') walk(x.a);
    else if (x.k === 'fn') {
      walk(x.a);
      if (x.base) walk(x.base);
    } else {
      walk(x.a);
      walk(x.b);
    }
  };
  walk(e);
  return [...out].sort();
}

/** Valeur d'une expression ; NaN hors de son domaine. */
export function evaluate(e: Expr, vars: Record<string, number>): number {
  switch (e.k) {
    case 'num':
      return e.v;
    case 'var':
      return vars[e.name] ?? NaN;
    case 'neg':
      return -evaluate(e.a, vars);
    case 'add':
      return evaluate(e.a, vars) + evaluate(e.b, vars);
    case 'sub':
      return evaluate(e.a, vars) - evaluate(e.b, vars);
    case 'mul':
      return evaluate(e.a, vars) * evaluate(e.b, vars);
    case 'div':
      return evaluate(e.a, vars) / evaluate(e.b, vars);
    case 'abs':
      return Math.abs(evaluate(e.a, vars));
    case 'pow': {
      const a = evaluate(e.a, vars);
      const b = evaluate(e.b, vars);
      // Racine impaire d'un négatif : ∛(−8) = −2.
      if (a < 0 && !Number.isInteger(b)) {
        const inv = 1 / b;
        if (Number.isInteger(Math.round(inv)) && Math.abs(inv - Math.round(inv)) < 1e-12 && Math.round(inv) % 2 !== 0) return -Math.pow(-a, b);
      }
      return Math.pow(a, b);
    }
    case 'fn': {
      const a = evaluate(e.a, vars);
      switch (e.name) {
        case 'sin': return Math.sin(a);
        case 'cos': return Math.cos(a);
        case 'tan': return Math.tan(a);
        case 'cot': return 1 / Math.tan(a);
        case 'sec': return 1 / Math.cos(a);
        case 'csc': return 1 / Math.sin(a);
        case 'ln': return a > 0 ? Math.log(a) : NaN;
        case 'log': {
          if (!(a > 0)) return NaN;
          const base = e.base ? evaluate(e.base, vars) : 10;
          return Math.log(a) / Math.log(base);
        }
        case 'exp': return Math.exp(a);
        case 'sqrt': return a >= 0 ? Math.sqrt(a) : NaN;
        case 'arcsin': return Math.asin(a);
        case 'arccos': return Math.acos(a);
        case 'arctan': return Math.atan(a);
        case 'sinh': return Math.sinh(a);
        case 'cosh': return Math.cosh(a);
        case 'tanh': return Math.tanh(a);
      }
      return NaN;
    }
  }
}

/** Variables tirées parmi les entiers (suites, dénombrement). */
const INTEGER_VARS = new Set(['n', 'k', 'p', 'm']);

/** Générateur pseudo-aléatoire reproductible (même tirage pour une même question). */
function rng(seedText: string) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let s = h >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** Points de test : d'abord des valeurs positives (domaines de ln, √), puis de signe quelconque. */
export function samplePoints(vars: readonly string[], seed: string, count = 24): Record<string, number>[] {
  const r = rng(seed);
  const pts: Record<string, number>[] = [];
  for (let i = 0; i < count; i++) {
    const p: Record<string, number> = {};
    for (const v of vars) {
      const base = v.replace(/_.*/, '');
      if (INTEGER_VARS.has(base)) p[v] = 1 + Math.floor(r() * 12);
      else if (i < count / 2) p[v] = 0.2 + r() * 2.8;
      else p[v] = (r() - 0.5) * 6;
    }
    pts.push(p);
  }
  return pts;
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));

export interface CompareOptions {
  /** Égalité à une constante près (primitives) : la différence doit être la même partout. */
  constant?: boolean;
}

/**
 * Retire un membre de gauche écrit par l'élève (« y = x - 1 », « u_n = … », « f'(x) = … ») : seul ce qui suit
 * l'unique signe « = » est comparé.
 */
export function rightHandSide(latex: string): string {
  const parts = latex.split('=');
  return parts.length === 2 && parts[1].trim() ? parts[1] : latex;
}

/** Retire un « + C » final (constante d'intégration écrite par l'élève ou l'auteur). */
export function stripConstant(latex: string): string {
  return latex.replace(/\s*\+\s*(?:\\mathrm\{C\}|C|k|K)\s*$/, '');
}

/**
 * Les deux expressions sont-elles égales ? `expected` doit être lisible (sinon : faux) ; une réponse
 * illisible est fausse.
 */
export function sameExpression(expected: string, given: string, opts: CompareOptions = {}): boolean {
  let e: Expr;
  let g: Expr;
  try {
    e = parseExpr(opts.constant ? stripConstant(expected) : expected);
    const rhs = rightHandSide(given);
    g = parseExpr(opts.constant ? stripConstant(rhs) : rhs);
  } catch {
    return false;
  }
  const vars = [...new Set([...variablesOf(e), ...variablesOf(g)])].sort();
  const points = vars.length ? samplePoints(vars, expected) : [{}];
  let valid = 0;
  let diff: number | null = null;
  for (const p of points) {
    const ev = evaluate(e, p);
    if (!Number.isFinite(ev)) continue;
    const gv = evaluate(g, p);
    if (!Number.isFinite(gv)) return false;
    if (opts.constant) {
      const d = gv - ev;
      if (diff === null) diff = d;
      else if (!close(d, diff)) return false;
    } else if (!close(ev, gv)) return false;
    valid++;
  }
  return vars.length ? valid >= 5 : valid === 1;
}

/** Problème d'une expression attendue (outillage, éditeur) : illisible, ou jamais définie aux points tirés. */
export function expressionProblem(latex: string, opts: CompareOptions = {}): string | null {
  try {
    const e = parseExpr(opts.constant ? stripConstant(latex) : latex);
    const vars = variablesOf(e);
    const pts = vars.length ? samplePoints(vars, latex) : [{}];
    const ok = pts.filter((p) => Number.isFinite(evaluate(e, p))).length;
    if (vars.length ? ok < 5 : ok < 1) return 'expression rarement définie aux points de test';
    return null;
  } catch (err) {
    return err instanceof ExprError ? err.message : String(err);
  }
}
