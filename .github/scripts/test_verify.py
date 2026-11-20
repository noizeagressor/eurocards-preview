"""DNS cutover, explicit public domains and redirect checks without live network."""
import contextlib
import io
import ipaddress
import json
import os
from pathlib import Path
import socket
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit

import verify


def dns_records(*ips):
    return [
        (socket.AF_INET6 if ":" in ip else socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, 443))
        for ip in ips
    ]


class PublicChecks(unittest.TestCase):
    def test_dns_classification(self):
        base = verify.DEFAULT_PUBLIC[0]
        origin_ips = {verify.OVH_IP, ipaddress.ip_address("2001:db8::10")}
        parking = str(verify.PARKING_IP)
        cases = [
            ((parking,), False, "Pending"), ((parking,), True, "Explicit public URL"),
            ((parking, "2001:db8::2"), False, "mixes Beget parking"),
            (("2001:db8::2",), False, None),
            (("::ffff:57.129.189.244",), True, "directly to the OVH origin"),
            (("2001:db8::10", "192.0.2.1"), False, "directly to the OVH origin"),
            ((), False, "no A or AAAA"),
        ]
        for ips, explicit, expected in cases:
            with self.subTest(ips=ips, explicit=explicit), patch.object(socket, "getaddrinfo", return_value=dns_records(*ips)):
                if expected is None:
                    self.assertIsNone(verify.public_status(base, origin_ips, explicit))
                elif expected == "Pending":
                    self.assertIn(expected, verify.public_status(base, origin_ips, explicit))
                else:
                    with self.assertRaisesRegex(ValueError, expected):
                        verify.public_status(base, origin_ips, explicit)
        with patch.object(socket, "getaddrinfo", side_effect=socket.gaierror("NXDOMAIN")):
            with self.assertRaisesRegex(ValueError, "DNS lookup.*failed"):
                verify.public_status(base, origin_ips, False)

    def test_redirects(self):
        live, alias, parked, _ = verify.DEFAULT_PUBLIC
        allowed = {live, alias}
        verify.check_destination(live + "/release.json", allowed, "/release.json")
        for target in (parked + "/release.json", verify.ORIGIN + "/release.json",
                       "http://" + urlsplit(live).hostname + "/release.json", alias + "/other"):
            with self.subTest(target=target), self.assertRaises(ValueError):
                verify.check_destination(target, allowed, "/release.json")

    def test_cutover_summary_and_allowlist(self):
        live, alias, waiting, broken = verify.DEFAULT_PUBLIC
        revision = "a" * 40
        suffixes = {verify.ORIGIN: str(verify.OVH_IP), live: "192.0.2.1",
                    alias: "192.0.2.2", waiting: str(verify.PARKING_IP)}
        def resolve(host, *args, **kwargs):
            if host == urlsplit(broken).hostname:
                raise socket.gaierror("NXDOMAIN")
            return dns_records(suffixes["https://" + host])
        def fetch(url, allowed, path):
            expected = {verify.ORIGIN} if url.startswith(verify.ORIGIN) else {live, alias}
            self.assertEqual(allowed, expected)
            if path == "/release.json":
                return json.dumps({"revision": revision}).encode(), {"Cache-Control": "no-store"}
            return b"home", {}
        with tempfile.TemporaryDirectory() as temp:
            summary = Path(temp) / "summary.md"
            with (patch.dict(os.environ, {"EUROCARDS_PUBLIC_URLS": "", "GITHUB_STEP_SUMMARY": str(summary)}),
                  patch.object(socket, "getaddrinfo", side_effect=resolve),
                  patch.object(verify, "git_file", return_value=b"home"),
                  patch.object(verify, "fetch", side_effect=fetch),
                  patch.object(verify, "check_browser") as browser,
                  contextlib.redirect_stdout(io.StringIO())):
                with self.assertRaisesRegex(ValueError, "Release checks failed"):
                    verify.verify(revision)
            report = summary.read_text(encoding="utf-8")
            for base in (verify.ORIGIN, live, alias):
                self.assertIn(f"`{base}`: Verified", report)
            self.assertIn(f"`{waiting}`: Pending", report)
            self.assertIn(f"`{broken}`: Failed", report)
            browser.assert_called_once_with(live + "/")

    def test_all_parked_and_explicit_override(self):
        revision = "b" * 40
        def lookup(host, *args, **kwargs):
            return dns_records(str(verify.OVH_IP if host == urlsplit(verify.ORIGIN).hostname else verify.PARKING_IP))
        def origin_response(url, allowed, path):
            self.assertEqual(allowed, {verify.ORIGIN})
            self.assertTrue(url.startswith(verify.ORIGIN + "/"))
            return ((json.dumps({"revision": revision}).encode(), {"Cache-Control": "no-cache"})
                    if path == "/release.json" else (b"home", {}))
        with (patch.object(socket, "getaddrinfo", side_effect=lookup),
              patch.object(verify, "git_file", return_value=b"home"),
              patch.object(verify, "fetch", side_effect=origin_response),
              patch.object(verify, "check_browser") as browser,
              patch.dict(os.environ, {"GITHUB_STEP_SUMMARY": "", "EUROCARDS_PUBLIC_URLS": ""})):
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                verify.verify(revision)
            self.assertEqual(output.getvalue().count(": Pending"), 4)
            browser.assert_called_once_with(verify.ORIGIN + "/")
            os.environ["EUROCARDS_PUBLIC_URLS"] = verify.DEFAULT_PUBLIC[0]
            output = io.StringIO()
            with contextlib.redirect_stdout(output), self.assertRaisesRegex(ValueError, "Release checks failed"):
                verify.verify(revision)
            self.assertIn(f"`{verify.DEFAULT_PUBLIC[0]}`: Failed", output.getvalue())
            self.assertNotIn(": Pending", output.getvalue())
