import assert from "node:assert/strict";
import { test } from "node:test";
import { Deck, type Shuffle } from "./Deck";

/** Shuffle die niets schudt — maakt het gedrag deterministisch testbaar. */
const identity: Shuffle = (items) => [...items];

test("herhaalt pas als de hele pool op is", () => {
  const pool = ["a", "b", "c", "d", "e"];
  const deck = new Deck(pool, identity);
  const first = Array.from({ length: pool.length }, () => deck.draw(1)[0]);
  // Alle woorden precies één keer voordat er iets terugkomt.
  assert.deepEqual([...first].sort(), [...pool].sort());
});

test("begint na uitputting een nieuwe volledige ronde", () => {
  const pool = ["a", "b", "c", "d", "e"];
  const deck = new Deck(pool, identity);
  const drawn = Array.from({ length: pool.length * 2 }, () => deck.draw(1)[0]);
  assert.deepEqual([...drawn.slice(0, 5)].sort(), [...pool].sort());
  assert.deepEqual([...drawn.slice(5, 10)].sort(), [...pool].sort());
});

test("één trekking van n geeft n unieke woorden (n <= poolgrootte)", () => {
  const pool = ["a", "b", "c", "d", "e"];
  const deck = new Deck(pool, identity);
  const hand = deck.draw(4);
  assert.equal(hand.length, 4);
  assert.equal(new Set(hand).size, 4);
});

test("meer spelers dan woorden: levert n terug (met dubbels), geen crash", () => {
  const pool = ["a", "b", "c"];
  const deck = new Deck(pool, identity);
  const hand = deck.draw(5);
  assert.equal(hand.length, 5);
});

test("lege pool levert lege trekking, geen oneindige lus", () => {
  const deck = new Deck([], identity);
  assert.deepEqual(deck.draw(3), []);
});

test("geen naadloze herhaling op de grens van twee rondes", () => {
  // Gestuurde shuffle: wisselt per ronde van volgorde af, waardoor zonder de
  // borg het laatste woord van ronde 1 meteen weer bovenaan ronde 2 zou liggen.
  let call = 0;
  const staged: Shuffle = (items) =>
    call++ % 2 === 0 ? [...items] : [...items].reverse();
  const deck = new Deck(["a", "b"], staged);
  const drawn = Array.from({ length: 6 }, () => deck.draw(1)[0]);
  for (let i = 1; i < drawn.length; i++) {
    assert.notEqual(drawn[i], drawn[i - 1], `dubbel op index ${i}: ${drawn}`);
  }
});
