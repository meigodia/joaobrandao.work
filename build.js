const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'public');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

function readCollection(folder) {
  const dir = path.join(ROOT, 'content', folder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const slug = file.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data } = matter(raw);
      return { slug, ...data };
    });
}

const items = [];

for (const p of readCollection('pieces')) {
  items.push({
    kind: 'image',
    src: p.image,
    caption: `${p.title} — ${p.year}`,
    year: p.year,
    project: false,
  });
}

for (const proj of readCollection('projects')) {
  for (const m of (proj.media || [])) {
    const src = m.type === 'video' ? m.video : m.image;
    if (!src) continue;
    items.push({
      kind: m.type,
      src,
      caption: `${proj.title} — ${proj.year}`,
      year: proj.year,
      project: true,
      projectId: proj.slug,
      projectTitle: proj.title,
      projectDescription: proj.description || '',
      projectCredits: proj.credits || '',
    });
  }
}

items.sort((a, b) => (b.year || 0) - (a.year || 0));

fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify({ items }, null, 2));

const copy = (from, to) => {
  const src = path.join(ROOT, from);
  const dst = path.join(OUT, to);
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dst, { recursive: true });
};

copy('admin', 'admin');
copy('media', 'media');
copy('src/index.html', 'index.html');

console.log(`✓ built ${items.length} gallery items`);
