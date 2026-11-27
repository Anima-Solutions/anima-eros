"""Server-rendered /login page (no React, no SPA bundle, no injected token).

Providers come from the registry; an OAuth provider renders an anchor to
``/auth/login?provider=<name>``, a ``supports_password`` provider renders a
credential form wired by :data:`_PASSWORD_FORM_SCRIPT`. The page is the Ânima
design system's ``AuthScreen`` (stacked Ânima logo, one centred card, product
caption, brand glow) rebuilt in plain HTML/CSS with the DS dark tokens; Inter
loads from Google Fonts and falls back to the system sans when unreachable.

The ``class="provider-btn"`` anchor is test-stable: the suite extracts its
href to walk the OAuth flow.
"""
from __future__ import annotations

import html
from urllib.parse import quote, urlencode

from hermes_cli.dashboard_auth import list_interactive_providers, list_session_providers

_PRODUCT_NAME = "Ânima Eros"

# The DS ``AnimaLogo variant="stacked"`` artwork (brand/anima/logotipo-ontop), tinted by
# ``currentColor`` like the DS component.
_ANIMA_LOGO_SVG = (
    '<svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1666.46 1703.34" fill="currentColor" role="img" aria-label="Ânima"><path d="M0,1698.01h58.62l29.85-77.27h178.53l30.91,77.27h58.62l-148.69-353.33h-59.69L0,1698.01ZM105.52,1574.9l72.48-168.4,73.01,168.4H105.52ZM143.36,1315.37l34.64-49.03,35.17,49.03h49.56l-74.61-96.46h-19.71l-74.61,96.46H143.36Z"/><path d="M424.74,1698.01h51.16v-140.16c0-38.37,25.05-66.62,65.02-66.62s65.02,28.25,65.02,66.62v140.16h51.69v-147.09c0-62.88-47.43-108.18-116.71-108.18s-116.18,46.36-116.18,109.25V1698.01Z"/><path d="M808.45,1698.01v-249.94h-51.69v249.94H808.45ZM782.87,1396.37c18.65,0,31.97-13.32,31.97-31.97s-13.32-31.98-31.97-31.98-31.98,13.33-31.98,31.98S764.22,1396.37,782.87,1396.37Z"/><path d="M907.04,1698.01h51.69v-141.23c0-38.37,24.52-65.55,62.89-65.55s63.95,27.18,63.95,65.55v141.23h51.16v-141.23c0-38.37,26.12-65.55,64.49-65.55s62.88,27.18,62.88,65.55v141.23h51.16v-148.69c0-65.01-45.83-106.58-114.04-106.58-38.37,0-70.88,14.92-90.6,38.37-19.72-22.92-52.23-38.37-89-38.37-68.75,0-114.58,40.5-114.58,105.52V1698.01Z"/><path d="M1526.83,1703.34c42.1,0,70.35-15.46,89-39.44v34.11h50.63v-124.71c0-79.93-56.49-130.56-132.7-130.56s-132.7,57.02-132.7,130.56S1455.42,1703.34,1526.83,1703.34ZM1532.7,1656.44c-47.97,0-79.94-36.77-79.94-83.14s34.64-82.07,81.53-82.07,81.01,37.84,81.01,80.48C1615.3,1618.07,1581.19,1656.44,1532.7,1656.44Z"/><path fill-rule="evenodd" d="M225.39,917.94v-3.18L658.17,0h350.11l432.78,914.76v3.18l-236.5,283.15c-247.56-115.43-495.11-112.37-742.67,0L225.39,917.94ZM825.95,117.72l-400.12,865.51c-1.21,2.62-1.04,5.7.43,8.15,1.48,2.46,4.07,3.95,6.84,3.95,243.78-121.33,509.49-128.43,800.25,0,2.78,0,5.36-1.49,6.84-3.95,1.47-2.45,1.64-5.53.43-8.15L840.5,117.72c-1.35-2.92-4.17-4.77-7.27-4.77S827.3,114.8,825.95,117.72Z"/></svg>'
)

