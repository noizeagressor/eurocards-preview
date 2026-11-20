"""Validate and package the browser-facing files tracked by Git."""
import hashlib
import posixpath
import re
import subprocess
import sys
import tarfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

ROOT_PAGES = {"index.html", "info.html"}
ASSET = re.compile(r"assets/(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\.(?:webp|png|svg|woff2)")
LICENSE = re.compile(r"assets/(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+-LICENSE\.txt")
ARTICLE = re.compile(r"journal/[a-z0-9-]+\.html")


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        for key in ("href", "src", "action"):
            if attrs.get(key):
                self.urls.append(attrs[key])
        self.urls.extend(part.strip().split()[0] for part in attrs.get("srcset", "").split(",") if part.strip())


def resolve(source, reference):
    url = urlsplit(reference)
    if url.scheme or url.netloc or not url.path:
        return None
    path = unquote(url.path)
    return posixpath.normpath(posixpath.join(posixpath.dirname(source), path)).lstrip("/")


def build(destination):
    tracked = set(subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0"))
    pages = ROOT_PAGES | {name for name in tracked if ARTICLE.fullmatch(name)}
    files = pages | {name for name in tracked if ASSET.fullmatch(name) or LICENSE.fullmatch(name)}
    references = []
    for name in sorted(pages):
        parser = Links()
        parser.feed(Path(name).read_text(encoding="utf-8"))
        for url in parser.urls:
            target = resolve(name, url)
            if target is None:
                continue
            references.append((name, url, target))
            if re.fullmatch(r"[a-z0-9-]+\.(?:css|js)", target):
                files.add(target)

    for name in sorted(files):
        path = Path(name)
        if name not in tracked or not path.is_file() or any(p.is_symlink() for p in (path, *path.parents)):
            raise ValueError(f"Missing, untracked or symbolic public file: {name}")
        if name.endswith(".js"):
            subprocess.run(["node", "--check", name], check=True)
        if name.endswith(".css"):
            for url in re.findall(r"""url\(\s*['"]?([^'")\s]+)""", path.read_text(encoding="utf-8")):
                if target := resolve(name, url):
                    references.append((name, url, target))

    for name, url, target in references:
        if target not in files:
            raise ValueError(f"{name} references a file outside the release: {url}")
        versions = parse_qs(urlsplit(url).query).get("v", [])
        if versions and hashlib.sha256(Path(target).read_bytes()).hexdigest()[:10] != versions[0]:
            raise ValueError(f"Stale asset version in {name}: {url}")

    catalog = Path("catalog.js").read_text(encoding="utf-8")
    products = re.findall(r"id: '([a-z0-9-]+)', name:", catalog)
    if not products:
        raise ValueError("Product catalog is empty")
    for product in products:
        for name in (f"assets/card-{product}.webp", f"assets/catalog-{product}-face.webp"):
            if name not in files:
                raise ValueError(f"Missing catalog photo: {name}")

    with tarfile.open(destination, "w:gz") as archive:
        for name in sorted(files):
            archive.add(name, arcname=name, recursive=False)
    print(f"Packaged {len(files)} public files, {len(pages)} HTML pages, {len(products)} products.")


if __name__ == "__main__":
    build(sys.argv[1])
