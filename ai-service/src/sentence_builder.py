"""Ghép từ vựng ASL thành câu English bằng NLTK CFG (offline).

    python -m src.sentence_builder --words "i go school"
"""
from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

from nltk import CFG
from nltk.parse import ChartParser
from nltk.tree import Tree

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# ---------- Từ điển theo loại từ (SignDetect_50) ----------
PRON = frozenset({"i", "you", "he", "we"})
VERB = frozenset(
    {"go", "buy", "read", "play", "study", "watch", "drink", "like"}
)
NOUN = frozenset(
    {
        "book", "coffee", "food", "friend", "game", "home", "market",
        "movie", "school", "water",
    }
)
PREP = frozenset({"at", "with"})
CONJ = frozenset({"and"})
TIME = frozenset({"today", "tomorrow", "morning"})
LOCATION_NOUN = frozenset({"school", "home", "market"})

WH_WORDS = frozenset({"who", "what", "where", "when", "why", "how"})
NEGATION_WORDS = frozenset({"no", "not"})
PRONOUN_DISPLAY = {"i": "I", "me": "me", "you": "you", "we": "we", "he": "he"}

# Cấu trúc câu (CFG) — ChartParser NLTK
_GRAMMAR_CORE = r"""
    S -> STMT
    STMT -> NP VP
    STMT -> NP VP NP
    STMT -> TIME NP VP
    STMT -> NP VP TIME
    STMT -> TIME NP VP NP
    STMT -> NP VP PP
    STMT -> NP VP NP PP
    STMT -> STMT CONJ STMT
    STMT -> NP
    STMT -> VP
    STMT -> NOUN
    STMT -> TIME
    STMT -> PREP NP
    NP -> PRON | NOUN | TIME
    VP -> VERB | VERB NP
    PP -> PREP NP
    PREP -> 'at' | 'with'
"""


def _lexical_productions() -> list[str]:
    rules: list[str] = []
    for w in sorted(PRON):
        rules.append(f"PRON -> '{w}'")
    for w in sorted(VERB):
        rules.append(f"VERB -> '{w}'")
    for w in sorted(NOUN):
        rules.append(f"NOUN -> '{w}'")
    for w in sorted(TIME):
        rules.append(f"TIME -> '{w}'")
    for w in sorted(PREP):
        rules.append(f"PREP -> '{w}'")
    for w in sorted(CONJ):
        rules.append(f"CONJ -> '{w}'")
    return rules


def _build_parser() -> ChartParser:
    grammar = CFG.fromstring(_GRAMMAR_CORE + "\n" + "\n".join(_lexical_productions()))
    return ChartParser(grammar)


_PARSER: ChartParser | None = None


def _get_parser() -> ChartParser:
    global _PARSER
    if _PARSER is None:
        _PARSER = _build_parser()
    return _PARSER


@dataclass
class SentenceResult:
    text: str
    sentence_type: str
    source: str = "nltk"


def detect_sentence_type(words: list[str], modality: str = "statement") -> str:
    lower = [w.lower() for w in words]
    if any(w in WH_WORDS for w in lower):
        return "wh_question"
    if modality == "question":
        return "yn_question"
    if modality == "negation" or any(w in NEGATION_WORDS for w in lower):
        return "negation"
    return modality if modality in ("statement", "emphasis") else "statement"


def _format_word(word: str) -> str:
    return PRONOUN_DISPLAY.get(word.lower(), word.lower())


def _insert_grammar_fillers(words: list[str]) -> list[str]:
    """Chèn giới từ tối thiểu sau khi parse (go → go to school)."""
    out: list[str] = []
    i = 0
    while i < len(words):
        w = words[i]
        out.append(w)
        if (
            w == "go"
            and i + 1 < len(words)
            and words[i + 1] in LOCATION_NOUN
            and (not out or out[-1] != "to")
        ):
            out.append("to")
        i += 1
    return out


def _tree_to_words(tree: Tree) -> list[str]:
    return [str(leaf).lower() for leaf in tree.leaves()]


def _parse_with_nltk(tokens: list[str]) -> list[str] | None:
    """Trả danh sách từ đã sắp xếp theo cây parse, hoặc None nếu không parse được."""
    if not tokens:
        return None
    lower = [t.lower() for t in tokens]
    trees = list(_get_parser().parse(lower))
    if not trees:
        return None
    # Ưu tiên cây phủ hết token (tránh parse thừa / thiếu)
    best = max(trees, key=lambda t: len(t.leaves()))
    if len(_tree_to_words(best)) != len(lower):
        return None
    return _tree_to_words(best)


def _join_sentence(words: list[str], stype: str) -> str:
    if not words:
        return ""
    filled = _insert_grammar_fillers(words)
    text = " ".join(_format_word(w) for w in filled)
    text = text[0].upper() + text[1:] if text else text
    if stype in ("wh_question", "yn_question"):
        return text + "?"
    if stype == "emphasis":
        return text + "!"
    return text + "."


def _fallback_join(tokens: list[str], stype: str) -> str:
    """Khi CFG không khớp — ghép thứ tự gốc + viết hoa."""
    return _join_sentence([t.lower() for t in tokens], stype)


def polish_with_grammar(words: list[str], modality: str = "statement") -> SentenceResult:
    if not words:
        return SentenceResult("", "statement")

    stype = detect_sentence_type(words, modality)
    parsed = _parse_with_nltk(words)
    if parsed is not None:
        text = _join_sentence(parsed, stype)
        return SentenceResult(text, stype, "nltk")

    text = _fallback_join(words, stype)
    return SentenceResult(text, stype, "nltk-fallback")


def polish(
    words: list[str],
    modality: str = "statement",
    mode: str = "rule",
    api_key: str | None = None,
) -> SentenceResult:
    """Entry point — NLTK CFG (mode giữ để tương thích API cũ)."""
    return polish_with_grammar(words, modality)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--words", required=True, help="space-separated word stream")
    p.add_argument(
        "--modality",
        default="statement",
        choices=["statement", "question", "negation", "emphasis"],
    )
    args = p.parse_args()

    words = args.words.split()
    result = polish(words, args.modality)
    print(f"input:    {words}")
    print(f"modality: {args.modality}")
    print(f"type:     {result.sentence_type}")
    print(f"source:   {result.source}")
    print(f"output:   {result.text}")


if __name__ == "__main__":
    main()
