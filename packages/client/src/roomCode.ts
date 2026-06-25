// Genereert een willekeurige spelcode: 5 tekens, hoofdletters + cijfers.
// Verwarrende tekens (0/O, 1/I/L) zijn weggelaten zodat de code goed
// over te typen is.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function randomRoomCode(length = 5): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}
