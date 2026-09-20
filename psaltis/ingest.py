"""Ingest hymns from icxc.pro into the catalogue.

An icxc service page is one table; each row has a Greek `leftCell` and an English `rightCell`.
A hymn is spread over consecutive rows: `source` ("From Octoechos"), `designation`
("Resurrectional Apolytikion."), `mode` ("Grave Mode." plus the melody model, if any), a bare
key row carrying the score/audio dropdowns, and finally `p.hymn` with the text. Every span
carries a stable `data-key`; the hymn's key is the app's ID (see `hymn_id`).

Those context rows describe the hymn(s) that follow them, up to the next spoken row (a litany,
a prayer, a reading): a Kontakion's mode line does not reach the Trisagion three litanies later.
The mode may also sit inside a `designation` or `mixed` row ("Καὶ νῦν. Ἦχος πλ. δʹ.").

Scores come in three placements. A bare key row with the hymn's own key is the hymn's own media.
A row keyed `…|media.key` belongs to what follows rather than to one hymn: directly under a
section heading (a `mixed` row) it is *section media* and stands in for every later hymn whose
own media slot is empty, until a hymn with its own media closes the section (the Liturgika are
filed once under ΤΑ ΠΛΗΡΩΤΙΚΑ and cover the Anaphora responses); anywhere else it is *local
media* for the hymn(s) that follow it, up to the next heading or hymn with its own media (the
Kekragaria, a prokeimenon). An empty media row changes nothing.

Re-runnable: `write_hymn` replaces the `icxc` block of a catalogue file and leaves every other
field alone.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import unicodedata
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Callable
from urllib.parse import unquote, urljoin

import httpx
from bs4 import BeautifulSoup, Tag

from . import config
from .config import ICXC_BASE

USER_AGENT = "psaltis/0.1 (personal chant practice; personal-use copies only)"

SERVICES = {
    "VE": "Vespers",
    "MA": "Matins",
    "LI": "Liturgy",
    "CO": "Compline",
    "MI": "Midnight Office",
    "HO": "Hours",
    "DA": "Day",
    "GA": "General",
}

BOOKS = {
    "oc": "Octoechos",
    "me": "Menaion",
    "ho": "Horologion",
    "eu": "Euchologion",
    "he": "Heirmologion",
    "tr": "Triodion",
    "pe": "Pentecostarion",
}

MODE_KEY = re.compile(r"misc\.Mode(\d)$")
MEDIA_PATH = re.compile(r"path=(media/(m|a)/[^&]+)")
# "Mode pl. 4 (HC) | SDedes/", "Thyateira | Mode pl. 1 (long)/", "Psalm 145 | Grave Mode | SDedes/"
LABEL_MODE = re.compile(r"(?i)\b(?:mode\s+)?(pl)\.?\s*([1-4])\b|\bmode\s+([1-4])\b|\b(grave)\b")

# Rows that carry the context of the hymns after them (mode, designation, source, rubric).
CONTEXT_ROWS = ("source", "source0", "designation", "rubric", "mode", "mixed")
# Spoken rows: a litany, a prayer, a reading. They end the reach of the context rows before them.
PROSE_ROWS = frozenset({"actor", "actorinaudible", "dialog", "dialogwithactor", "inaudible", "prayer", "reading"})


@dataclass
class Score:
    source: str  # theodoridis, dedes, en_public ...
    language: str  # gr | en
    notation: str  # byzantine | western
    url: str  # absolute icxc URL
    path: str  # library-relative path once downloaded
    label: str = ""  # the dropdown entry, e.g. "Mode pl. 4 (HC) | SDedes/"
    mode: int | None = None  # 1-8 when the label names one; a set may exist in several modes


@dataclass
class Audio:
    source: str  # eikona, dedes, en_public ...
    language: str  # almost always en on icxc
    url: str
    path: str


@dataclass
class ParsedHymn:
    icxc_key: str
    id: str
    text_gr: str
    text_en: str
    translations_en: dict[str, str] = field(default_factory=dict)
    version_en: str = ""  # which translation text_en is, e.g. GOASD
    mode: int | None = None
    mode_gr: str = ""
    mode_en: str = ""
    melody_model_gr: str = ""
    melody_model_en: str = ""
    designation_gr: str = ""
    designation_en: str = ""
    source_gr: str = ""
    source_en: str = ""
    rubric_gr: str = ""
    rubric_en: str = ""
    book: str = ""
    service: str = ""
    scores: list[Score] = field(default_factory=list)
    audio: list[Audio] = field(default_factory=list)


# --- keys ---------------------------------------------------------------------------------------


def split_key(icxc_key: str) -> tuple[str, str]:
    """'oc.m7.d1_gr_GR_cog|ocVE.Apolytikion.text' -> ('oc.m7.d1', 'ocVE.Apolytikion.text')."""
    topic, _, key = icxc_key.partition("|")
    topic = topic.split("_", 1)[0]
    return topic, key


def hymn_id(icxc_key: str) -> str:
    """The catalogue ID: language segment and `.text` dropped, `|` replaced by `.`."""
    topic, key = split_key(icxc_key)
    key = key.removesuffix(".text")
    return f"{topic}.{key}"


def key_context(icxc_key: str) -> tuple[str, str]:
    """('Octoechos', 'Vespers') from the topic prefix and the key's service letters."""
    topic, key = split_key(icxc_key)
    book = BOOKS.get(topic.split(".")[0], topic.split(".")[0])
    head = key.split(".")[0]  # e.g. ocVE
    code = head[2:4] if len(head) >= 4 else ""
    return book, SERVICES.get(code, code)


