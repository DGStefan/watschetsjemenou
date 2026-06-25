// Instellingen, overschrijfbaar via environment variables (handig in Coolify).
// Voor testen ruim gezet; zet drawSeconds later op 30 en minPlayers op 4.

export const config = {
  port: Number(process.env.PORT) || 3000,
  minPlayers: Number(process.env.MIN_PLAYERS) || 2,
  drawSeconds: Number(process.env.DRAW_SECONDS) || 60,
  guessSeconds: Number(process.env.GUESS_SECONDS) || 45,
  relaySeconds: Number(process.env.RELAY_SECONDS) || 12, // 'kijk & geef door' (oneven spelers)
  passMs: 3500, // duur van het doorgeef-tussenscherm
  graceMs: 2000, // extra marge voordat de server een fase forceert

  // Puntentelling (een kleine tikfout "bijna" telt mee als goed geraden).
  points: {
    correctGuessDrawer: 2, // jouw tekening goed geraden -> jij (tekenaar)
    correctGuessGuesser: 2, // jij raadt de vorige tekening goed -> jij (rader)
    wordSurvived: 4, // jouw beginwoord klopt nog aan het eind -> jij (eigenaar)
  },
} as const;
