#!/usr/bin/env python3
"""
Local stand-in for Catalyst Slate's static file serving.

Slate matches request paths against uploaded files *exactly*. It resolves
neither directory indexes (`/dealers/` does not find `/dealers/index.html`) nor
clean URLs onto `.html`, and every HTML request it cannot match returns the root
`index.html`. An ordinary static server does none of that, so testing against
one hides exactly the bugs this app's deep-link handling exists to fix.

    python3 scripts/serve-slate.py [port] [directory]
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
ROOT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else "out")


class SlateHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        path = self.translate_path(self.path)

        # Exact file match only — never a directory index.
        if os.path.isfile(path):
            return super().send_head()

        # Everything else falls back to the root document, the way Slate does.
        self.path = "/index.html"
        return super().send_head()

    def end_headers(self):
        # Slate serves the HTML entry document with a year-long cache.
        if self.path.endswith(".html") or self.path == "/index.html":
            self.send_header("cache-control", "public, max-age=31536000")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s\n" % (fmt % args))


if __name__ == "__main__":
    print(f"Slate emulator serving {ROOT} on http://localhost:{PORT}")
    HTTPServer(("", PORT), SlateHandler).serve_forever()
