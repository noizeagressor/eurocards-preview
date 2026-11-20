"""Open the storefront in headless Chrome and check the rendered application links."""
import os
import shutil
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


class Catalog(HTMLParser):
    def __init__(self):
        super().__init__()
        self.contacts = []
        self.finder = False

    def handle_starttag(self, tag, items):
        attrs = dict(items)
        if tag == "a" and "catalog-apply" in attrs.get("class", "").split():
            self.contacts.append(urlsplit(attrs["href"]))
        if attrs.get("id") == "finder-launch":
            self.finder = "hidden" not in attrs


def check(url):
    chrome = os.environ.get("CHROME_BIN") or shutil.which("google-chrome")
    if not chrome:
        raise RuntimeError("Set CHROME_BIN to the Chrome executable")
    with tempfile.TemporaryDirectory() as profile:
        result = subprocess.run([
            chrome, "--headless", "--disable-gpu", "--disable-background-networking",
            "--no-first-run", f"--user-data-dir={profile}", "--window-size=390,844",
            "--virtual-time-budget=3500", "--dump-dom", url,
        ], capture_output=True, timeout=60, check=True)
    catalog = Catalog()
    catalog.feed(result.stdout.decode("utf-8"))
    if not catalog.finder or len(catalog.contacts) != 4 or not all(
        link.scheme == "https" and link.hostname == "t.me" and len(link.path) > 1 and link.query
        for link in catalog.contacts
    ):
        raise ValueError(f"Catalog actions or card finder did not render at {url}")
    print(f"Chrome rendered four card application links and the card finder at {url}")


if __name__ == "__main__":
    check(sys.argv[1] if len(sys.argv) > 1 else Path("index.html").resolve().as_uri())