# Values are the DS dark-theme tokens (tokens.css ``.dark``); class names mirror the DS
# component each block stands in for (Card, Button size="lg", Input, Label).
_PAGE_STYLE = """\
  :root {
    color-scheme: dark;
    --background: #11141b;
    --foreground: #f7faff;
    --card: #171b23;
    --muted-foreground: #9aa1af;
    --primary: #c5fe59;
    --primary-foreground: #11141b;
    --primary-active: color-mix(in oklch, #c5fe59, white 30%);
    --input: rgb(247 250 255 / 0.08);
    --ring: #c5fe59;
    --destructive: #e84a45;
  }
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; min-height: 100%; }
  body {
    background-color: var(--background);
    background-image: radial-gradient(55% 40% at 80% 0%,
      color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%);
    background-repeat: no-repeat;
    background-attachment: fixed;
    color: var(--foreground);
    font-family: "Inter", -apple-system, system-ui, sans-serif;
    font-optical-sizing: auto;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  main {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    padding: 3rem 1rem;
  }
  .logo { height: 4rem; width: auto; color: var(--foreground); }
  .card {
    width: 100%;
    max-width: 24rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--card);
    border-radius: 28px;
    box-shadow: 0 0 0 1px rgb(247 250 255 / 0.1), 0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
  }
  .card-header { display: grid; gap: 0.75rem; justify-items: center; text-align: center; }
  h1 { margin: 0; font-size: 18px; font-weight: 500; line-height: 1.3; letter-spacing: -0.01em; }
  .card-header p, .card-body p {
    margin: 0; color: var(--muted-foreground); font-size: 13px; line-height: 1.45;
  }
  .card-body { display: flex; flex-direction: column; gap: 0.75rem; }
  .card-footer, .caption {
    margin: 0; text-align: center; color: var(--muted-foreground); font-size: 12px; line-height: 1.4;
  }
  code {
    padding: 0.1em 0.35em;
    border-radius: 6px;
    background: var(--input);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.9em;
  }
  a { color: var(--foreground); text-decoration-color: var(--primary); text-underline-offset: 4px; }
  ::selection { background: var(--primary); color: var(--primary-foreground); }
"""

# Sign-in controls, only on pages that render them: the notice pages carry no
# provider-btn/provider-form markup at all, CSS included.
_CONTROLS_STYLE = """\
  .provider-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .provider-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 2.5rem;
    padding: 0 1rem;
    border: 1px solid transparent;
    border-radius: 12px;
    background: var(--primary);
    color: var(--primary-foreground);
    font: inherit;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.15s;
  }
  .provider-btn:hover, .provider-btn:active { background: var(--primary-active); }
  .provider-btn:active { transform: translateY(1px); }
  .provider-btn:disabled { opacity: 0.5; pointer-events: none; }
  .provider-btn:focus-visible, .field-input:focus-visible {
    outline: none;
    border-color: var(--ring);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 30%, transparent);
  }
  .provider-form { display: flex; flex-direction: column; gap: 0.75rem; }
  .form-title { color: var(--muted-foreground); font-size: 12px; text-align: center; }
  .field { display: flex; flex-direction: column; gap: 0.5rem; }
  .field-label { font-size: 14px; font-weight: 500; line-height: 1; }
  .field-input {
    width: 100%;
    height: 2.25rem;
    padding: 0.25rem 0.75rem;
    border: 1px solid transparent;
    border-radius: 12px;
    background: color-mix(in srgb, var(--input) 50%, transparent);
    color: var(--foreground);
    font: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .form-error { color: var(--destructive); font-size: 13px; }
  .provider-form .provider-btn { margin-top: 0.25rem; }
"""


