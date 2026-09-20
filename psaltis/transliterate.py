"""Rule-based transliteration of polytonic Greek into stress-marked Latin, modern pronunciation.

Made for singing along, not for scholarship: `ει η ι υ οι` all become `i`, `αι` becomes `e`,
`αυ/ευ` become `av/af`, `ev/ef`, and the stressed vowel of each word carries an acute. The
result is a default; a hymn file may carry a corrected `transliteration` that wins.
"""

from __future__ import annotations

import unicodedata

STRESS_MARKS = {"́", "̀", "͂"}  # oxia/tonos, varia, perispomeni
DIALYTIKA = "̈"

VOWELS = set("αεηιουω")
VOICELESS = set("θκξπστφχψ")
FRONT = set("εηιυ")  # for γ -> y

SINGLE = {
    "α": "a", "β": "v", "γ": "g", "δ": "d", "ε": "e", "ζ": "z", "η": "i", "θ": "th",
    "ι": "i", "κ": "k", "λ": "l", "μ": "m", "ν": "n", "ξ": "x", "ο": "o", "π": "p",
    "ρ": "r", "σ": "s", "ς": "s", "τ": "t", "υ": "i", "φ": "f", "χ": "ch", "ψ": "ps", "ω": "o",
}

ACUTE = {"a": "á", "e": "é", "i": "í", "o": "ó", "u": "ú"}


def _stress(latin: str) -> str:
    """Put an acute on the last vowel of a syllable's Latin output ("ou" -> "oú", "av" -> "áv")."""
    for i in range(len(latin) - 1, -1, -1):
        if latin[i] in ACUTE:
            return latin[:i] + ACUTE[latin[i]] + latin[i + 1 :]
    return latin


def _tokens(word: str) -> list[tuple[str, bool, bool, bool]]:
    """(base letter, stressed, dialytika, upper) per Greek letter, from NFD."""
    out = []
    for ch in unicodedata.normalize("NFD", word):
        if unicodedata.combining(ch):
            if out:
                base, stressed, dial, upper = out[-1]
                out[-1] = (base, stressed or ch in STRESS_MARKS, dial or ch == DIALYTIKA, upper)
            continue
        out.append((ch.lower(), False, ch == DIALYTIKA, ch != ch.lower()))
    return out


def _is_voiced_next(tokens, i: int) -> bool:
    """For αυ/ευ: v before a vowel or voiced consonant, f before a voiceless one or at the end."""
    if i >= len(tokens):
        return False
    nxt = tokens[i][0]
    return nxt in VOWELS or (nxt.isalpha() and nxt not in VOICELESS)


def _word(word: str) -> str:
    toks = _tokens(word)
    out: list[str] = []
    i = 0
    n = len(toks)
    first_letter = True
    while i < n:
        base, stressed, dial, upper = toks[i]
        nxt = toks[i + 1] if i + 1 < n else None
        piece = ""
        step = 1
        if base in VOWELS and nxt and nxt[0] in VOWELS and not nxt[2] and not stressed:
            pair = base + nxt[0]
            pair_stressed = nxt[1]
            if pair in ("αι",):
                piece, step = "e", 2
            elif pair in ("ει", "οι", "υι"):
                piece, step = "i", 2
            elif pair == "ου":
                piece, step = "ou", 2
            elif pair in ("αυ", "ευ", "ηυ"):
                lead = {"α": "a", "ε": "e", "η": "i"}[base]
                piece = lead + ("v" if _is_voiced_next(toks, i + 2) else "f")
                step = 2
            if step == 2:
                stressed = pair_stressed
        if not piece and base == "γ" and nxt:
            if nxt[0] == "γ":
                piece, step = "ng", 2
            elif nxt[0] == "κ":
                piece, step = ("g" if first_letter else "ng"), 2
            elif nxt[0] == "ξ":
                piece, step = "nx", 2
            elif nxt[0] == "χ":
                piece, step = "nch", 2
            elif nxt[0] in FRONT or (nxt[0] in ("α", "ο") and i + 2 < n and toks[i + 1][0] + toks[i + 2][0] in ("αι", "οι")):
                piece = "y"
        if not piece and base == "μ" and nxt and nxt[0] == "π":
            piece, step = ("b" if first_letter else "mb"), 2
        if not piece and base == "ν" and nxt and nxt[0] == "τ":
            piece, step = ("d" if first_letter else "nd"), 2
        if not piece and base == "τ" and nxt and nxt[0] in ("σ", "ζ"):
            piece, step = ("ts" if nxt[0] == "σ" else "tz"), 2
        if not piece:
            piece = SINGLE.get(base, base)
        if stressed:
            piece = _stress(piece)
        if upper:
            piece = piece[0].upper() + piece[1:]
        out.append(piece)
        if base.isalpha():
            first_letter = False
        i += step
    return "".join(out)


def transliterate(text: str) -> str:
    """Transliterate a block of Greek, keeping punctuation and line structure."""
    lines = []
    for line in text.split("\n"):
        words = []
        for token in line.split(" "):
            if any("Ͱ" <= c <= "Ͽ" or "ἀ" <= c <= "῿" for c in token):
                words.append(_word(token))
            else:
                words.append(token)
        lines.append(" ".join(words).replace("·", ";").replace(";", "?"))
    return "\n".join(lines)
