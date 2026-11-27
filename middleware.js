// Password-protects everything under /staff (the hidden staff pages).
// The username and password are NOT stored here. Set them in Vercel:
//   Project → Settings → Environment Variables
//     STAFF_USER      (optional, defaults to "staff")
//     STAFF_PASSWORD  (required; until it is set, /staff stays locked)
// Then redeploy so the new values take effect.
import { next } from '@vercel/functions';

export const config = {
  matcher: ['/staff', '/staff/:path*'],
};

function same(a, b) {
  // Compare without stopping at the first different character.
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

const locked = (msg) =>
  new Response(msg, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="E&D Brokerage staff", charset="UTF-8"',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });

export default function middleware(request) {
  const user = process.env.STAFF_USER || 'staff';
  const pass = process.env.STAFF_PASSWORD;
  if (!pass) return locked('The staff area is locked until a password is set in Vercel (STAFF_PASSWORD).');

  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try { decoded = atob(encoded); } catch (e) { decoded = ''; }
    const i = decoded.indexOf(':');
    if (i > -1 && same(decoded.slice(0, i), user) && same(decoded.slice(i + 1), pass)) {
      return next({ headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
    }
  }
  return locked('Staff only. Please sign in.');
}
