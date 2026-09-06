"""Turn feed HTML into plain text using only the standard library."""

from html.parser import HTMLParser

_SKIPPED_TAGS = frozenset({"script", "style", "noscript", "template"})
_BLOCK_TAGS = frozenset(
    {
        "p",
        "div",
        "br",
        "li",
        "ul",
        "ol",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "tr",
        "td",
        "th",
        "section",
        "article",
        "header",
        "footer",
        "pre",
        "figure",
        "figcaption",
        "hr",
    }
)


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._parts: list[str] = []
        self._skip_depth = 0
        self.first_image: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in _SKIPPED_TAGS:
            self._skip_depth += 1
            return
        if tag == "img" and self.first_image is None:
            src = dict(attrs).get("src")
            if src:
                self.first_image = src.strip()
        if tag in _BLOCK_TAGS:
            self._parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in _SKIPPED_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)
            return
        if tag in _BLOCK_TAGS:
            self._parts.append(" ")

    def handle_data(self, data: str) -> None:
        if not self._skip_depth:
            self._parts.append(data)

    def text(self) -> str:
        return " ".join("".join(self._parts).split())


def extract_text(html: str) -> tuple[str, str | None]:
    """Return ``(plain_text, first_image_src)`` for an HTML fragment."""
    parser = _TextExtractor()
    parser.feed(html)
    parser.close()
    return parser.text(), parser.first_image


def truncate(text: str, limit: int = 500) -> str:
    """Cut ``text`` to roughly ``limit`` characters on a word boundary, adding an ellipsis."""
    if len(text) <= limit:
        return text
    cut = text.rfind(" ", 0, limit)
    if cut < limit // 2:
        cut = limit
    return text[:cut].rstrip() + "…"
