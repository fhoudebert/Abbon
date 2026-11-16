import { describe, expect, it } from 'vitest';
import { looksLikeSvg, sanitizeSvg, svgProblem } from './svg';

const wrap = (inner: string, attrs = 'viewBox="0 0 10 10"') => `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</svg>`;
const clean = (inner: string, attrs?: string) => sanitizeSvg(wrap(inner, attrs)) ?? '';

describe('nettoyage SVG', () => {
  it('garde formes, texte, dégradés et currentColor', () => {
    const out = clean('<g fill="none" stroke="currentColor" stroke-width="2"><path d="M0 0L10 10"/><circle cx="5" cy="5" r="2"/></g><text x="1" y="9" font-size="3">R = 2 &lt; 3</text>');
    expect(out).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M0 0L10 10"></path><circle cx="5" cy="5" r="2"></circle></g><text x="1" y="9" font-size="3">R = 2 &lt; 3</text></svg>',
    );
  });

  it('retire scripts, gestionnaires, styles globaux, objets étrangers et images', () => {
    const out = clean(
      '<script>alert(1)</script><style>body{display:none}</style><foreignObject><div>x</div></foreignObject>' +
        '<image href="https://exemple.org/x.png"/><rect width="5" height="5" onclick="alert(1)" onload="x()"/><a href="https://exemple.org"><circle r="1"/></a>',
    );
    expect(out).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="5" height="5"></rect></svg>');
  });

  it('n’accepte que des références internes', () => {
    expect(clean('<use href="#a"/><use xlink:href="#b"/><use href="https://exemple.org/x.svg#a"/><use href="javascript:alert(1)"/>')).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><use href="#a"></use><use href="#b"></use><use></use><use></use></svg>',
    );
    expect(clean('<rect fill="url(#g)"/><rect fill="url(https://exemple.org/x)"/><rect fill="url(data:image/png;base64,AAAA)"/>')).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect fill="url(#g)"></rect><rect></rect><rect></rect></svg>',
    );
  });

  it('filtre le style propriété par propriété', () => {
    expect(clean('<rect style="fill:#f00; position:fixed; stroke: currentColor; background:url(https://x); fill-opacity:.5"/>')).toContain(
      'style="fill:#f00;stroke:currentColor;fill-opacity:.5"',
    );
    expect(clean('<rect style="fill:expression(alert(1))"/>')).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect></rect></svg>');
    expect(clean('<rect style="fill:\\75rl(x)"/>')).not.toContain('style');
  });

  it('préfixe les identifiants et leurs références', () => {
    const out = sanitizeSvg(wrap('<defs><linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient></defs><rect fill="url(#g)" style="stroke:url(#g)"/><use href="#g"/>'), 'f1-');
    expect(out).toContain('id="f1-g"');
    expect(out).toContain('fill="url(#f1-g)"');
    expect(out).toContain('style="stroke:url(#f1-g)"');
    expect(out).toContain('href="#f1-g"');
  });

  it('retire les attributs et éléments d’éditeurs (Inkscape) sans casser la figure', () => {
    const src = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Created with Inkscape -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="20" height="10" inkscape:version="1.3">
  <sodipodi:namedview xmlns:sodipodi="x" pagecolor="#fff"/><metadata>x</metadata>
  <path inkscape:label="trait" d="M0 0h20"/><![CDATA[ ]]>
</svg>`;
    expect(looksLikeSvg(src)).toBe(true);
    const out = sanitizeSvg(src)!;
    expect(out).toContain('viewBox="0 0 20 10"'); // déduit de width / height
    expect(out).toContain('<path d="M0 0h20"></path>');
    expect(out).not.toMatch(/inkscape|sodipodi|metadata|DOCTYPE|<\?xml/);
  });

  it('refuse ce qui n’est pas un SVG bien formé', () => {
    for (const bad of [
      '<html><body>x</body></html>',
      '<svg><g></svg>',
      '<svg><rect fill=red/></svg>',
      '<!DOCTYPE svg [<!ENTITY a "aaaa">]><svg>&a;</svg>',
      '<svg>&nbsp;</svg>',
      '<svg></svg><script>1</script>',
      'texte',
    ])
      expect(sanitizeSvg(bad), bad).toBeNull();
    expect(svgProblem('<svg><g></svg>')).toMatch(/attendu/);
    expect(svgProblem(wrap(''))).toBeNull();
    expect(looksLikeSvg('<html>')).toBe(false);
  });

  it('ne laisse passer aucune balise par le texte ou les attributs', () => {
    const out = clean('<text>&lt;script&gt;alert(1)&lt;/script&gt;</text><rect id="a&quot; onload=&quot;x"/><desc><![CDATA[<img src=x onerror=1>]]></desc>');
    expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(out).toContain('&lt;img src=x onerror=1&gt;');
    expect(out).not.toMatch(/onload|<script|<img/);
  });
});
