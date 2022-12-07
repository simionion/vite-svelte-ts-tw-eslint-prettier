// noinspection JSIgnoredPromiseFromCall
import fs from 'node:fs';

/*
To find all classes inside 'class="..."' and "class:...=" attributes we most consider the following cases:
          1. class= can be prepended by hover: or focus: or active: or multiple of these
          so we should search after the last ":"
          1.a class= can extend on multiple lines and can contain expressions starting with { and ending with }
          2. class= can contain expressions like {$classVar} or {$classVar? 'class1' : 'class2'}
          so we should not search within expressions unless they are wrapped in quotes
*/
//We need to build a regex that will first look for class: directive or class=" string
// and then search for either a class name in directive or class names and expressions in string
let regexClassAttributeCombined = /(?<=([\s\b]|^)class=['"])([!%0-9a-z-._:/\[\]]+|\{[^}]+}|\s*)*/gim;
let regexClassTemplateExpression = /(?<=([\s\b]|^)class={`)(\$\{[^}]*}|\s*|[!%0-9a-z-._:/\[\]]+)*(?=`})/gim;
let regexClassDirective = /(?<=[\s\b]|^)class:([!%0-9a-z-._:/\[\]]+)=/gim;
let regexExpression = /(?<=[\s\b]|^){[^}]+}(?=[\s\b]|$)/gm;
let regexVarExpression = /(?<=[\s\b]|^)\${[^}]+}(?=[\s\b]|$)/gm;
let regexInsideQuotes = /"(?<dq>[^"]*)"|'(?<sq>[^']*)'/g;

let cachePath = './cache/classes';
let cacheDir = cachePath + '/' + new Date().toISOString().split('T')[0];
let prefixedGlobals;
let storeClasses = new Set();
let testNameF = 'do-not-save.svelte';

export function tailwindClassPrefixer({ prefix = 'ion-', globals = null }) {
  if (!prefix) console.error('No prefix provided for tailwindClassPrefixer');

  if (globals) {
    prefixedGlobals = {};
    Object.keys(globals).map(
      key =>
        (prefixedGlobals[prefixClassString({ str: key, prefix, store: false })] = prefixMultiClassString({
          str: globals[key],
          prefix,
          store: false,
        }))
    );
  }

  initCacheDir(cachePath, cacheDir);

  return {
    markup({ content, filename }) {
      let newContent;
      storeClasses.clear();

      newContent = prefixClassDirective({ content, prefix });
      newContent = prefixCombo({
        content: newContent,
        classRegex: regexClassAttributeCombined,
        expressionRegex: regexExpression,
        prefix,
      });

      newContent = prefixCombo({
        content: newContent,
        classRegex: regexClassTemplateExpression,
        expressionRegex: regexVarExpression,
        prefix,
      });

      if (filename != testNameF) {
        if (newContent != content) initCacheDir(cachePath, cacheDir);
        saveGeneratedClasses(filename);
      }

      return {
        code: newContent,
      };
    },
  };
}

