// Real SVG icons for social platforms

export function InstagramIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-gradient)" strokeWidth="2"/>
      <circle cx="12" cy="12" r="5" stroke="url(#ig-gradient)" strokeWidth="2"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-gradient)"/>
      <defs>
        <linearGradient id="ig-gradient" x1="2" y1="22" x2="22" y2="2">
          <stop stopColor="#FFDC80"/>
          <stop offset="0.3" stopColor="#F77737"/>
          <stop offset="0.6" stopColor="#E1306C"/>
          <stop offset="1" stopColor="#833AB4"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TikTokIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16.6 5.82C15.9164 5.03962 15.5397 4.03743 15.54 3H12.45V15.4C12.4262 16.0712 12.1429 16.7071 11.6598 17.1735C11.1767 17.6399 10.5315 17.9007 9.86 17.9C8.44 17.9 7.26 16.74 7.26 15.3C7.26 13.58 8.92 12.29 10.63 12.82V9.66C7.18 9.2 4.16 11.88 4.16 15.3C4.16 18.63 6.92 21 9.85 21C12.99 21 15.54 18.45 15.54 15.3V9.01C16.793 9.90985 18.2974 10.3926 19.84 10.39V7.3C19.84 7.3 17.96 7.39 16.6 5.82Z" fill="#000000"/>
    </svg>
  );
}

export function LinkedInIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20.447 20.452H16.893V14.883C16.893 13.555 16.866 11.846 15.041 11.846C13.188 11.846 12.905 13.291 12.905 14.785V20.452H9.351V9H12.765V10.561H12.811C13.288 9.661 14.448 8.711 16.181 8.711C19.782 8.711 20.448 11.081 20.448 14.166V20.452H20.447ZM5.337 7.433C4.193 7.433 3.274 6.507 3.274 5.368C3.274 4.23 4.194 3.305 5.337 3.305C6.477 3.305 7.401 4.23 7.401 5.368C7.401 6.507 6.476 7.433 5.337 7.433ZM7.119 20.452H3.555V9H7.119V20.452Z" fill="#0A66C2"/>
    </svg>
  );
}

export function FacebookIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M24 12C24 5.373 18.627 0 12 0S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.469H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12Z" fill="#1877F2"/>
    </svg>
  );
}

export function XIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" fill="#0F172A"/>
    </svg>
  );
}

export function RedditIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0Zm6.066 13.654c.038.21.058.424.058.64 0 3.268-3.804 5.916-8.498 5.916s-8.498-2.648-8.498-5.916c0-.217.02-.432.06-.644a1.736 1.736 0 0 1-.962-1.554 1.737 1.737 0 0 1 2.94-1.253c1.418-.98 3.363-1.607 5.555-1.682l1.093-5.14a.37.37 0 0 1 .443-.28l3.597.766a1.23 1.23 0 1 1-.134.597l-3.262-.694-.96 4.517c2.136.094 4.028.725 5.41 1.693a1.735 1.735 0 0 1 2.92 1.269 1.736 1.736 0 0 1-.762 1.437ZM8.798 12.47a1.34 1.34 0 1 0 0 2.68 1.34 1.34 0 0 0 0-2.68Zm6.406 0a1.34 1.34 0 1 0 0 2.68 1.34 1.34 0 0 0 0-2.68ZM15.158 17c-.18.21-.486.32-.777.32h-.01c-.291 0-.604-.113-.785-.32-.432-.5-1.22-.75-1.586-.75s-1.154.25-1.586.75c-.18.207-.494.32-.785.32h-.01a.97.97 0 0 1-.777-.32.715.715 0 0 1 .078-.998c.584-.673 1.687-1.082 3.08-1.082s2.496.41 3.08 1.082a.714.714 0 0 1 .078.998Z" fill="#FF4500"/>
    </svg>
  );
}
