/** The hairline that opens a section, drawn in from the left as it scrolls into view. */
export function SectionRule() {
  return (
    <div className="wrap section__rule" aria-hidden="true">
      <span data-reveal="rule" />
    </div>
  );
}
