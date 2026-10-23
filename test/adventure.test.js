import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidAdventureFavorite, isValidAdventureProfile } from '../backend/lambda/validation.mjs';
import { destinations, regions, corridors } from '../static/adventure/catalog.js';

test('adventure profile accepts optional dreams and rejects unbounded input', () => {
  assert.equal(isValidAdventureProfile({ answers: { landscape: 'coast' }, dreams: [], completed: false }), true);
  assert.equal(isValidAdventureProfile({ answers: {}, dreams: ['x'.repeat(181)] }), false);
  assert.equal(isValidAdventureProfile({ answers: { nope: 'x' }, dreams: [] }), false);
});
test('favorite selection is constrained to known states and safe ids', () => {
  assert.equal(isValidAdventureFavorite({ destinationId: 'isle-of-skye', status: 'love' }), true);
  assert.equal(isValidAdventureFavorite({ destinationId: '../bad', status: 'love' }), false);
  assert.equal(isValidAdventureFavorite({ destinationId: 'isle-of-skye', status: 'forever' }), false);
});
test('catalog covers every required territory and keeps stable destination ids', () => {
  for (const country of ['Inglaterra', 'Gales', 'Escocia', 'Irlanda del Norte', 'República de Irlanda']) assert.ok(regions.some((region) => region.country === country), country);
  assert.ok(destinations.length >= 50);
  assert.equal(new Set(destinations.map((destination) => destination.id)).size, destinations.length);
  assert.ok(destinations.every((destination) => destination.source && Array.isArray(destination.tags) && destination.editorial >= 1 && destination.editorial <= 5));
});
test('logistical corridors are explicit rather than inferred from visit duration', () => {
  assert.ok(corridors.length >= 4);
  assert.ok(corridors.every((corridor) => corridor.regions.length >= 2 && corridor.note.length > 20));
});
test('private adventure implementation uses signed HttpOnly sessions, CSRF and server-side profiles', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../backend/lambda/index.mjs', import.meta.url), 'utf8'));
  const terraform = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../infra/terraform/aws/sudoku.tf', import.meta.url), 'utf8'));
  assert.match(source, /HttpOnly; Secure; SameSite=Strict/);
  assert.match(source, /x-csrf-token/);
  assert.match(source, /passwordMatches/);
  assert.match(source, /adventure#\$\{userId\}/);
  assert.match(source, /attempts >= 5/);
  assert.match(source, /const \[, n, r, p, salt, hash\] = parts;/);
  assert.match(terraform, /ANY \/api\/adventure\/\{proxy\+\}/);
});