# --- parsing --------------------------------------------------------------------------------------


def _clean_text(cell: Tag | None) -> str:
    if cell is None:
        return ""
    cell = _copy_without_media(cell)
    for br in cell.find_all("br"):
        br.replace_with("\n")
    text = _nfc(cell.get_text(" ", strip=False))
    lines = [re.sub(r"[ \t\u00a0]+", " ", ln).strip() for ln in text.split("\n")]
    return "\n".join(ln for ln in lines if ln)


def _nfc(text: str) -> str:
    """icxc mixes oxia and tonos code points; NFC folds them to the tonos forms."""
    return unicodedata.normalize("NFC", text)


def _copy_without_media(cell: Tag) -> Tag:
    copy = BeautifulSoup(str(cell), "lxml").find(cell.name)
    for mg in copy.select("div.media-group, div.media-group-empty, span.versiondesignation"):
        mg.decompose()
    return copy


def _version(cell: Tag | None) -> str:
    """The translation's version tag, e.g. 'GOASD' from '[GOASD]'."""
    if cell is None:
        return ""
    v = cell.select_one("span.versiondesignation")
    return v.get_text("", strip=True).strip("[] ") if v else ""


def _para_class(cell: Tag | None) -> str:
    if cell is None:
        return ""
    p = cell.find(["p", "span"], recursive=False)
    if p is None:
        return ""
    classes = p.get("class") or []
    return classes[0] if classes else ""


def _kvp_key(cell: Tag | None) -> str:
    if cell is None:
        return ""
    sp = cell.select_one("span.kvp[data-key]")
    return sp["data-key"] if sp else ""


def label_mode(label: str) -> int | None:
    """1-8 from a dropdown label: 'Mode 4 Kliton' -> 4, 'Mode pl. 2 (HC)' -> 6, 'Grave Mode' -> 7."""
    m = LABEL_MODE.search(label)
    if not m:
        return None
    if m.group(4):
        return 7
    if m.group(1):
        return int(m.group(2)) + 4
    return int(m.group(3))


def _label(a: Tag) -> str:
    people = a.select_one("span.mediaMenuItemPeople")
    return _nfc(people.get_text(" ", strip=True)) if people else ""


def _media(cell: Tag | None) -> tuple[list[Score], list[Audio]]:
    scores: list[Score] = []
    audio: list[Audio] = []
    if cell is None:
        return scores, audio
    seen: set[str] = set()
    for a in cell.select('a[href^="/api/file"]'):
        href = a["href"]
        m = MEDIA_PATH.search(href)
        if not m or href in seen:
            continue
        seen.add(href)
        path = unquote(m.group(1))
        parts = path.split("/")
        kind = parts[1]  # m | a
        source = parts[2]
        language = parts[3] if parts[3] in ("gr", "en") else ("en" if source == "en_public" else "")
        url = urljoin(ICXC_BASE, href)
        if kind == "m":
            notation = "byzantine" if "/b/" in path else "western" if "/w/" in path else ""
            label = _label(a)
            scores.append(Score(source, language, notation, url, path, label, label_mode(label)))
        else:
            audio.append(Audio(source, language or "en", url, path))
    return scores, audio


def _is_section_media_key(key: str) -> bool:
    return key.endswith("|media.key")


