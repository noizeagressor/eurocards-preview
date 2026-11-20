"""Run on Linux: python3 -B -m unittest discover -s .github/ops."""
import importlib.machinery
import importlib.util
import io
import json
import multiprocessing
from pathlib import Path
import tarfile
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


loader = importlib.machinery.SourceFileLoader("release", str(Path(__file__).with_name("eurocards-release")))
spec = importlib.util.spec_from_loader(loader.name, loader)
release = importlib.util.module_from_spec(spec)
loader.exec_module(release)


def bundle(edition, extra=()):
    names = ("index.html", "info.html", "catalog.js", "finder.js", "styles.css",
             "assets/favicon.svg", "journal/news.html")
    files = [(name, ("EuroCards " + edition).encode(), tarfile.REGTYPE) for name in names]
    target = io.BytesIO()
    with tarfile.open(fileobj=target, mode="w:gz") as archive:
        for name, data, kind in [*files, *extra]:
            entry = tarfile.TarInfo(name)
            entry.type = kind
            entry.size = len(data)
            archive.addfile(entry, io.BytesIO(data))
    return target.getvalue()


def deliver(sha, archive):
    return release.dispatch("deploy " + sha, io.BytesIO(archive))


def deliver_from_worker(root, port, sha):
    release.ROOT = root
    release.PORT = port
    deliver(sha, bundle(sha))


class OriginCheck(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            body = (release.ROOT / "current/index.html").read_bytes()
        else:
            body = (release.ROOT / "current/release.json").read_bytes()
        if self.headers.get("Host") != release.HOST or self.server.broken:
            body = b"Another website"
        self.send_response(200)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        release.ROOT = Path(self.temp.name)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), OriginCheck)
        self.server.broken = False
        release.PORT = self.server.server_port
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.a, self.b, self.c = "a" * 40, "b" * 40, "c" * 40

    def status(self):
        return release.dispatch("status", io.BytesIO())

    def test_retries_switch_and_conditional_rollback(self):
        self.assertIsNone(self.status()["revision"])
        deliver(self.a, bundle("A"))
        deliver(self.b, bundle("B"))
        deliver(self.b, bundle("B"))
        deliver(self.c, bundle("C"))
        release.dispatch("rollback " + self.b, io.BytesIO())
        self.assertEqual(self.status(), {"revision": self.c, "previous": self.b})
        release.dispatch("rollback " + self.c, io.BytesIO())
        release.dispatch("rollback " + self.c, io.BytesIO())
        self.assertEqual(self.status(), {"revision": self.b, "previous": self.a})
        self.assertEqual(json.loads((release.ROOT / "previous/release.json").read_bytes())["revision"], self.a)
        self.assertEqual((release.ROOT / "current/index.html").read_bytes(), b"EuroCards B")

    def test_bad_package_or_wrong_vhost_preserve_live(self):
        deliver(self.a, bundle("A"))
        for path, kind in ((".git/config", tarfile.REGTYPE), ("assets/x.webp", tarfile.SYMTYPE),
                           ("/tmp/bad.js", tarfile.REGTYPE), ("../bad.js", tarfile.REGTYPE),
                           ("assets/secrets/private.svg", tarfile.REGTYPE)):
            with self.subTest(path=path), self.assertRaises(ValueError):
                deliver(self.b, bundle("B", [(path, b"", kind)]))
        with self.assertRaises(ValueError):
            deliver(self.a, bundle("different"))
        with self.assertRaises(ValueError):
            release.dispatch("deploy " + self.a + " extra", io.BytesIO())
        self.server.broken = True
        with self.assertRaisesRegex(ValueError, "Origin verification failed"):
            deliver(self.b, bundle("B"))
        self.assertEqual(self.status(), {"revision": self.a, "previous": None})

    def test_concurrent_writers_keep_a_valid_predecessor(self):
        deliver(self.a, bundle("A"))
        ctx = multiprocessing.get_context("spawn")
        jobs = [ctx.Process(target=deliver_from_worker, args=(release.ROOT, release.PORT, sha))
                for sha in (self.b, self.c)]
        for job in jobs:
            job.start()
        for job in jobs:
            job.join(10)
            self.assertEqual(job.exitcode, 0)
        state = self.status()
        self.assertEqual({state["revision"], state["previous"]}, {self.b, self.c})
        release.check_origin(state["revision"])


if __name__ == "__main__":
    unittest.main()
