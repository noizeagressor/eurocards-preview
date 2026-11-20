"""Verify the normal visitor URLs and release marker against the Git revision."""
import gzip
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen

from browser import check as check_browser


def site_url(value):
    url = urlsplit(value)
    if (url.scheme != "https" or not url.hostname or url.username or url.password
            or url.port not in (None, 443) or url.path not in ("", "/") or url.query or url.fragment):
        raise ValueError(f"Expected an HTTPS site root: {value!r}")
    return "https://" + url.hostname.encode("idna").decode()


def fetch(url, allowed, expected_path):
    request = Request(url, headers={"User-Agent": "EuroCards-release-check", "Accept-Encoding": "identity"})
    with urlopen(request, timeout=10) as response:
        final = urlsplit(response.geturl())
        final_base = urlunsplit((final.scheme, final.netloc, "", "", ""))
        if response.status != 200 or final_base not in allowed or final.path != expected_path:
            raise ValueError(f"{url}: unexpected destination {response.geturl()} ({response.status})")
        body = response.read(4_000_001)
        if len(body) > 4_000_000:
            raise ValueError(f"{url}: unexpected response size")
        if response.headers.get("Content-Encoding", "").lower() == "gzip":
            body = gzip.decompress(body)
        return body, response.headers


def git_file(revision, path):
    return subprocess.check_output(["git", "show", f"{revision}:{path}"])


def verify(revision):
    if not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise ValueError("Expected a full Git revision")
    origin = site_url("https://origin.evrocards.ru")
    public = list(dict.fromkeys(site_url(item) for item in os.getenv("EUROCARDS_PUBLIC_URLS", "").split()))
    home = git_file(revision, "index.html")
    code_urls = re.findall(rb'(?:href|src)="([a-z0-9-]+\.(?:css|js)(?:\?[^"]*)?)"', home)
    journal = re.findall(rb'href="(journal/[a-z0-9-]+\.html)"', home)
    hero = re.findall(rb'(?:src|srcset)="(assets/hero-[a-z0-9-]+\.webp)"', home)
    files = {"/": home}
    for raw in dict.fromkeys(code_urls + journal + hero):
        rel = raw.decode("ascii")
        files["/" + rel] = git_file(revision, rel.split("?")[0])

    def check(base, allowed):
        marker, headers = fetch(base + "/release.json", allowed, "/release.json")
        if json.loads(marker).get("revision") != revision:
            raise ValueError("release.json points to a different revision")
        cache = headers.get("Cache-Control", "").lower()
        if not any(item in cache for item in ("no-store", "no-cache", "max-age=0")):
            raise ValueError(f"release.json requires revalidation; got Cache-Control: {cache!r}")
        if headers.get("Age", "0").isdigit() and int(headers.get("Age", "0")) > 0 and "no-store" in cache:
            raise ValueError("release.json was served from shared cache despite no-store")
        for path, expected in files.items():
            body, _ = fetch(base + path, allowed, urlsplit(path).path)
            if body != expected:
                raise ValueError(f"{path}: content differs from {revision[:12]} ({hashlib.sha256(body).hexdigest()[:12]})")

    for base in [origin, *public]:
        allowed = {origin} if base == origin else set(public)
        # A normal request must converge too, even when a cache-busted URL is newer.
        for attempt in range(4):
            try:
                check(base, allowed)
                break
            except (OSError, ValueError, EOFError) as error:
                if attempt == 3:
                    raise
                print(f"Retry {base}: {error}", flush=True)
                time.sleep(10)
        print(f"Verified {base}: {revision[:12]}, {len(files)} pages and assets", flush=True)

    check_browser((public or [origin])[0] + "/")
    if not public:
        print("Origin verified. Public CDN checks are pending EUROCARDS_PUBLIC_URLS configuration.")


if __name__ == "__main__":
    verify(sys.argv[1])
