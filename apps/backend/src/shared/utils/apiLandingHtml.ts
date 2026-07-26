// Fitur: Generator Halaman Landing API /api dengan Banner Nino & Dokumentasi
import path from "path";

interface RGB { r: number; g: number; b: number; }

function parseAnsiToSvg(ansiText: string): string {
  const lines = ansiText.split('\n');
  const pixels: { x: number; y: number; color: string }[] = [];

  let fg: RGB | null = null;
  let bg: RGB | null = null;

  lines.forEach((line, lineIdx) => {
    let x = 0;
    const topY = lineIdx * 2;
    const bottomY = lineIdx * 2 + 1;

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
        if (char === '▀') {
          if (fg) pixels.push({ x, y: topY, color: `rgb(${fg.r},${fg.g},${fg.b})` });
          if (bg) pixels.push({ x, y: bottomY, color: `rgb(${bg.r},${bg.g},${bg.b})` });
        } else if (char === '▄') {
          if (bg) pixels.push({ x, y: topY, color: `rgb(${bg.r},${bg.g},${bg.b})` });
          if (fg) pixels.push({ x, y: bottomY, color: `rgb(${fg.r},${fg.g},${fg.b})` });
        } else if (char === ' ') {
          if (bg) {
            pixels.push({ x, y: topY, color: `rgb(${bg.r},${bg.g},${bg.b})` });
            pixels.push({ x, y: bottomY, color: `rgb(${bg.r},${bg.g},${bg.b})` });
          }
        } else {
          if (fg) pixels.push({ x, y: topY, color: `rgb(${fg.r},${fg.g},${fg.b})` });
          if (bg) pixels.push({ x, y: bottomY, color: `rgb(${bg.r},${bg.g},${bg.b})` });
        }
        x++;
      }
    }
  });

  const rects = pixels
    .map((p) => `<rect x="${p.x}" y="${p.y}" width="1" height="1" fill="${p.color}"/>`)
    .join('');

  return `<svg viewBox="0 0 38 42" width="304" height="336" shape-rendering="crispEdges" style="display:block;margin:0 auto;image-rendering:pixelated;"><rect width="38" height="42" fill="#0b0e14"/>${rects}</svg>`;
}

