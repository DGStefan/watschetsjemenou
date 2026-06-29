// De beschikbare avatars (bestanden in /public/avatars/).
export const AVATARS = [
  "a01", "a02", "a03", "a04", "a05", "a06",
  "a07", "a08", "a09", "a10", "a11", "a12",
];

/** URL van een avatar-id; valt terug op de eerste bij een onbekende waarde. */
export function avatarUrl(id: string): string {
  const safe = AVATARS.includes(id) ? id : AVATARS[0];
  return `/avatars/${safe}.svg`;
}

/** Een willekeurige avatar (voor de standaardkeuze). */
export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}
