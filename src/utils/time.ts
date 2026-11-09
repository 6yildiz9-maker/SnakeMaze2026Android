export function currentTimeMs(): number {
  return Date.now();
}

export function createRandomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}
