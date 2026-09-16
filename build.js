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

// Standalone pieces: one gallery item each
for (const p of readCollection('pieces')) {
  if (!p.image) continue;
  items.push({
    kind: 'piece',
    src: p.image,
    caption: `${p.title} — ${p.year}`,
    year: p.year,
    project: false,
  });
}

// Projects: ONE gallery item per project, with all media attached
for (const proj of readCollection('projects')) {
  const media = (proj.media || [])
    .map(m => ({
      kind: m.type === 'video' ? 'video' : 'image',
      src: m.type === 'video' ? m.video : m.image,
      title: m.title || '',
    }))
    .filter(m => m.src);

  if (media.length === 0) continue;

  items.push({
    kind: 'project',
    cover: media[0].src,
    coverKind: media[0].kind,
    media: media,
    caption: `${proj.title} — ${proj.year}`,
    year: proj.year,
    project: true,
    projectId: proj.slug,
    projectTitle: proj.title,
    projectDescription: proj.description || '',
    projectCredits: proj.credits || '',
  });
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
