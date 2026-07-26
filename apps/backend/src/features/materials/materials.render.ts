// Fitur: pembuat tampilan HTML materi
export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const renderVideoBlock = (url: string) => {
  let embedUrl = url;
  if (url.includes("youtube.com/watch?v=")) {
    embedUrl = url.replace("watch?v=", "embed/");
  } else if (url.includes("youtu.be/")) {
    embedUrl = url.replace("youtu.be/", "youtube.com/embed/");
  }
  return `<div class="video-container"><iframe src="${escapeHtml(embedUrl)}" frameborder="0" allowfullscreen></iframe></div>`;
};

const renderCheckpointBlock = (block: any, index: number) => {
  const optionsHtml = block.options
    .map(
      (opt: string, i: number) =>
        `<button class="checkpoint-option" type="button"><span class="opt-key">${String.fromCharCode(65 + i)}</span> ${escapeHtml(opt)}</button>`
    )
    .join("");

  return `
    <div class="checkpoint-card" data-answer="${block.answer}">
      <div class="checkpoint-header">💡 Checkpoint ${index + 1}</div>
      <div class="checkpoint-question">${escapeHtml(block.question)}</div>
      <div class="checkpoint-options">${optionsHtml}</div>
      <div class="checkpoint-feedback"></div>
    </div>
  `;
};

export const renderMaterialHtml = (material: any): string => {
  let checkpointCounter = 0;
  const blocksHtml = (material.blocks || [])
    .map((b: any) => {
      if (b.type === "html") return `<div class="html-block">${b.content}</div>`;
      if (b.type === "video") return renderVideoBlock(b.url);
      if (b.type === "checkpoint") {
        const html = renderCheckpointBlock(b, checkpointCounter);
        checkpointCounter++;
        return html;
      }
      return "";
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(material.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    h1.material-title { font-size: 2rem; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 24px; }
    .video-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .checkpoint-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 24px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .checkpoint-header { font-size: 0.875rem; font-weight: 700; color: #4f46e5; text-transform: uppercase; margin-bottom: 8px; }
    .checkpoint-question { font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
    .checkpoint-options { display: flex; flex-direction: column; gap: 8px; }
    .checkpoint-option { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; background: #ffffff; text-align: left; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
    .checkpoint-option:hover { background: #f3f4f6; border-color: #9ca3af; }
    .checkpoint-option .opt-key { font-weight: 700; background: #e5e7eb; padding: 2px 8px; border-radius: 4px; }
    .checkpoint-option.correct { background: #d1fae5; border-color: #10b981; color: #065f46; }
    .checkpoint-option.incorrect { background: #fee2e2; border-color: #ef4444; color: #991b1b; }
    .checkpoint-feedback { margin-top: 12px; font-weight: 600; font-size: 0.95rem; }
    .feedback-correct { color: #059669; }
    .feedback-incorrect { color: #dc2626; }
  </style>
</head>
<body>
  <h1 class="material-title">${escapeHtml(material.title)}</h1>
  <main>${blocksHtml}</main>
  <script src="/api/materials/public/viewer.js"></script>
</body>
</html>`;
};