function initCacheDir(cachePath, cacheDir) {
  if (!fs.existsSync(cacheDir)) {
    if (fs.existsSync(cachePath)) fs.rmSync(cachePath, { recursive: true }); //clean up previous
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

function saveGeneratedClasses(filename) {
  let file = filename.split('/').slice(-3).join('-');
  let path = `${cacheDir}/${file}.txt`;
  let classes = [...storeClasses];
  let savedClasses = fs.existsSync(path) ? fs.readFileSync(path, 'utf8').split('\n').filter(Boolean) : [];

  if (savedClasses.length == classes.length && savedClasses.sort().toString() == classes.sort().toString()) return;

  let added = classes.filter(x => !savedClasses.includes(x));
  let removed = savedClasses.filter(x => !classes.includes(x));
  if (savedClasses.length > 0)
    console.log(
      `\x1b[34m [Tailwind] >\x1b[33m ${filename.split('/').at(-1)} >${
        removed.length ? `\x1b[31m ${removed.join(' ')} ` : ''
      }${added.length ? `\x1b[32m ${added.join(' ')}` : ''}`
    );

  fs.writeFileSync(path, classes.join('\n'));
}

function prefixCombo({ content, classRegex, expressionRegex, prefix }) {
  return content.replaceAll(classRegex, match => {
    let expressions = [];
    //expect multiple expressions - if the match contains a var / expression, we need to separate it from the class names to prefix remaining regular classes.
    match = match.replaceAll(expressionRegex, subMatch => {
      expressions.push(subMatch);
      return ''; //save & replace;
    });

    //If expressions have quoted values, values should be classes
    expressions.map((expr, index) => {
      if (false == /['"]/.test(expr)) return;
      expressions[index] = expr.replaceAll(regexInsideQuotes, (subMatch, _, cls) => {
        return cls ? subMatch.replace(cls, prefixMultiClassString({ str: cls, prefix })) : subMatch;
      });
    });

    expressions.push(prefixMultiClassString({ str: match, prefix }));
    return [...new Set(expressions)].join(' ');
  });
}

function prefixClassDirective({ content, prefix }) {
  return content.replaceAll(regexClassDirective, (match, classDirective) => {
    return match.replaceAll(classDirective, prefixClassString({ str: classDirective, prefix }));
  });
}

function prefixMultiClassString({ str, prefix, store = true }) {
  let classes = new Set(
    trimMultiline(str)
      .trim()
      .split(' ')
      .map(cls => prefixClassString({ str: cls, prefix, store }))
  );
  //circular reference check
  let size = classes.size - 1;
  while (prefixedGlobals && size != classes.size) {
    classes.forEach(cls => prefixedGlobals?.[cls]?.split(' ').map(cls => classes.add(cls)));
    size = classes.size;
  }

  if (store) storeClasses = new Set([...storeClasses, ...classes]);

  return [...classes].join(' ');
}

function prefixClassString({ str, prefix, store = true }) {
  let prefixed = _doPrefix(str, prefix);
  if (store && prefixed.includes(prefix)) storeClasses.add(prefixed);
  return prefixed;

  function _doPrefix(str, prefix) {
    let classStr = str.trim();
    if (classStr.length === 0) return str;
    if (classStr.includes(' ')) return prefixMultiClassString({ str: classStr, prefix, store });
    if (classStr.includes(prefix)) return classStr;
    if (classStr.includes('!')) return prefixAfterSymbol(classStr, '!', prefix);
    if (classStr.includes(':')) return prefixAfterSymbol(classStr, ':', prefix);
    return prefix + classStr;
  }
}

function prefixAfterSymbol(str, symbol, prefix) {
  let parts = str.split(symbol);
  let lastPart = parts.pop();
  return parts.join(symbol) + symbol + prefix + lastPart;
}

function trimMultiline(str) {
  return str?.trim()?.replace(/\s{2,}|\n/gi, ' ');
}

//test cases for class attribute values
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  let instance = tailwindClassPrefixer({ prefix: 'ion-' });

  describe.concurrent('tailwindClassPrefixer', () => {
    //testing regexes;
    it('should match the class attribute value', async () => {
      const testString = `<div class="class1 class2 class3">`;
      expect(testString.match(regexClassAttributeCombined)[0]).toEqual('class1 class2 class3');
    });

    it('should match the class attribute value on multiple elements', async () => {
      const testString = `<p class="class1 class2 class3"><p class="class4 class5 class6"></p></p>`;
      const matcher = testString.matchAll(regexClassAttributeCombined);
      expect(matcher.next().value[0]).toEqual('class1 class2 class3');
      expect(matcher.next().value[0]).toEqual('class4 class5 class6');
    });

    it('should match the class attribute if includes expression', async () => {
      const testString = `<p class="class1 {expvar}">`;
      expect(testString.match(regexClassAttributeCombined)[0]).toEqual('class1 {expvar}');
    });

    it('should get the class name from class directives', async () => {
      const testString = `<p class:myclass="class1">`;
      let matcher = testString.matchAll(regexClassDirective);
      expect(matcher.next().value[1]).toEqual('myclass');
    });

    it('should prefix values', async () => {
      expect(prefixClassString({ str: 'text-black', prefix: 'ion-' })).toBe('ion-text-black');
    });

    it('should prefix values with colon', async () => {
      expect(prefixClassString({ str: 'hover:text-black', prefix: 'ion-' })).toBe('hover:ion-text-black');
    });

    it('should not prefix already prefixed strings', async () => {
      expect(prefixClassString({ str: 'ion-text-black', prefix: 'ion-' })).toBe('ion-text-black');
    });

    it('should inline multiple lines and trim spaces to 1', async () => {
      expect(
        trimMultiline(
          `text-black   text-red
text-white             text-blue`
        )
      ).toBe('text-black text-red text-white text-blue');
    });

    it('should prefix class strings in class: directives', async () => {
      const testString = `<p class:myclass="class1">`;
      expect(prefixClassDirective({ content: testString, prefix: 'ion-' })).toBe(`<p class:ion-myclass="class1">`);
    });

    it('should not prefix class strings in class: directives if already prefixed', async () => {
      const testString = `<p class:ion-myclass="class1">`;
      expect(prefixClassDirective({ content: testString, prefix: 'ion-' })).toBe(`<p class:ion-myclass="class1">`);
    });

    it('regexClassAttributeCombined should have groups', async () => {
      let rezult = `<p class="class1 class2 class3 { ok? 'nope': 'fine' }"></p>`.replace(
        regexClassAttributeCombined,
        (match, classes, expression) => {
          if (classes) return 'classes';
          if (expression) return 'expression';
          return 'space';
        }
      );

      expect(rezult).toBe(`<p class="classes"></p>`);
    });

    it('should find class directive and prefix it', async () => {
      let content = `<div class:text-black={true}></div>`;
      let result = instance.markup({ content, filename: testNameF });
      expect(result.code).toBe(`<div class:ion-text-black={true}></div>`);
    });

    it('should prefix class attribute values within expressions', async () => {
      let content = `class="text-black { someVar ? 'text-white' : 'text-red' }"`;
      let result = instance.markup({ content, filename: testNameF });
      expect(result.code).toBe(`class="{ someVar ? 'ion-text-white' : 'ion-text-red' } ion-text-black"`);
    });

    it('should prefix class attribute values near expressions', async () => {
      let content = 'something etc class={`${$typographyTheme$} font-sans  ${shopClass} fonts-sans  text-black`} >';
      let result = instance.markup({ content, filename: testNameF });
      expect(result.code).toBe(
        'something etc class={`${$typographyTheme$} ${shopClass} ion-font-sans ion-fonts-sans ion-text-black`} >'
      );
    });

    it('should prefix class attribute values near & within expressions', async () => {
      let content =
        "something etc class={`${$typographyTheme$} font-sans ${ someVar ? 'text-white' : 'text-red' } text-black`} >";
      let result = instance.markup({ content, filename: testNameF });
      expect(result.code).toEqual(
        "something etc class={`${$typographyTheme$} ${ someVar ? 'ion-text-white' : 'ion-text-red' } ion-font-sans ion-text-black`} >"
      );
    });

    //test inlineGlobals
    it('should inline global classes with their values', async () => {
      let instanceGlobals = tailwindClassPrefixer({
        prefix: 'ion-',
        globals: { 'example': 'text-black fonts-sans' },
      });

      let content = `<div class="example"></div>`;
      let result = instanceGlobals.markup({ content, filename: testNameF });
      expect(result.code).toBe(`<div class="ion-example ion-text-black ion-fonts-sans"></div>`);
    });

    it('should inline multiple global classes including any global reference', async () => {
      let instanceGlobals = tailwindClassPrefixer({
        prefix: 'ion-',
        globals: {
          'example': 'text-black',
          'example2': 'example3 text-red',
          'example3': 'example !text-brown',
        },
      });

      let content = `<div class="example2"></div>`;
      let result = instanceGlobals.markup({ content, filename: testNameF });
      expect(result.code).toBe(
        `<div class="ion-example2 ion-example3 ion-text-red ion-example !ion-text-brown ion-text-black"></div>`
      );
    });
  });
}