def _row_mode(left: Tag, right: Tag | None) -> tuple[int | None, str, str]:
    """(mode, melody model gr, melody model en) from the `misc.ModeN` and `he.*.name|.melody` keys
    of a context row; mode is None when the row names no mode."""
    mode = None
    melody_gr = melody_en = ""
    for sp in left.select("span.kvp[data-key]"):
        m = MODE_KEY.search(sp["data-key"])
        if m:
            mode = int(m.group(1))
        elif sp["data-key"].startswith("he.") and sp["data-key"].endswith((".name", ".melody")):
            # `.name` names another hymn's tune; `.melody` reads "Αὐτόμελον." (its own)
            melody_gr = _nfc(sp.get_text(" ", strip=True))
    if right is not None:
        for sp in right.select("span.kvp[data-key]"):
            if sp["data-key"].startswith("he.") and sp["data-key"].endswith((".name", ".melody")):
                melody_en = _nfc(sp.get_text(" ", strip=True))
    return mode, melody_gr, melody_en


def _translations(cell: Tag | None) -> dict[str, str]:
    if cell is None:
        return {}
    sp = cell.select_one("span.kvp[data-translations]")
    if not sp:
        return {}
    try:
        return json.loads(sp["data-translations"])
    except (ValueError, KeyError):
        return {}


def parse_service_page(html: str) -> list[ParsedHymn]:
    """All hymns on one icxc service page, in page order."""
    soup = BeautifulSoup(html, "lxml")
    rows = soup.select("tr")
    hymns: list[ParsedHymn] = []

    # Context rows preceding a hymn. Designation and rubric are cleared after each hymn so a
    # label from three hymns back never leaks forward; mode and source persist across a group of
    # hymns; every one of them is cleared by a spoken row (see the module docstring).
    ctx: dict[str, str] = {}
    mode: int | None = None
    melody_gr = melody_en = ""
    own_media: tuple[str, list[Score], list[Audio]] = ("", [], [])
    section_media: tuple[list[Score], list[Audio]] = ([], [])
    local_media: tuple[list[Score], list[Audio]] = ([], [])
    prev_cls = ""

    for tr in rows:
        left = tr.select_one("td.leftCell")
        right = tr.select_one("td.rightCell")
        if left is None:
            continue
        cls = _para_class(left)
        if cls in CONTEXT_ROWS:
            row_mode, row_melody_gr, row_melody_en = _row_mode(left, right)
            if row_mode is not None or cls == "mode":
                mode, melody_gr, melody_en = row_mode, row_melody_gr, row_melody_en
                ctx["mode_gr"], ctx["mode_en"] = _clean_text(left), _clean_text(right)
        if cls in PROSE_ROWS:
            ctx.clear()
            mode = None
            melody_gr = melody_en = ""
        elif cls == "mixed":
            local_media = ([], [])
        elif cls in ("source", "source0"):
            ctx["source_gr"], ctx["source_en"] = _clean_text(left), _clean_text(right)
        elif cls == "designation":
            ctx["designation_gr"], ctx["designation_en"] = _clean_text(left), _clean_text(right)
        elif cls == "rubric":
            ctx["rubric_gr"], ctx["rubric_en"] = _clean_text(left), _clean_text(right)
        elif cls == "kvp":
            # bare key row: the score / audio dropdowns of the hymn that follows, or of a passage
            key = _kvp_key(left)
            ls, la = _media(left)
            rs, ra = _media(right)
            scores, audio = ls + rs, la + ra
            if not _is_section_media_key(key):
                own_media = (key, scores, audio)
            elif scores or audio:
                if prev_cls == "mixed":
                    section_media, local_media = (scores, audio), ([], [])
                else:
                    local_media = (scores, audio)
        elif cls == "hymn":
            key = _kvp_key(left)
            if not key or "|" not in key:
                continue
            scores: list[Score] = []
            audio: list[Audio] = []
            if own_media[0] == key and (own_media[1] or own_media[2]):
                _, scores, audio = own_media
                section_media = local_media = ([], [])
            elif local_media[0] or local_media[1]:
                scores, audio = local_media
            elif own_media[0] == key:  # an empty slot of its own: the section's media stands in
                scores, audio = section_media
            book, service = key_context(key)
            hymns.append(
                ParsedHymn(
                    icxc_key=key,
                    id=hymn_id(key),
                    text_gr=_clean_text(left),
                    text_en=_clean_text(right),
                    translations_en=_translations(right) or _translations(left),
                    version_en=_version(right),
                    mode=mode,
                    mode_gr=ctx.get("mode_gr", ""),
                    mode_en=ctx.get("mode_en", ""),
                    melody_model_gr=melody_gr,
                    melody_model_en=melody_en,
                    designation_gr=ctx.get("designation_gr", ""),
                    designation_en=ctx.get("designation_en", ""),
                    source_gr=ctx.get("source_gr", ""),
                    source_en=ctx.get("source_en", ""),
                    rubric_gr=ctx.get("rubric_gr", ""),
                    rubric_en=ctx.get("rubric_en", ""),
                    book=book,
                    service=service,
                    scores=list(scores),
                    audio=list(audio),
                )
            )
            own_media = ("", [], [])
            for k in ("designation_gr", "designation_en", "rubric_gr", "rubric_en"):
                ctx.pop(k, None)
        prev_cls = cls
    return hymns


