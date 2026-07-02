"""
Shared parsing helpers for external platform API responses.

Both LeetCodeClient and CodeforcesClient return loosely-typed JSON
(dict[str, object]) since neither platform publishes a typed schema
we can rely on at the Python level. These coercion functions are
identical in shape to what LeetCodeService already has inline — this
is the one piece of real, mechanical duplication worth extracting,
since unlike the connect/sync orchestration (which differs by
exception type and repository shape per platform), int/str coercion
has no platform-specific behavior at all.

Note: LeetCodeService keeps its own inline _as_int/_as_str (working
code, intentionally not refactored). CodeforcesService uses these
shared versions, so future third platforms have one obvious place to
import from instead of two diverging copies.
"""


def as_int(value: object) -> int:
    """Safely coerce untyped external API data to int, at the one boundary that needs to."""
    if not isinstance(value, int | str):
        raise ValueError(f"Expected an int-convertible value, got {type(value).__name__}.")
    return int(value)


def as_optional_int(value: object) -> int | None:
    if value is None:
        return None
    return as_int(value)


def as_str(value: object) -> str:
    if value is None:
        raise ValueError("Expected a string value, got None.")
    return str(value)


def as_optional_str(value: object) -> str | None:
    if value is None:
        return None
    return str(value)