def _page_html(*, title: str, card: str, controls: bool = False, script: str = "") -> str:
    """One ``AuthScreen``: the stacked logo, *card* (pre-built HTML) and the product caption.

    Every login-family page goes through here so they share one look. Built by
    concatenation, never ``str.format``: the CSS braces stay literal.
    """
    return (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
        f"<title>{title} — {_PRODUCT_NAME}</title>\n"
        "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n"
        "<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n"
        "<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?"
        "family=Inter:opsz,wght@14..32,100..900&amp;display=swap\">\n"
        f"<style>\n{_PAGE_STYLE}{_CONTROLS_STYLE if controls else ''}</style>\n</head>\n<body>\n<main>\n"
        f"  {_ANIMA_LOGO_SVG}\n"
        f"  <div class=\"card\">\n{card}\n  </div>\n"
        f"  <p class=\"caption\">{_PRODUCT_NAME}</p>\n"
        f"</main>\n{script}</body>\n</html>\n"
    )


def _login_page(provider_buttons: str, password_script: str) -> str:
    return _page_html(
        title="Sign in",
        card=("    <div class=\"card-header\">\n      <h1>Sign in</h1>\n"
              f"      <p>Choose a sign-in method to continue to {_PRODUCT_NAME}.</p>\n    </div>\n"
              f"    <div class=\"provider-list\">\n{provider_buttons}\n    </div>\n"
              "    <p class=\"card-footer\">Public bind &middot; Auth required</p>"),
        controls=True,
        script=password_script,
    )


_EMPTY_HTML = _page_html(
    title="Sign-in unavailable",
    card="""\
    <div class="card-header"><h1>Sign-in unavailable</h1></div>
    <div class="card-body">
      <p>This dashboard is bound to a non-loopback host but no authentication
      providers are available.</p>
      <p>Configure the bundled username/password provider or an OAuth provider.
      See the <a href="https://hermes-agent.nousresearch.com/docs/user-guide/features/web-dashboard#authentication-gated-mode">dashboard
      authentication documentation</a> for setup instructions.</p>
      <p>For auth-free local use, bind to <code>127.0.0.1</code> and connect through
      an SSH tunnel or Tailscale.</p>
    </div>""",
)

# Token-gated deployment (every registered provider is provisioned-credential-only):
# there is nothing to click, so the page explains the credential channel instead of
# rendering an empty options list. {provider_names} / {note} are pre-escaped HTML.
_TOKEN_MODE_HTML = _page_html(
    title="Token-gated dashboard",
    card="""\
    <div class="card-header"><h1>Token-gated dashboard</h1></div>
    <div class="card-body">
      <p>This deployment authenticates with a provisioned credential
      ({provider_names}), not a browser sign-in.</p>
      <p>{note}</p>
    </div>""",
)

# Loopback gateway-hosted Webapp (``private_launch(app.state)``): browser login cookies on
# 127.0.0.1 are shared across ports (RFC 6265 §8.5), so the loopback Webapp opens strictly
# via a ``hermes webapp`` private launch link rather than browser sign-in cookies.
_PRIVATE_LAUNCH_HTML = _page_html(
    title="Launch-link sign-in",
    card="""\
    <div class="card-header"><h1>Open with hermes webapp</h1></div>
    <div class="card-body">
      <p>This local loopback Webapp opens through a private launch link,
      not browser sign-in cookies.</p>
      <p>Run <code>hermes webapp</code> on this computer to open and sign
      this browser in.</p>
      <p>To use browser sign-in over the network, bind the Webapp to a
      non-loopback address or set <code>webapp.public_url</code>.</p>
    </div>""",
)


def render_private_launch_html() -> str:
    """Return the notice-only HTML for ``GET /login`` on a loopback Webapp."""
    return _PRIVATE_LAUNCH_HTML


