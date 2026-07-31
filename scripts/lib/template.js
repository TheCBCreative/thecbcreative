/**
 * template.js — a tiny, dependency-free mustache-lite renderer.
 *
 * Supported syntax:
 *   {{path.to.value}}    escaped variable
 *   {{{path.to.value}}}  raw / unescaped variable (use for pre-built HTML)
 *   {{#each items}} ... {{/each}}   repeats the inner block once per item,
 *                                    with that item merged into scope
 *   {{#if cond}} ... {{/if}}        renders the inner block only if cond
 *                                    is truthy
 *
 * Blocks may nest (an {{#if}} inside an {{#each}}, etc). This is
 * intentionally small — it covers exactly what this site's components
 * need and nothing more.
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getPath(context, path) {
  return path
    .split('.')
    .reduce((val, key) => (val === undefined || val === null ? undefined : val[key]), context);
}

// Finds the first {{#tagName ...}} in `template` and its matching
// {{/tagName}}, accounting for nested blocks of the same tag type.
function extractBlock(template, tagName) {
  const openRe = new RegExp(`{{#${tagName}\\s+([\\w.]+)}}`);
  const openMatch = openRe.exec(template);
  if (!openMatch) return null;

  const openTagFull = new RegExp(`{{#${tagName}\\s+[\\w.]+}}`, 'g');
  const closeTag = `{{/${tagName}}}`;
  const closeTagLen = closeTag.length;

  const start = openMatch.index;
  const afterOpenTag = start + openMatch[0].length;

  let depth = 1;
  let cursor = afterOpenTag;

  while (depth > 0) {
    openTagFull.lastIndex = cursor;
    const nextOpen = openTagFull.exec(template);
    const nextClose = template.indexOf(closeTag, cursor);

    if (nextClose === -1) {
      throw new Error(`template.js: missing {{/${tagName}}} for block starting at index ${start}`);
    }

    if (nextOpen && nextOpen.index < nextClose) {
      depth += 1;
      cursor = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      cursor = nextClose + closeTagLen;
      if (depth === 0) {
        return {
          before: template.slice(0, start),
          key: openMatch[1],
          inner: template.slice(afterOpenTag, nextClose),
          after: template.slice(cursor),
        };
      }
    }
  }
  return null;
}

function renderBlocks(template, context) {
  let result = template;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const eachBlock = extractBlock(result, 'each');
    const ifBlock = extractBlock(result, 'if');

    let block = null;
    let type = null;
    if (eachBlock && ifBlock) {
      block = eachBlock.before.length <= ifBlock.before.length ? eachBlock : ifBlock;
      type = block === eachBlock ? 'each' : 'if';
    } else if (eachBlock) {
      block = eachBlock;
      type = 'each';
    } else if (ifBlock) {
      block = ifBlock;
      type = 'if';
    } else {
      break;
    }

    let rendered = '';
    if (type === 'each') {
      const items = getPath(context, block.key) || [];
      rendered = items
        .map((item) => {
          const itemContext = typeof item === 'object' && item !== null
            ? { ...context, ...item, this: item }
            : { ...context, this: item };
          return render(block.inner, itemContext);
        })
        .join('');
    } else {
      const cond = getPath(context, block.key);
      rendered = cond ? render(block.inner, context) : '';
    }

    result = block.before + rendered + block.after;
  }

  return result;
}

function renderVariables(template, context) {
  return template
    .replace(/{{{\s*([\w.]+)\s*}}}/g, (_, path) => {
      const val = getPath(context, path);
      return val === undefined || val === null ? '' : String(val);
    })
    .replace(/{{\s*([\w.]+)\s*}}/g, (_, path) => escapeHtml(getPath(context, path)));
}

function render(template, context) {
  const withBlocks = renderBlocks(template, context);
  return renderVariables(withBlocks, context);
}

module.exports = { render, escapeHtml };
