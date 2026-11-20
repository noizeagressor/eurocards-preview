"""Verify the normal visitor URLs and release marker against the Git revision."""
import gzip
import hashlib
import html
import ipaddress
import json
import os
import re
import socket
import subprocess
import sys
import time
from urllib.parse import urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from browser import check as check_browser

ORIGIN = "https://origin.evrocards.ru"
DEFAULT_PUBLIC = tuple("https://" + host for host in (
    "evrocards.ru", "www.evrocards.ru", "xn--80adhb0axndk.xn--p1ai", "www.xn--80adhb0axndk.xn--p1ai",
))
PARKING_IP = ipaddress.ip_address("87.236.19.118")
OVH_IP = ipaddress.ip_address("57.129.189.244")


def site_url(value):
    url = urlsplit(value)
    if (url.scheme != "https" or not url.hostname or url.username or url.password
            or url.port not in (None, 443) or url.path not in ("", "/") or url.query or url.fragment):
        raise ValueError(f"Expected an HTTPS site root: {value!r}")
    return "https://" + url.hostname.encode("idna").decode()


def addresses(base):
    host = urlsplit(base).hostname
    try:
        records = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
    except socket.gaierror as error:
        raise ValueError(f"DNS lookup for {host} failed: {error}") from error
    result = set()
    for family, _, _, _, addr in records:
        if family in (socket.AF_INET, socket.AF_INET6):
            ip = ipaddress.ip_address(addr[0])
            result.add(getattr(ip, "ipv4_mapped", None) or ip)
    if not result:
        raise ValueError(f"DNS returned no A or AAAA address for {host}")
    return result


def public_status(base, origin_ips, explicit):
    resolved = addresses(base)
    if resolved == {PARKING_IP} and not explicit:
        return "Pending — DNS still points only to Beget parking (87.236.19.118)"
    if PARKING_IP in resolved:
        if len(resolved) == 1:
            raise ValueError("Explicit public URL still points to Beget parking (87.236.19.118)")
        raise ValueError("DNS mixes Beget parking with other addresses")
    if resolved & origin_ips:
        raise ValueError("DNS points directly to the OVH origin instead of the CDN")
    return None


def check_destination(url, allowed, expected_path):
    final = urlsplit(url)
    final_base = urlunsplit((final.scheme, final.netloc, "", "", ""))
    if final_base not in allowed or final.path != expected_path:
        raise ValueError(f"Unexpected redirect destination: {url}")


def fetch(url, allowed, expected_path):
    class CheckedRedirects(HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            check_destination(newurl, allowed, expected_path)
            return super().redirect_request(req, fp, code, msg, headers, newurl)

    request = Request(url, headers={"User-Agent": "EuroCards-release-check", "Accept-Encoding": "identity"})
    with build_opener(CheckedRedirects()).open(request, timeout=10) as response:
        check_destination(response.geturl(), allowed, expected_path)
        if response.status != 200:
            raise ValueError(f"{url}: HTTP {response.status}")
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
    configured = os.getenv("EUROCARDS_PUBLIC_URLS", "").split()
    public = list(dict.fromkeys(site_url(item) for item in configured)) or DEFAULT_PUBLIC
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

    statuses = {}
    failures = []
    origin_ips = {OVH_IP}
    try:
        origin_ips.update(addresses(ORIGIN))
    except ValueError as error:
        statuses[ORIGIN] = f"Failed — {error}"
        failures.append(ORIGIN)
    published = []
    for base in public:
        try:
            pending = public_status(base, origin_ips, bool(configured))
            if pending:
                statuses[base] = pending
            else:
                published.append(base)
        except ValueError as error:
            statuses[base] = f"Failed — {error}"
            failures.append(base)

    verified = []
    for base in [ORIGIN, *published]:
        if base in failures:
            continue
        allowed = {ORIGIN} if base == ORIGIN else set(published)
        # A normal request must converge too, even when a cache-busted URL is newer.
        for attempt in range(4):
            try:
                check(base, allowed)
                statuses[base] = f"Verified — HTTPS, revision marker and {len(files)} pages and assets"
                verified.append(base)
                break
            except (OSError, ValueError, EOFError) as error:
                if attempt == 3:
                    statuses[base] = f"Failed — {error}"
                    failures.append(base)
                    break
                print(f"Retry {base}: {error}", flush=True)
                time.sleep(10)
    browser_target = next((base for base in verified if base != ORIGIN), ORIGIN if ORIGIN in verified else None)
    if browser_target:
        try:
            check_browser(browser_target + "/")
            statuses[browser_target] += "; Chrome catalog and application links verified"
        except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
            statuses[browser_target] = f"Failed — browser check: {error}; HTTPS content matched the release"
            failures.append(browser_target)
    lines = [f"### EuroCards release `{revision[:12]}`", ""]
    for base in dict.fromkeys([ORIGIN, *public]):
        detail = html.escape(" ".join(statuses[base].splitlines()))
        lines.append(f"- `{base}`: {detail}")
    report = "\n".join(lines) + "\n"
    print(report, flush=True)
    if summary := os.getenv("GITHUB_STEP_SUMMARY"):
        with open(summary, "a", encoding="utf-8") as stream:
            stream.write(report + "\n")
    if failures:
        raise ValueError("Release checks failed: " + ", ".join(dict.fromkeys(failures)))


if __name__ == "__main__":
    verify(sys.argv[1])
