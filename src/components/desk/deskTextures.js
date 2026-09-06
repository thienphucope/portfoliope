import * as THREE from 'three';

// Small, deterministic paintings for the physical props. No reference frame is
// pasted into the scene; all of the desk, paper, maps and photographs are built here.
export function random(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function canvasTexture(width, height, paint, seed = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  paint(ctx, width, height, random(seed));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function grain(ctx, w, h, rng, amount = 16000) {
  for (let i = 0; i < amount; i++) {
    ctx.fillStyle = rng() > 0.5 ? `rgba(65,48,30,${rng() * 0.085})` : `rgba(255,245,215,${rng() * 0.15})`;
    ctx.fillRect(rng() * w, rng() * h, 0.5 + rng() * 2, 0.5 + rng() * 2);
  }
}

function paper(ctx, w, h, rng, color = '#d9d1b7') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#fff5d617');
  gradient.addColorStop(0.5, '#ffffff00');
  gradient.addColorStop(1, '#715d3928');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, rng);
}

function writing(ctx, rng, x, y, width, lines = 8, size = 13, color = '#3e4943') {
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.12;
  ctx.lineCap = 'round';
  for (let row = 0; row < lines; row++) {
    let cursor = x;
    const end = x + width * (row === lines - 1 ? 0.45 + rng() * 0.5 : 0.9 + rng() * 0.1);
    while (cursor < end - size * 2) {
      const letters = 2 + Math.floor(rng() * 7);
      ctx.beginPath();
      ctx.moveTo(cursor, y + row * size * 1.7);
      for (let letter = 0; letter < letters; letter++) {
        const baseline = y + row * size * 1.7;
        ctx.bezierCurveTo(cursor + size * 0.1, baseline - rng() * size,
          cursor + size * 0.4, baseline + rng() * size * 0.3,
          cursor + size * 0.48, baseline - rng() * size * 0.3);
        cursor += size * 0.46;
      }
      ctx.stroke();
      cursor += size * 0.6;
    }
  }
}

