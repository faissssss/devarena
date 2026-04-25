export default function SectionHeading({ eyebrow, title, body, align = 'left' }) {
  const centered = align === 'center';
  return (
    <div style={{ textAlign: centered ? 'center' : 'left' }}>
      {eyebrow && (
        <p className="text-eyebrow" style={{ marginBottom: 12 }}>
          {eyebrow}
        </p>
      )}
      <h2 className="text-section" style={{ margin: 0, color: 'var(--color-dark)' }}>
        {title}
      </h2>
      {body && (
        <p
          className="text-body-serif"
          style={{
            marginTop: 16,
            maxWidth: 560,
            color: 'var(--text-secondary)',
            marginLeft: centered ? 'auto' : undefined,
            marginRight: centered ? 'auto' : undefined,
          }}
        >
          {body}
        </p>
      )}
    </div>
  );
}
