/**
 * A drawn arrow. The diagonal arrow characters are not in the site's typeface, so
 * phones fill them in from their emoji font; a line drawing always matches the text.
 * Points up-right (opens elsewhere) or down-right (moves down the page).
 */
export function Arrow({ dir = 'ne' }: { dir?: 'ne' | 'se' }) {
  return (
    <svg
      className={dir === 'se' ? 'arrow arrow--down' : 'arrow'}
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      <path d={dir === 'se' ? 'M1.75 1.75 10 10M10 3.75V10H3.75' : 'M1.75 10.25 10 2M3.75 2H10v6.25'} />
    </svg>
  );
}
