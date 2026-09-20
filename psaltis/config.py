"""Where things live. Everything is overridable by environment variable."""

from __future__ import annotations

import os
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent.parent
CATALOGUE_DIR = Path(os.environ.get("PSALTIS_CATALOGUE", REPO_DIR / "catalogue"))
# Page cache and downloaded media live outside the repo; nothing under it is ever committed.
LIBRARY_DIR = Path(os.environ.get("PSALTIS_LIBRARY", REPO_DIR.parent / "psaltis-library"))

ICXC_BASE = "https://icxc.pro"