function headline(ctx, text, x, y, size = 25, color = '#35463f') {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px 'Courier New', monospace`;
  ctx.fillText(text, x, y);
}

function mapPainting(ctx, w, h, rng) {
  paper(ctx, w, h, rng, '#aeb49b');
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = ['#9fae91', '#bcc0a1', '#a9af93', '#c8c5a4'][i % 4];
    const x = rng() * w;
    const y = rng() * h;
    ctx.fillRect(x, y, 10 + rng() * w * 0.16, 10 + rng() * h * 0.14);
  }
  ctx.strokeStyle = '#8da8a1';
  ctx.lineWidth = w * 0.058;
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 1.1);
  ctx.bezierCurveTo(w * 0.72, h * 0.3, w * 0.01, h * 0.61, w * 0.91, -h * 0.1);
  ctx.stroke();
  for (let i = 0; i < 28; i++) {
    ctx.strokeStyle = i % 5 === 0 ? '#e1d6b5' : '#dad8bd';
    ctx.lineWidth = i % 5 === 0 ? 5 : 2;
    ctx.beginPath();
    const x = rng() * w;
    const y = rng() * h;
    ctx.moveTo(x, -20);
    ctx.lineTo(x * 0.85 + w * 0.06, y * 0.45);
    ctx.lineTo(x + (rng() - 0.5) * w * 0.25, h * 0.76);
    ctx.lineTo(x + (rng() - 0.5) * w * 0.5, h + 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.lineTo(w * 0.4, y * 0.93);
    ctx.lineTo(w * 0.7, y + (rng() - 0.5) * h * 0.3);
    ctx.lineTo(w + 20, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a6e5b';
  ctx.font = `${w * 0.028}px 'Courier New', monospace`;
  ['WESTMINSTER', 'PADDINGTON', 'SOHO', 'RIVER THAMES', 'VICTORIA'].forEach((name, i) => {
    ctx.fillText(name, w * (0.07 + (i % 2) * 0.42), h * (0.17 + i * 0.17));
  });
  ctx.strokeStyle = '#a24d3d';
  ctx.lineWidth = 3;
  [[0.2, 0.31], [0.67, 0.19], [0.71, 0.7], [0.4, 0.6]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.ellipse(w * x, h * y, w * 0.06, w * 0.054, -0.2, 0, Math.PI * 2); ctx.stroke();
  });
}

function photoPainting(ctx, w, h, rng, variant = 0) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#8caaa3'); sky.addColorStop(1, '#d3c4a0');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  // A little painted London street: silhouetted roofs, lit windows and wet pavement.
  ctx.fillStyle = '#56675c'; ctx.fillRect(0, h * 0.7, w, h * 0.3);
  for (let i = 0; i < 9; i++) {
    const x = (i - 1) * w / 7;
    const bw = w / 7 + rng() * w * 0.03;
    const top = h * (0.17 + rng() * 0.35);
    ctx.fillStyle = ['#56685e', '#827e66', '#747d69', '#465f57'][i % 4];
    ctx.fillRect(x, top, bw, h * 0.73 - top);
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + bw * 0.5, top - h * 0.09); ctx.lineTo(x + bw, top); ctx.fill();
    ctx.fillStyle = '#b9b491';
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
      ctx.fillRect(x + 7 + col * bw * 0.28, top + 12 + row * h * 0.09, bw * 0.14, h * 0.046);
    }
  }
  ctx.fillStyle = '#a4a087';
  ctx.beginPath(); ctx.moveTo(w * 0.4, h * 0.66); ctx.lineTo(w * 0.61, h * 0.66); ctx.lineTo(w * 0.88, h); ctx.lineTo(w * 0.04, h); ctx.fill();
  ctx.fillStyle = '#3a5048';
  for (const x of [0.2, 0.83]) {
    ctx.fillRect(w * x, h * 0.27, 5, h * 0.56);
    ctx.fillRect(w * x - 8, h * 0.25, 21, 5);
    ctx.fillStyle = '#e3c88e'; ctx.fillRect(w * x - 5, h * 0.2, 14, h * 0.06); ctx.fillStyle = '#3a5048';
  }
  if (variant % 2 === 0) {
    ctx.fillStyle = '#7f4438'; ctx.fillRect(w * 0.68, h * 0.53, w * 0.1, h * 0.23);
    ctx.fillStyle = '#afad89'; ctx.fillRect(w * 0.69, h * 0.56, w * 0.075, h * 0.13);
  }
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, '#e1c47c23'); wash.addColorStop(1, '#1c404359');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, rng, 18000);
}

export function makeDeskTextures() {
  const textures = {};
  textures.wood = canvasTexture(1024, 1024, (ctx, w, h, rng) => {
    ctx.fillStyle = '#625042'; ctx.fillRect(0, 0, w, h);
    for (let plank = 0; plank < 7; plank++) {
      ctx.fillStyle = ['#79604b', '#705944', '#80684f', '#68523f'][plank % 4];
      ctx.fillRect(0, plank * h / 7, w, h / 7 - 2);
      for (let line = 0; line < 90; line++) {
        const y = plank * h / 7 + rng() * h / 7;
        ctx.strokeStyle = rng() > 0.45 ? `rgba(36,30,24,${rng() * 0.22})` : `rgba(212,169,111,${rng() * 0.13})`;
        ctx.lineWidth = 0.4 + rng() * 1.4;
        ctx.beginPath(); ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + rng() * 9, w * 0.7, y - rng() * 9, w, y + rng() * 5); ctx.stroke();
      }
      ctx.fillStyle = '#312c2470'; ctx.fillRect(0, plank * h / 7, w, 2);
    }
    for (let i = 0; i < 170; i++) {
      ctx.strokeStyle = '#c8b08520'; ctx.lineWidth = rng() + 0.2;
      const x = rng() * w, y = rng() * h;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rng() * 70, y + rng() * 4); ctx.stroke();
    }
    grain(ctx, w, h, rng, 36000);
  }, 12);
  textures.wood.wrapS = textures.wood.wrapT = THREE.RepeatWrapping;

  textures.wall = canvasTexture(256, 256, (ctx, w, h, rng) => {
    ctx.fillStyle = '#566d6b'; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.18; grain(ctx, w, h, rng, 14000); ctx.globalAlpha = 1;
  }, 81);
  textures.wall.wrapS = textures.wall.wrapT = THREE.RepeatWrapping;
  textures.wall.repeat.set(3, 2);

  textures.map = canvasTexture(768, 512, mapPainting, 31);
  textures.photos = [0, 1, 2].map((n) => canvasTexture(384, 320, (ctx, w, h, rng) => photoPainting(ctx, w, h, rng, n), n + 5));
  textures.notes = Array.from({ length: 12 }, (_, i) => canvasTexture(256, 256, (ctx, w, h, rng) => {
    paper(ctx, w, h, rng, ['#d7bc58', '#b4c581', '#95b7b6', '#d1ac81', '#d9c365', '#d0cab0'][i % 6]);
    ctx.fillStyle = '#695f421a'; ctx.fillRect(0, 0, w, 22);
    const copy = [
      ['FOLLOW', 'THE SMALL', 'THINGS.'], ['STILL', 'MISSING', '7 MINUTES.'], ['ASK AGAIN', 'TOMORROW.'],
      ['NOT A', 'COINCIDENCE.'], ['TEA FIRST.', 'THEN', 'THE CASE.'], ['MEET ME', 'AT THE', 'STATION.'],
      ['THANKS FOR', 'FINDING', 'YOUR WAY.'], ['LOOK', 'A LITTLE', 'CLOSER.'], ['WEST', 'MINSTER', '09:15'],
      ['RENT', 'IS DUE!'], ['TAKE', 'A NOTE.'], ['DO NOT', 'LOSE THIS.'],
    ][i];
    ctx.save(); ctx.translate(17, 35); ctx.rotate(-0.025);
    copy.forEach((line, row) => headline(ctx, line, 0, row * 37 + 18, 25, i % 3 === 0 ? '#596249' : '#38514d'));
    writing(ctx, rng, 3, 158, 202, 2, 11); ctx.restore();
    if (i % 3 === 1) { ctx.strokeStyle = '#9f503c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, 157); ctx.lineTo(220, 150); ctx.stroke(); }
  }, 70 + i));
  textures.clippings = Array.from({ length: 8 }, (_, i) => canvasTexture(384, 512, (ctx, w, h, rng) => {
    paper(ctx, w, h, rng, ['#cfccb6', '#c5c7b7', '#d6ccb1', '#bfbb9e'][i % 4]);
    headline(ctx, ['THE EVENING POST', 'WESTMINSTER', 'THE DAILY CLUE', 'FIELD NOTES'][i % 4], 18, 35, 28);
    ctx.strokeStyle = '#626757'; ctx.lineWidth = 2; ctx.strokeRect(18, 47, w - 36, 1);
    if (i % 2 === 0) {
      headline(ctx, ['SEVEN MINUTES LOST', 'A STRANGE AFFAIR', 'CITY AFTER DARK', 'FOLLOW THE THREAD'][i % 4], 18, 78, 23);
      ctx.save(); ctx.translate(19, 96); ctx.scale(0.48, 0.33); photoPainting(ctx, 384, 320, rng, i); ctx.restore();
      writing(ctx, rng, 216, 110, 150, 8, 8);
      writing(ctx, rng, 20, 225, 159, 17, 8); writing(ctx, rng, 202, 225, 160, 17, 8);
    } else {
      writing(ctx, rng, 20, 79, 340, 11, 13);
      headline(ctx, ['FILED: 09.2026', 'NO ANSWER YET'][i % 2], 20, 357, 21, '#954c3e');
      writing(ctx, rng, 20, 387, 340, 4, 11);
    }
  }, 112 + i));

  textures.pages = [0, 1].map((side) => canvasTexture(768, 1024, (ctx, w, h, rng) => {
    paper(ctx, w, h, rng, '#e0d7b9');
    const fold = ctx.createLinearGradient(side === 0 ? w - 100 : 0, 0, side === 0 ? w : 100, 0);
    fold.addColorStop(0, side === 0 ? '#473e2900' : '#473e294b'); fold.addColorStop(1, side === 0 ? '#473e294b' : '#473e2900');
    ctx.fillStyle = fold; ctx.fillRect(side === 0 ? w - 100 : 0, 0, 100, h);
    if (side === 0) {
      headline(ctx, 'WESTMINSTER DETECTIVE AGENCY', 45, 67, 31);
      headline(ctx, 'O. WATSON / PRIVATE INVESTIGATIONS', 47, 104, 20, '#78765c');
      ctx.save(); ctx.translate(88, 148); ctx.rotate(-0.035);
      ctx.fillStyle = '#b4ab8c'; ctx.fillRect(7, 8, 579, 385);
      ctx.fillStyle = '#eae3ce'; ctx.fillRect(0, 0, 574, 376);
      ctx.translate(18, 18); ctx.scale(538 / 384, 326 / 320); photoPainting(ctx, 384, 320, rng, 0); ctx.restore();
      headline(ctx, 'DEAREST OPE,', 51, 597, 37);
      writing(ctx, rng, 52, 641, 606, 10, 16);
      ctx.strokeStyle = '#7f6346'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(57, 937); ctx.lineTo(476, 930); ctx.stroke();
      headline(ctx, 'follow the things that stay with you.', 48, 982, 17, '#6e785f');
    } else {
      headline(ctx, 'EVERY DETAIL TELLS A STORY.', 67, 71, 29);
      ctx.fillStyle = '#a3a38b'; ctx.fillRect(67, 107, 235, 245);
      ctx.save(); ctx.translate(75, 115); ctx.scale(0.57, 0.7); photoPainting(ctx, 384, 320, rng, 1); ctx.restore();
      writing(ctx, rng, 329, 126, 343, 9, 13);
      headline(ctx, 'THE MISSING PART', 64, 418, 31);
      ctx.save(); ctx.translate(62, 453); ctx.scale(640 / 768, 438 / 512); mapPainting(ctx, 768, 512, rng); ctx.restore();
      writing(ctx, rng, 68, 926, 600, 3, 10);
    }
    ctx.fillStyle = '#77775e'; ctx.font = '17px Georgia'; ctx.fillText(side === 0 ? '14' : '15', w / 2, h - 15);
  }, 219 + side));

  textures.chart = canvasTexture(256, 256, (ctx, w, h, rng) => {
    paper(ctx, w, h, rng, '#d7bc58');
    headline(ctx, 'MORE AND MORE', 13, 33, 21, '#a04f35'); headline(ctx, 'DISAPPEARANCES', 13, 57, 20, '#a04f35');
    ctx.strokeStyle = '#9b5837'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(29, 80); ctx.lineTo(29, 206); ctx.lineTo(228, 206); ctx.stroke();
    [0.25, 0.4, 0.38, 0.6, 0.85].forEach((v, i) => { ctx.fillStyle = '#b56936'; ctx.fillRect(42 + i * 36, 205 - v * 132, 22, v * 132); });
    writing(ctx, rng, 25, 229, 200, 1, 8, '#945537');
  }, 260);

  textures.calendar = canvasTexture(384, 448, (ctx, w, h, rng) => {
    paper(ctx, w, h, rng, '#d5d4bb'); headline(ctx, 'SEPTEMBER', 22, 52, 43); headline(ctx, '2026', 275, 86, 27, '#a55940');
    ctx.strokeStyle = '#71817a'; ctx.lineWidth = 2;
    for (let col = 0; col <= 7; col++) { ctx.beginPath(); ctx.moveTo(18 + col * 49, 116); ctx.lineTo(18 + col * 49, 359); ctx.stroke(); }
    for (let row = 0; row <= 5; row++) { ctx.beginPath(); ctx.moveTo(18, 116 + row * 48); ctx.lineTo(361, 116 + row * 48); ctx.stroke(); }
    ctx.font = '22px Courier New'; ctx.fillStyle = '#4b645b';
    for (let day = 1; day <= 30; day++) ctx.fillText(String(day), 28 + ((day + 1) % 7) * 49, 146 + Math.floor((day + 1) / 7) * 48);
    ctx.strokeStyle = '#a85340'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(147, 185, 21, 19, -0.1, 0, Math.PI * 2); ctx.stroke();
    writing(ctx, rng, 25, 397, 310, 2, 9);
  }, 291);

  textures.bookSpines = ['THE ART OF OBSERVATION', 'LONDON ATLAS', 'SCISSORS & DOGS', 'FIELD NOTES', 'A STUDY IN SCARLET'].map((title, i) => canvasTexture(256, 512, (ctx, w, h, rng) => {
    paper(ctx, w, h, rng, ['#476567', '#786a47', '#526479', '#6f7960', '#845749'][i]);
    ctx.strokeStyle = '#cab991'; ctx.lineWidth = 3; ctx.strokeRect(17, 17, w - 34, h - 34);
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; headline(ctx, title, 0, 8, 24, '#d8c99d'); ctx.restore();
  }, 312 + i));

  textures.rain = canvasTexture(512, 768, (ctx, w, h, rng) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const x = rng() * w, y = rng() * h, r = 0.8 + rng() * 2.3;
      ctx.fillStyle = '#d2e9dc47'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.6, -0.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e3f4e02b'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + rng() * 3, y - 7 - rng() * 26); ctx.stroke();
    }
  }, 409);
  return textures;
}

export function disposeDeskTextures(textures) {
  Object.values(textures).flat().forEach((texture) => texture.dispose());
}
