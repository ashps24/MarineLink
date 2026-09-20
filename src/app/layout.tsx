import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { AuthGate } from "@/components/auth/auth-gate";
import { DeepLinkResolver } from "@/components/layout/deep-link-resolver";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Display face for page titles and metrics. */
const manrope = Manrope({
  variable: "--font-heading-family",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Hosting-specific recovery, enabled only for Catalyst Slate builds.
 *
 * Slate serves a file only on an exact path match and hands out the root
 * document for everything else, so a deep link arrives carrying the dashboard's
 * markup. Park the requested path and reset the address bar to "/" before React
 * boots, so hydration happens against the document we were actually served;
 * <DeepLinkResolver> then navigates to the parked path for real.
 *
 * On a host that resolves paths correctly (Vercel, `next start`, any static
 * server with directory indexes) the served document already matches the URL,
 * and parking it would strand the router on the wrong tree — so this is gated
 * behind a build flag the Slate deploy script sets, rather than sniffed at
 * runtime. Everything here has to work when the JS bundle itself cannot load,
 * which is why it is inline and dependency-free.
 */
const SLATE_FALLBACK_HOSTING = process.env.NEXT_PUBLIC_SLATE_FALLBACK === "1";

const bootstrapScript = `(function () {
  // Only ever park something that can actually be an app route. Parking a
  // static asset or an RSC payload URL is how this turns into a loop: the
  // resolver replays it, the router cannot match it, the browser hard-loads it,
  // and the script parks it again on arrival.
  var isRoute = function (p) {
    if (!p || p.charAt(0) !== '/') return false;
    if (p.indexOf('/_next/') === 0) return false;
    var last = p.split('?')[0].split('#')[0].split('/').filter(Boolean).pop() || '';
    return last.indexOf('.') === -1;
  };

  // Captured before anything rewrites the address bar, so the stale-document
  // reload below can return to the page that was actually asked for.
  var requested = window.location.pathname + window.location.search + window.location.hash;

  // Recover anyone stranded on an RSC payload URL by a hard-navigation
  // fallback: /dealers/index.txt is really /dealers/.
  requested = requested.replace(/\\/index\\.txt(?=($|[?#]))/, '/');

  // Catalyst's sign-in redirect lands on /app/, the legacy Web Client path
  // that Slate has no equivalent for. Treat it as "go to the dashboard"
  // rather than parking a route the app does not have.
  var isLegacyAppPath = /^\\/app(\\/|$)/.test(window.location.pathname);
  if (isLegacyAppPath) {
    try {
      window.history.replaceState(null, '', '/');
    } catch (e) {}
    requested = '/';
  }

  var isDeepLink = !isLegacyAppPath
    && window.location.pathname.replace(/\\/+$/, '') !== ''
    && isRoute(requested);

  // --- Deep links -----------------------------------------------------------
  try {
    if (isDeepLink) {
      // Timestamped so a value left behind by an abandoned load can never
      // hijack a later visit to the site.
      window.sessionStorage.setItem(
        'marinelink:deeplink',
        JSON.stringify({ p: requested, t: Date.now() })
      );
      window.history.replaceState(null, '', '/');
      document.documentElement.setAttribute('data-deeplink', 'resolving');
    } else {
      window.sessionStorage.removeItem('marinelink:deeplink');
      if (!isRoute(requested) && window.location.pathname.indexOf('/_next/') !== 0) {
        window.history.replaceState(null, '', '/');
      }
    }
  } catch (e) {}

  // --- Stale document recovery ---------------------------------------------
  // Slate serves this document with max-age=31536000 and a deploy replaces
  // _next/static, so a returning visitor can be holding a year-old index.html
  // whose chunk filenames now 404. Compare the release baked into this document
  // against what is actually deployed and, if they disagree, reload past the
  // cache — back to the requested path, not to the rewritten "/", so a deep
  // link survives the recovery.
  try {
    var loaded = ${JSON.stringify(process.env.NEXT_PUBLIC_RELEASE ?? "dev")};
    fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (v) {
        if (!v || !v.release || v.release === loaded) return;
        // Guard against a reload loop on THIS navigation only — not a
        // session-wide "already healed" flag. A session-wide flag once let a
        // tab heal to release X on one page, then silently keep serving a
        // DIFFERENT stale document (cached under a different URL, from an
        // even older release) on a later navigation in the same tab, because
        // it had already "used up" its one heal for release X.
        if (new URL(window.location.href).searchParams.get('_v') === v.release) return;
        var url = new URL(isDeepLink ? requested : window.location.href, window.location.origin);
        url.searchParams.set('_v', v.release);
        window.location.replace(url.toString());
      })
      .catch(function () {});
  } catch (e) {}
})();`;

/**
 * Catalyst Authentication bootstrap.
 *
 * Catalyst's own /__catalyst/sdk/init.js is what supplies this environment's
 * ZAID and auth domain, and it throws immediately if the `catalyst` global is
 * not already there — so the SDK bundle must finish executing first. Chaining
 * the two by hand is the only way to guarantee that: a pair of tags loaded by
 * any async mechanism can execute in either order, and the losing order
 * leaves the app with no auth at all. Everything auth-related waits on the
 * global rather than on this script, so loading it late is harmless.
 */
const CATALYST_WEB_SDK_URL = "https://static.zohocdn.com/catalyst/sdk/js/4.5.0/catalystWebSDK.js";

const catalystSdkScript = `(function () {
  var sdk = document.createElement('script');
  sdk.src = ${JSON.stringify(CATALYST_WEB_SDK_URL)};
  sdk.onload = function () {
    var init = document.createElement('script');
    init.src = '/__catalyst/sdk/init.js';
    document.head.appendChild(init);
  };
  document.head.appendChild(sdk);
})();`;

export const metadata: Metadata = {
  title: {
    default: "MarineLink",
    template: "%s · MarineLink",
  },
  description:
    "Role-based marine equipment relationship and service platform connecting Marine Travelift, its dealers, and their customers in one workspace.",
  applicationName: "MarineLink",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MarineLink",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#10151f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: catalystSdkScript }} />
        {SLATE_FALLBACK_HOSTING ? (
          <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />
        ) : null}
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to content
        </a>

        {/* Covers the brief window in which a deep link is replayed through the
          * client router. Hidden unless the document carries data-deeplink. */}
        <div id="deeplink-splash" aria-hidden="true">
          <span className="deeplink-splash__mark">
            <span />
            <span />
            <span />
          </span>
        </div>

        <div id="app-root">
          <AppProviders>
            <DeepLinkResolver />
            <AuthGate>{children}</AuthGate>
          </AppProviders>
        </div>
      </body>
    </html>
  );
}
