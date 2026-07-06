const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inputPath = path.join(rootDir, 'tokens.json');
const outputPath = path.join(rootDir, 'tokens.css');

const tokens = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

function toVarName(parts) {
  return '--' + parts
    .map((part) => part.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase())
    .join('-');
}

function renderScalar(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  return JSON.stringify(value);
}

function flatten(value, prefix = [], output = {}) {
  if (Array.isArray(value)) {
    const rendered = value
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const entries = Object.entries(item)
            .map(([key, child]) => `${key}: ${renderScalar(child)}`)
            .join(' ');
          return entries;
        }
        return renderScalar(item);
      })
      .join(', ');

    if (prefix.length > 0) {
      output[toVarName(prefix)] = rendered;
    }
    return output;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const next = [...prefix, key];
      if (child && typeof child === 'object' && !Array.isArray(child)) {
        flatten(child, next, output);
      } else {
        output[toVarName(next)] = renderScalar(child);
      }
    }
    return output;
  }

  if (prefix.length > 0) {
    output[toVarName(prefix)] = renderScalar(value);
  }

  return output;
}

const vars = flatten(tokens);
const css = [':root {', ...Object.entries(vars).sort().map(([name, value]) => `  ${name}: ${value};`), '}'].join('\n') + '\n';

fs.writeFileSync(outputPath, css);
console.log(`Generated ${Object.keys(vars).length} CSS custom properties in ${path.relative(rootDir, outputPath)}`);
