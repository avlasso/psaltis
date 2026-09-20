"""Command line: `python -m psaltis <command>`.

  ingest DATE SERVICE [ID…]  ingest one icxc page, optionally only the given hymn IDs / prefixes
                             (DATE is YYYY-MM-DD; SERVICE is the icxc path segment, e.g. liturgy)
"""

from __future__ import annotations

import argparse
import datetime as dt
import sys


def cmd_ingest(args):
    from .ingest import ingest_service

    date = dt.date.fromisoformat(args.date)
    hymns = ingest_service(date, args.service, only=set(args.ids) or None, media=not args.no_media, refresh=args.refresh)
    for h in hymns:
        print(f"{h.id:45} mode={h.mode} {h.designation_en or h.mode_en}")
    print(f"{len(hymns)} hymns")


def main(argv=None):
    p = argparse.ArgumentParser(prog="psaltis", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("ingest")
    s.add_argument("date")
    s.add_argument("service")
    s.add_argument("ids", nargs="*")
    s.add_argument("--no-media", action="store_true", help="record score/audio URLs without downloading them")
    s.add_argument("--refresh", action="store_true", help="re-fetch the page instead of using the cache")
    s.set_defaults(fn=cmd_ingest)

    args = p.parse_args(argv)
    args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