export const getApiLandingHtml = async (): Promise<string> => {
  let rawBanner = "";
  try {
    const bannerPath = path.join(process.cwd(), "banner-nino-color.txt");
    const file = Bun.file(bannerPath);
    if (await file.exists()) {
      rawBanner = await file.text();
    }
  } catch (e) {
    console.error("Gagal membaca banner-nino-color.txt", e);
  }

  const svgBanner = rawBanner ? parseAnsiToSvg(rawBanner) : '<div style="color:#fff;text-align:center;">SIAKAD KKA API</div>';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIAKAD KKA — Backend API Service</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0c10;
      --card-bg: #12161f;
      --border: #2d333b;
      --text: #adbac7;
      --heading: #ffffff;
      --primary: #ffd600;
      --accent: #ff4081;
      --green: #2ea043;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      padding: 2rem 1rem;
      min-height: 100vh;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 980px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .header-box {
      background: #161b22;
      border: 3px solid #ffffff;
      box-shadow: 6px 6px 0px #ffffff;
      padding: 1.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .title-area h1 {
      font-size: 1.5rem;
      font-weight: 900;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .title-area p {
      font-size: 0.85rem;
      color: #768390;
      margin-top: 0.2rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #2ea043;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.4rem 0.85rem;
      border: 2px solid #000000;
      box-shadow: 3px 3px 0px #000000;
      text-transform: uppercase;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #ffffff;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .banner-card {
      background: #000000;
      border: 3px solid #ffd600;
      box-shadow: 6px 6px 0px #ffd600;
      padding: 1.5rem;
      overflow-x: auto;
      border-radius: 2px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .actions-bar {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--primary);
      color: #000000;
      font-weight: 900;
      text-decoration: none;
      padding: 0.65rem 1.25rem;
      border: 2px solid #000000;
      box-shadow: 4px 4px 0px #000000;
      font-size: 0.85rem;
      text-transform: uppercase;
      transition: all 0.1s ease;
      cursor: pointer;
    }
    .btn:hover {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px #000000;
    }
    .btn-secondary {
      background: #316dca;
      color: #ffffff;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 1.25rem;
    }
    .card {
      background: var(--card-bg);
      border: 2px solid var(--border);
      padding: 1.25rem;
      border-radius: 4px;
    }
    .card-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--heading);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border);
      padding-bottom: 0.5rem;
      text-transform: uppercase;
    }
    .endpoint-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
    }
    .endpoint-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .method {
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 2px;
      font-size: 0.68rem;
      min-width: 48px;
      text-align: center;
    }
    .get { background: #2ea043; color: #ffffff; }
    .post { background: #1f6beb; color: #ffffff; }
    .patch { background: #d96c00; color: #ffffff; }
    .delete { background: #da3633; color: #ffffff; }
    .path { color: #adbac7; font-weight: 500; }
    footer {
      text-align: center;
      padding: 1rem;
      color: #768390;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      border-top: 1px dashed var(--border);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header Box -->
    <div class="header-box">
      <div class="title-area">
        <h1>SIAKAD KKA 31 API Server</h1>
        <p>Production RESTful Engine • ElysiaJS + Bun Runtime</p>
      </div>
      <div class="status-badge">
        <span class="pulse-dot"></span>
        SYSTEM OPERATIONAL
      </div>
    </div>

    <!-- Banner Nino Pixel Crisp SVG -->
    <div class="banner-card">
      ${svgBanner}
    </div>

    <!-- Quick Action Buttons -->
    <div class="actions-bar">
      <a href="/docs" class="btn">
        📖 Swagger Interactive Docs (/docs)
      </a>
      <a href="/health" class="btn btn-secondary">
        💚 System Health Check (/health)
      </a>
    </div>

    <!-- API Directory Grid -->
    <div class="grid">
      <!-- Auth Card -->
      <div class="card">
        <div class="card-title">🔐 Auth & Profile</div>
        <ul class="endpoint-list">
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/auth/login</span></li>
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/auth/me</span></li>
          <li class="endpoint-item"><span class="method patch">PATCH</span> <span class="path">/api/auth/profile</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/auth/change-password</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/auth/accounts</span></li>
        </ul>
      </div>

      <!-- Classes Card -->
      <div class="card">
        <div class="card-title">🏫 Classes & Students</div>
        <ul class="endpoint-list">
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/classes</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/classes</span></li>
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/classes/:id</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/classes/import-students</span></li>
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/classes/my-class</span></li>
        </ul>
      </div>

      <!-- Materials Card -->
      <div class="card">
        <div class="card-title">📚 Learning Materials</div>
        <ul class="endpoint-list">
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/materials</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/materials</span></li>
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/materials/:id</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/materials/:id/presence</span></li>
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/materials/:id/readers</span></li>
        </ul>
      </div>

      <!-- Assignments & Submissions -->
      <div class="card">
        <div class="card-title">📝 Assignments & Submissions</div>
        <ul class="endpoint-list">
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/assignments</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/assignments</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/submissions</span></li>
          <li class="endpoint-item"><span class="method patch">PATCH</span> <span class="path">/api/submissions/:id/grade</span></li>
        </ul>
      </div>

      <!-- Quiz Card -->
      <div class="card">
        <div class="card-title">⚡ Interactive Quizzes</div>
        <ul class="endpoint-list">
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/quiz</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/quiz</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/quiz/:id/submit</span></li>
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/quiz/:id/leaderboard</span></li>
        </ul>
      </div>

      <!-- Groups & Grading Card -->
      <div class="card">
        <div class="card-title">👥 Groups & Grades Sync</div>
        <ul class="endpoint-list">
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/groups</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/groups/join</span></li>
          <li class="endpoint-item"><span class="method get">GET</span> <span class="path">/api/grading/summary</span></li>
          <li class="endpoint-item"><span class="method post">POST</span> <span class="path">/api/grading/sync-sheets</span></li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <footer>
      SIAKAD KKA Engine v1.0.0 • Utaaa for SIAKAD KKA SMKN 31
    </footer>
  </div>
</body>
</html>`;
};
