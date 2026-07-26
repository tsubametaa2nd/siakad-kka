import path from 'path';
import fs from 'fs';

const bannerPath = path.join(process.cwd(), 'apps/backend/banner-nino-color.txt');
const text = fs.readFileSync(bannerPath, 'utf-8');

interface RGB { r: number; g: number; b: number; }

function parseAnsiToPixels(ansiText: string) {
  const lines = ansiText.split('\n');
  const pixels: { x: number; y: number; color: RGB }[] = [];

  let fg: RGB | null = null;
  let bg: RGB | null = null;

  lines.forEach((line, lineIdx) => {
    let x = 0;
    const topY = lineIdx * 2;
    const bottomY = lineIdx * 2 + 1;

    // Tokenize line into ANSI escape sequences and characters
    const tokenRegex = /(\x1b\[[0-9;]*m)|([^\x1b])/g;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      const escape = match[1];
      const char = match[2];

      if (escape) {
        if (escape === '\x1b[0m') {
          fg = null;
          bg = null;
        } else {
          // Check for fg/bg combined or individual
          const fgBgMatch = /\x1b\[38;2;(\d+);(\d+);(\d+);48;2;(\d+);(\d+);(\d+)m/.exec(escape);
          if (fgBgMatch) {
            fg = { r: +fgBgMatch[1], g: +fgBgMatch[2], b: +fgBgMatch[3] };
            bg = { r: +fgBgMatch[4], g: +fgBgMatch[5], b: +fgBgMatch[6] };
          } else {
            const fgMatch = /\x1b\[38;2;(\d+);(\d+);(\d+)m/.exec(escape);
            if (fgMatch) {
              fg = { r: +fgMatch[1], g: +fgMatch[2], b: +fgMatch[3] };
            }
            const bgMatch = /\x1b\[48;2;(\d+);(\d+);(\d+)m/.exec(escape);
            if (bgMatch) {
              bg = { r: +bgMatch[1], g: +bgMatch[2], b: +bgMatch[3] };
            }
          }
        }
      } else if (char !== undefined) {
        // Character processing
        if (char === '▀') {
          if (fg) pixels.push({ x, y: topY, color: fg });
          if (bg) pixels.push({ x, y: bottomY, color: bg });
        } else if (char === '▄') {
          if (bg) pixels.push({ x, y: topY, color: bg });
          if (fg) pixels.push({ x, y: bottomY, color: fg });
        } else if (char === ' ') {
          if (bg) {
            pixels.push({ x, y: topY, color: bg });
            pixels.push({ x, y: bottomY, color: bg });
          }
        } else {
          // Regular char
          if (fg) pixels.push({ x, y: topY, color: fg });
          if (bg) pixels.push({ x, y: bottomY, color: bg });
        }
        x++;
      }
    }
  });

  return pixels;
}

const pixels = parseAnsiToPixels(text);
console.log(`Parsed ${pixels.length} pixels`);
const maxX = Math.max(...pixels.map(p => p.x));
const maxY = Math.max(...pixels.map(p => p.y));
console.log(`Grid dimensions: ${maxX + 1} x ${maxY + 1}`);
