export function AuthIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 320" fill="none" className={className} aria-hidden="true">
      <ellipse cx="240" cy="310" rx="190" ry="10" className="fill-primary/10" />

      {/* browser window */}
      <rect x="250" y="20" width="190" height="130" rx="10" className="fill-primary/15 stroke-primary/30" strokeWidth="2" />
      <circle cx="266" cy="36" r="3.5" className="fill-primary/40" />
      <circle cx="279" cy="36" r="3.5" className="fill-primary/40" />
      <rect x="264" y="52" width="100" height="62" rx="6" className="fill-card" />
      <path d="M306 70l22 13-22 13z" className="fill-primary" />
      {[56, 72, 88, 104].map((y) => (
        <rect key={y} x="376" y={y} width="50" height="6" rx="3" className="fill-primary/30" />
      ))}

      {/* chat bubble */}
      <path
        d="M70 60h100a16 16 0 0 1 16 16v14a16 16 0 0 1-16 16H100l-20 16v-16H70a16 16 0 0 1-16-16V76a16 16 0 0 1 16-16z"
        className="fill-primary"
      />
      <circle cx="94" cy="83" r="5" fill="white" />
      <circle cx="112" cy="83" r="5" fill="white" />
      <circle cx="130" cy="83" r="5" fill="white" />

      {/* floating card */}
      <rect x="330" y="180" width="110" height="34" rx="6" className="fill-primary/20 stroke-primary/30" />
      <rect x="342" y="193" width="70" height="5" rx="2.5" className="fill-primary/40" />

      {/* laptop */}
      <rect x="130" y="160" width="180" height="115" rx="10" className="fill-primary" />
      <rect x="140" y="170" width="160" height="95" rx="6" fill="white" fillOpacity="0.2" />
      <circle cx="220" cy="218" r="9" fill="white" />
      <path d="M100 275h240a10 10 0 0 1-10 14H110a10 10 0 0 1-10-14z" className="fill-primary/60" />

      {/* leaves */}
      <path d="M60 300c-10-40 0-80 30-100 10 40 0 80-30 100z" className="fill-primary/15" />
      <path d="M40 300c-6-30 6-60 24-76 4 30-6 60-24 76z" className="fill-primary/25" />
    </svg>
  );
}