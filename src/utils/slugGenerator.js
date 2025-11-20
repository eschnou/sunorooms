const adjectives = [
  'funky',
  'groovy',
  'electric',
  'cosmic',
  'stellar',
  'neon',
  'retro',
  'smooth',
  'jazzy',
  'vibrant',
];

const animals = [
  'tiger',
  'panda',
  'eagle',
  'dolphin',
  'phoenix',
  'lion',
  'wolf',
  'falcon',
  'dragon',
  'unicorn',
];

export function generateRoomSlug() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}-${animal}-${num}`;
}