# Emitted ONLY when a ``supports_password`` provider is listed, so OAuth-only
# login pages stay script-free. Plain string (not ``str.format``): braces are
# literal. One delegated submit handler covers every form; the provider name
# comes from the form's ``data-provider`` attribute.
#
# Reverse-proxy prefix support: the script reads ``data-prefix`` from the
# ``<main>`` element (set by :func:`render_login_html`) and prepends it
# to the POST target and the post-login landing path so the login flow
# works behind ``X-Forwarded-Prefix`` proxies.
_PASSWORD_FORM_SCRIPT = """\
<script>
(function () {
  var mainEl = document.querySelector('main');
  var prefix = (mainEl && mainEl.getAttribute('data-prefix')) || '';
  function handle(form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = form.querySelector('.form-error');
      var btn = form.querySelector('button[type=submit]');
      if (err) { err.hidden = true; err.textContent = ''; }
      if (btn) { btn.disabled = true; }
      var body = {
        provider: form.getAttribute('data-provider') || '',
        username: (form.querySelector('input[name=username]') || {}).value || '',
        password: (form.querySelector('input[name=password]') || {}).value || '',
        next: (form.querySelector('input[name=next]') || {}).value || ''
      };
      fetch(prefix + '/auth/password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin'
      }).then(function (resp) {
        if (resp.ok) {
          return resp.json().then(function (data) {
            window.location.assign((data && data.next) || (prefix + '/'));
          });
        }
        var msg = resp.status === 429
          ? 'Too many attempts. Please wait and try again.'
          : (resp.status === 401 ? 'Invalid username or password.'
                                 : 'Sign-in failed. Please try again.');
        if (err) { err.textContent = msg; err.hidden = false; }
        if (btn) { btn.disabled = false; }
      }).catch(function () {
        if (err) { err.textContent = 'Network error. Please try again.'; err.hidden = false; }
        if (btn) { btn.disabled = false; }
      });
    });
  }
  var forms = document.querySelectorAll('form.provider-form');
  for (var i = 0; i < forms.length; i++) { handle(forms[i]); }
})();
</script>
"""


def render_login_html(*, next_path: str = "", prefix: str = "") -> str:
    """Return the full HTML for ``GET /login``.

    ``next_path`` is threaded into each provider button/form so the OAuth round
    trip carries it end-to-end. The caller validates it same-origin; it is
    HTML-escaped here as defence in depth.

    ``prefix`` — when set, the path prefix from ``X-Forwarded-Prefix``
    (e.g. ``"/hermes"``). Prepended to all auth URLs so the login page
    works behind a reverse proxy that mounts the dashboard at a
    sub-path. Empty string (default) means no prefix — bare-root
    deploys are unaffected.
    """
    providers = list_session_providers()
    if not providers:
        return _EMPTY_HTML
    # URL-encode then HTML-escape, matching the gate's ``_safe_next_target``
    # shape so a round-tripped value is byte-identical.
    next_qs = f"&next={html.escape(quote(next_path, safe=''), quote=True)}" if next_path else ""
    interactive = list_interactive_providers()
    if not interactive:
        # A deployment authenticated by a provisioned credential (e.g. the
        # session-token provider): there is nothing to click. Say so instead of
        # rendering a page with no sign-in options.
        names = ", ".join(html.escape(p.display_name) for p in providers)
        # str.replace, not str.format: the template's CSS braces are literal.
        return (_TOKEN_MODE_HTML
                .replace("{provider_names}", names)
                .replace("{note}",
                         "Clients authenticate with the deployment&rsquo;s provisioned "
                         "credential (<code>Authorization: Bearer</code>, or "
                         "<code>?token=</code> on the /api/ws upgrade) &mdash; e.g. Hermes "
                         "Desktop&rsquo;s &ldquo;Session token&rdquo; remote-gateway field. "
                         "There is no browser sign-in flow."))
    buttons = [
        _render_password_form(p, next_path, prefix=prefix)
        if getattr(p, "supports_password", False) else
        f'      <a class="provider-btn" '
        f'href="{prefix}/auth/login?provider={html.escape(p.name, quote=True)}{next_qs}">'
        f'Sign in with {html.escape(p.display_name)}</a>'
        for p in interactive
    ]
    needs_password_script = any(getattr(p, "supports_password", False) for p in interactive)
    html_out = _login_page("\n".join(buttons),
                           _PASSWORD_FORM_SCRIPT if needs_password_script else "")
    # Inject the reverse-proxy prefix so the password-login JS can read
    # it from the <main> element's data attribute.
    return _apply_proxy_prefix(html_out, prefix)


