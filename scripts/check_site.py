#!/usr/bin/env python3
"""Offline static checks for local links, HTML IDs/headings, CSS URLs and JS syntax.

Uses only Python's standard library plus `node --check` for JavaScript. This is
not a browser or accessibility audit. CSS checking covers ordinary url() values
in .css files, not a full CSS parser or dynamically generated references.
"""

import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import unquote, urlsplit


HTML_SUFFIXES = {".html", ".htm"}
CSS_URL = re.compile(r'''url\(\s*(?:"([^"]*)"|'([^']*)'|([^'"\)]*?))\s*\)''', re.I)


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.duplicates = []
        self.links = []
        self.h1_count = 0

    def handle_starttag(self, tag, attrs):
        self.h1_count += tag == "h1"
        for name, value in attrs:
            if value is None:
                continue
            if name == "id":
                if value in self.ids:
                    self.duplicates.append((self.getpos()[0], value))
                self.ids.add(value)
            if name in {"href", "src", "poster"}:
                self.links.append((self.getpos()[0], value))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path,
        default=Path(__file__).resolve().parents[1] / "sites/natalia-kuznetsova/dist",
        help="site directory (default: sites/natalia-kuznetsova/dist in this repository)",
    )
    root = parser.parse_args().root.resolve()
    errors = []
    pages = {}
    css_links = []
    js_files = []

    def report(path, message, line=None):
        location = str(path.relative_to(root))
        if line is not None:
            location += f":{line}"
        errors.append(f"{location}: {message}")

    if not root.is_dir():
        print(f"ERROR: site root is not a directory: {root}")
        return 1

    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        suffix = path.suffix.lower()
        if suffix not in HTML_SUFFIXES | {".css", ".js"}:
            continue
        if not path.resolve().is_relative_to(root):
            report(path, "file resolves outside site root")
            continue
        if suffix == ".js":
            js_files.append(path)
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as error:
            report(path, f"cannot read UTF-8 file: {error}")
            continue
        if suffix in HTML_SUFFIXES:
            page = Page()
            page.feed(content)
            pages[path.resolve()] = page
            for line, value in page.duplicates:
                report(path, f"duplicate id {value!r}", line)
            if page.h1_count != 1:
                report(path, f"expected one H1, found {page.h1_count}")
        else:
            # Preserve line numbers while ignoring commented-out URLs.
            content = re.sub(r"/\*.*?\*/", lambda m: "\n" * m[0].count("\n"), content, flags=re.S)
            for match in CSS_URL.finditer(content):
                value = next(group for group in match.groups() if group is not None)
                css_links.append((path, content.count("\n", 0, match.start()) + 1, value))

    if not pages:
        errors.append(".: no HTML pages found")

    def check_link(source, line, value):
        try:
            url = urlsplit(value.strip())
        except ValueError as error:
            report(source, f"invalid URL {value!r}: {error}", line)
            return
        if url.scheme or url.netloc:
            return
        local_path = unquote(url.path)
        if not local_path:
            target = source
        elif local_path.startswith("/"):
            target = root / local_path.lstrip("/")
        else:
            target = source.parent / local_path
        target = target.resolve()
        if not target.is_relative_to(root):
            report(source, f"URL resolves outside site root: {value!r}", line)
            return
        if target.is_dir():
            target = target / "index.html"
        if not target.is_file():
            report(source, f"missing local file: {value!r}", line)
        elif url.fragment and target.suffix.lower() in HTML_SUFFIXES:
            page = pages.get(target)
            if page is None:
                report(source, f"cannot check HTML anchor: {value!r}", line)
            elif unquote(url.fragment) not in page.ids:
                report(source, f"missing anchor: {value!r}", line)

    for path, page in pages.items():
        for line, value in page.links:
            check_link(path, line, value)
    for path, line, value in css_links:
        check_link(path, line, value)

    node = shutil.which("node")
    if js_files and node is None:
        errors.append(".: node is required to check JavaScript syntax")
    elif node:
        for path in js_files:
            result = subprocess.run([node, "--check", str(path)], capture_output=True, text=True)
            if result.returncode:
                lines = (result.stderr or result.stdout).splitlines()
                reason = next((line for line in lines if "SyntaxError:" in line), "node --check failed")
                report(path, f"JavaScript syntax error: {reason}")

    for error in errors:
        print(f"ERROR {error}")
    if errors:
        print(f"FAILED: {len(errors)} problem(s)")
        return 1
    print(f"OK: {len(pages)} HTML page(s), local links/CSS URLs and {len(js_files)} JavaScript file(s) checked")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
