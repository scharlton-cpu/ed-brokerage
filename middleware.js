// Locks everything under /staff behind a branded sign-in page.
//
// Sign in with a user ID and password. Only one-way hashes live here,
// never the password itself. To change them, ask Claude: it regenerates
// SALT, LOGIN_HASH and COOKIE_CHECK below. Nothing needs to be set in Vercel.
// The user ID is not case-sensitive; the password is.
import { next } from '@vercel/functions';

export const config = { matcher: ['/staff', '/staff/:path*'] };

const SALT = '66d9173d44ddec23e53ba1c130c3764e';
const ITERATIONS = 310000;
const LOGIN_HASH = 'e896fa324ba1318438dc50728dc86b07d313b001a83e66e8dbcb1d85e5b975a3';
const COOKIE_CHECK = '8d246c8c7786afe2165461ae30601d9feb79228e8c12026d1b4bac730bf93728';
const COOKIE = 'ed_staff';
const MAX_AGE = 60 * 60 * 24 * 30; // stay signed in for 30 days on that device

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const bytes = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

async function pbkdf2(password, label) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array([...bytes(SALT), ...new TextEncoder().encode(label)]);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256));
}
const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

function same(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function readCookie(request) {
  const raw = request.headers.get('cookie') || '';
  const m = raw.match(/(?:^|;\s*)ed_staff=([a-f0-9]{64})/);
  return m ? m[1] : '';
}

const SECURE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

function page(error, status) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#081C2C"><title>E&amp;D Staff sign in</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#081C2C;color:#F6F5F0;font:400 1rem/1.5 "Inter","Segoe UI",system-ui,-apple-system,sans-serif;padding:24px 16px}
.card{width:100%;max-width:400px;background:#F6F5F0;color:#0b1a26;padding:32px 28px;border-top:4px solid #E9AD34}
.brand{display:flex;align-items:center;gap:12px;margin-bottom:24px}.mark{width:40px;height:40px;display:grid;place-items:center;background:#E9AD34;color:#081C2C;font-weight:800}
.brand b{display:block;font-size:1.05rem}.brand small{color:#6a7680;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase}
h1{font-size:1.5rem;margin:0 0 6px;letter-spacing:-.02em}p{margin:0 0 20px;color:#3c4b57;font-size:.95rem}
label{display:block;font-weight:600;font-size:.88rem;margin-bottom:6px}
.pw{display:flex}input{flex:1;font:inherit;font-size:1rem;padding:13px 12px;border:1px solid #dedbd1;border-bottom:1.5px solid #3c4b57;background:#fff;min-width:0;border-radius:0}
input:focus{outline:none;border-color:#245361;box-shadow:0 0 0 3px rgba(36,83,97,.2)}
.show{border:1px solid #dedbd1;border-left:0;background:#fff;padding:0 14px;font:600 .85rem/1 inherit;color:#245361;cursor:pointer}
.go{width:100%;margin-top:16px;padding:14px;font:600 1rem/1 inherit;background:#E9AD34;color:#081C2C;border:0;cursor:pointer}
button:focus-visible,input:focus-visible{outline:3px solid #E9AD34;outline-offset:2px}
.err{background:#fbe9e7;border-left:3px solid #b3261e;padding:10px 12px;font-size:.9rem;margin-bottom:16px}
.back{display:block;margin-top:18px;text-align:center;color:#245361;font-size:.88rem}
</style></head><body><main class="card">
<div class="brand"><span class="mark">E&amp;D</span><div><b>E&amp;D Brokerage</b><small>Staff area</small></div></div>
<h1>Staff sign in</h1><p>Sign in to open the rental agreement and other staff tools.</p>
${error ? '<div class="err" role="alert">' + error + '</div>' : ''}
<form method="post"><label for="uid">User ID</label>
<input id="uid" name="username" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required autofocus style="width:100%;margin-bottom:14px">
<label for="pw">Password</label>
<div class="pw"><input id="pw" name="password" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" required>
<button type="button" class="show" onclick="var i=document.getElementById('pw');i.type=i.type==='password'?'text':'password';this.textContent=i.type==='password'?'Show':'Hide'">Show</button></div>
<button type="submit" class="go">Sign in</button></form>
<a class="back" href="/">Back to the E&amp;D website</a></main></body></html>`;
  return new Response(html, { status, headers: { ...SECURE, 'Content-Type': 'text/html; charset=utf-8' } });
}

export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === '/staff/logout') {
    return new Response(null, {
      status: 303,
      headers: { ...SECURE, Location: '/staff', 'Set-Cookie': COOKIE + '=; Path=/staff; Max-Age=0; HttpOnly; Secure; SameSite=Lax' },
    });
  }

  const token = readCookie(request);
  if (token && same(await sha256(token), COOKIE_CHECK)) {
    return next({ headers: SECURE });
  }

  if (request.method === 'POST') {
    let pw = '', uid = '';
    try {
      const f = await request.formData();
      pw = String(f.get('password') || '');
      uid = String(f.get('username') || '').trim().toLowerCase();
    } catch (e) { pw = ''; uid = ''; }
    const secret = uid + ':' + pw;
    if (uid && pw && same(await pbkdf2(secret, 'login'), LOGIN_HASH)) {
      const cookie = await pbkdf2(secret, 'cookie');
      return new Response(null, {
        status: 303,
        headers: {
          ...SECURE,
          Location: url.pathname + url.search,
          'Set-Cookie': COOKIE + '=' + cookie + '; Path=/staff; Max-Age=' + MAX_AGE + '; HttpOnly; Secure; SameSite=Lax',
        },
      });
    }
    return page("That user ID or password didn't work. Check the capital letters and symbols, then try again.", 401);
  }

  return page('', 401);
}