def _apply_proxy_prefix(html_out: str, prefix: str) -> str:
    """Rewrite a rendered login-family page for a reverse-proxy sub-path.

    A no-op when *prefix* is empty (bare-root deploys are byte-for-byte
    unaffected): ``<main>`` gains ``data-prefix`` so the password-login JS (a
    plain string, never ``str.format``-aware) can prepend the prefix to its
    fetch target and post-login landing. The font is an absolute Google Fonts
    URL and needs no rewrite.
    """
    if not prefix:
        return html_out
    return html_out.replace("<main>", f'<main data-prefix="{prefix}">', 1)


def render_native_provider_choice_html(
        *, providers, authorize_path: str, code_challenge: str,
        code_challenge_method: str, redirect_uri: str, state: str,
        prefix: str = "") -> str:
    """Provider picker for a native authorize request with more than one interactive provider.

    Every link re-enters ``/auth/native/authorize`` with the SAME desktop PKCE inputs plus an
    explicit ``provider``, so the choice never leaves the validated native flow. ``prefix``
    (from ``X-Forwarded-Prefix``) marks the page so it works behind
    a reverse-proxy sub-path; the buttons' ``authorize_path`` is already prefixed by the caller.
    """
    common = {"code_challenge": code_challenge, "code_challenge_method": code_challenge_method,
              "redirect_uri": redirect_uri, "state": state}
    buttons = []
    for p in providers:
        href = html.escape(f"{authorize_path}?{urlencode({**common, 'provider': p.name})}",
                           quote=True)
        buttons.append(f'      <a class="provider-btn" href="{href}">'
                       f'Sign in with {html.escape(p.display_name)}</a>')
    if not buttons:
        return _EMPTY_HTML
    return _apply_proxy_prefix(_login_page("\n".join(buttons), ""), prefix)


def _render_password_form(provider, next_path: str, *, prefix: str = "") -> str:
    """Username/password form for a ``supports_password`` provider.

    ``next_path`` rides in a hidden field (already validated by the caller,
    HTML-escaped here). The provider name is a ``data-`` attribute so the
    script does not depend on field ordering.

    ``prefix`` — reverse-proxy path prefix (e.g. ``"/hermes"``); kept for
    interface parity with the other renderers (the submit handler reads
    the prefix from ``<main data-prefix>``).
    """
    pname = html.escape(provider.name, quote=True)
    plabel = html.escape(provider.display_name)
    safe_next = html.escape(next_path, quote=True) if next_path else ""
    return (
        f'      <form class="provider-form" data-provider="{pname}" '
        f'autocomplete="on">\n'
        f'        <div class="form-title">Sign in with {plabel}</div>\n'
        f'        <input type="hidden" name="next" value="{safe_next}">\n'
        f'        <label class="field">\n'
        f'          <span class="field-label">Username</span>\n'
        f'          <input class="field-input" type="text" name="username" '
        f'autocomplete="username" autocapitalize="none" '
        f'autocorrect="off" spellcheck="false" required>\n'
        f'        </label>\n'
        f'        <label class="field">\n'
        f'          <span class="field-label">Password</span>\n'
        f'          <input class="field-input" type="password" name="password" '
        f'autocomplete="current-password" required>\n'
        f'        </label>\n'
        f'        <div class="form-error" role="alert" hidden></div>\n'
        f'        <button class="provider-btn" type="submit">Sign in</button>\n'
        f'      </form>'
    )