# --- fetching -------------------------------------------------------------------------------------


def service_path(date: dt.date, service: str) -> str:
    return f"/{date:%Y/%m/%d}/{service}/"


def fetch_service_page(date: dt.date, service: str, *, refresh: bool = False) -> str:
    """The page HTML, from the library cache when present."""
    cache = config.LIBRARY_DIR / "cache" / "icxc" / f"{date:%Y-%m-%d}-{service}.html"
    if cache.exists() and not refresh:
        return cache.read_text(encoding="utf-8")
    url = ICXC_BASE + service_path(date, service)
    r = httpx.get(url, headers={"User-Agent": USER_AGENT}, timeout=60, follow_redirects=True)
    r.raise_for_status()
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(r.text, encoding="utf-8")
    return r.text


def download_media(url: str, path: str, *, client: httpx.Client | None = None) -> Path:
    """Download one icxc file into the library at its icxc path. Skips files already present."""
    dest = config.LIBRARY_DIR / "icxc" / path
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    c = client or httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=120, follow_redirects=True)
    try:
        with c.stream("GET", url) as r:
            r.raise_for_status()
            with dest.open("wb") as f:
                for chunk in r.iter_bytes():
                    f.write(chunk)
    finally:
        if client is None:
            c.close()
    return dest


# --- writing --------------------------------------------------------------------------------------


def incipit(text: str, words: int = 4) -> str:
    first = text.split("\n", 1)[0]
    return " ".join(first.split()[:words]).rstrip(",.;·")


def write_hymn(parsed: ParsedHymn, page: str, *, catalogue_dir: Path | None = None) -> Path:
    """Merge one parsed hymn into `catalogue/hymns/<id>.json`.

    The `icxc` block is replaced; operator-owned fields are created with defaults only when
    absent, never overwritten.
    """
    path = (catalogue_dir or config.CATALOGUE_DIR) / "hymns" / f"{parsed.id}.json"
    existing = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    icxc = asdict(parsed)
    icxc.pop("id")
    icxc["page"] = page
    icxc["fetched"] = dt.date.today().isoformat()
    record = {
        "id": parsed.id,
        "kind": "hymn",
        "title_gr": existing.get("title_gr") or incipit(parsed.text_gr),
        "title_en": existing.get("title_en") or incipit(parsed.text_en),
        "stage": existing.get("stage"),
        "melodic_speed": existing.get("melodic_speed"),
        "transliteration": existing.get("transliteration"),
        "phrases": existing.get("phrases", []),
        "icxc": icxc,
    }
    for k, v in existing.items():
        record.setdefault(k, v)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def ingest_service(
    date: dt.date,
    service: str,
    *,
    only: set[str] | None = None,
    select: Callable[[ParsedHymn], bool] | None = None,
    media: bool = True,
    refresh: bool = False,
    catalogue_dir: Path | None = None,
) -> list[ParsedHymn]:
    """Ingest a service page. `only` restricts to hymn IDs (or ID prefixes); `select` is a
    predicate on the parsed hymn. Both may be given."""
    html = fetch_service_page(date, service, refresh=refresh)
    page = service_path(date, service)
    hymns = parse_service_page(html)
    if only:
        hymns = [h for h in hymns if any(h.id == o or h.id.startswith(o) for o in only)]
    if select:
        hymns = [h for h in hymns if select(h)]
    with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=120, follow_redirects=True) as c:
        for h in hymns:
            if media:
                for m in h.scores + h.audio:
                    try:
                        download_media(m.url, m.path, client=c)
                    except httpx.HTTPError as e:  # keep going; the catalogue still records the URL
                        print(f"  ! {m.path}: {e}")
            write_hymn(h, page, catalogue_dir=catalogue_dir)
    return hymns
