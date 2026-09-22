import json
from pathlib import Path

import pytest

from psaltis import ingest

# Fixtures are runs of table rows cut from real icxc pages; the comment at the top of each says
# which page and which rows. Only `p.hymn` rows keep their `data-translations`.
FIXTURES = Path(__file__).parent / "fixtures"


def _parse(name: str) -> list[ingest.ParsedHymn]:
    return ingest.parse_service_page((FIXTURES / name).read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def hymns():
    return _parse("vespers-apolytikion.html")


@pytest.fixture(scope="module")
def liturgy():
    return {h.id: h for h in _parse("liturgy-anaphora.html")}


@pytest.fixture(scope="module")
def stichera():
    return _parse("vespers-stichera.html")


def test_hymn_id_drops_language_and_text_suffix():
    assert ingest.hymn_id("oc.m7.d1_gr_GR_cog|ocVE.Apolytikion.text") == "oc.m7.d1.ocVE.Apolytikion"
    assert ingest.hymn_id("me.m09.d20_gr_GR_cog|meVE.Apolytikion1.text") == "me.m09.d20.meVE.Apolytikion1"
    assert ingest.hymn_id("eu.lichrysbasil_gr_US_goa|euLI.Key1311.text") == "eu.lichrysbasil.euLI.Key1311"


def test_key_context():
    assert ingest.key_context("oc.m7.d1_gr_GR_cog|ocVE.Apolytikion.text") == ("Octoechos", "Vespers")
    assert ingest.key_context("me.m09.d20_gr_GR_cog|meVE.Apolytikion1.text") == ("Menaion", "Vespers")
    assert ingest.key_context("he.ga_gr_GR_cog|heGA.OiMartyresSouKyrie.text") == ("Heirmologion", "General")
    assert ingest.key_context("eu.lichrysbasil_gr_US_goa|euLI.Key1311.text") == ("Euchologion", "Liturgy")


def test_label_mode():
    assert ingest.label_mode("Mode 4 Kliton | RBarrett/") == 4
    assert ingest.label_mode("Mode pl. 2 (HC) | SDedes/") == 6
    assert ingest.label_mode("Thyateira | Mode pl. 1 (long)/") == 5
    assert ingest.label_mode("Psalm 102 | Mode pl.4 | SDedes/") == 8
    assert ingest.label_mode("SDedes / pl. 4 | long") == 8
    assert ingest.label_mode("Psalm 145 | Grave Mode | SDedes/") == 7
    assert ingest.label_mode("Mode 1 - SDedes/") == 1
    assert ingest.label_mode("All Modes | AGES") is None
    assert ingest.label_mode("GTheodoridis/") is None


# --- Vespers: the apolytikion fixture ------------------------------------------------------------


def test_parses_both_hymns_in_page_order(hymns):
    assert [h.id for h in hymns] == ["oc.m7.d1.ocVE.Apolytikion", "he.ga.heGA.OiMartyresSouKyrie"]


def test_resurrectional_apolytikion_fields(hymns):
    h = hymns[0]
    assert h.text_gr.startswith("Κατέλυσας τῷ Σταυρῷ σου τὸν θάνατον")
    assert h.text_gr.endswith("τὸ μέγα ἔλεος.")
    assert h.text_en.startswith("You destroyed death by Your Cross")
    assert h.text_en.endswith("the great mercy.")
    assert h.version_en == "GOASD"
    assert h.mode == 7
    assert h.mode_gr == "Ἦχος βαρύς."
    assert h.mode_en == "Grave Mode."
    assert h.designation_gr == "Ἀπολυτίκιον Ἀναστάσιμον."
    assert h.designation_en == "Resurrectional Apolytikion."
    assert h.source_en.startswith("From Octoechos")
    assert h.melody_model_gr == ""
    assert h.book == "Octoechos" and h.service == "Vespers"
    assert "GOASD" in h.translations_en and "Lash" in h.translations_en


def test_scores_and_audio_come_from_the_key_row(hymns):
    h = hymns[0]
    greek_byz = [s for s in h.scores if s.language == "gr" and s.notation == "byzantine"]
    assert {s.source for s in greek_byz} == {"theodoridis", "jmboyer"}
    assert all(s.path.startswith("media/m/") for s in h.scores)
    assert all(s.url.startswith("https://icxc.pro/api/file?path=") for s in h.scores)
    assert all(s.label for s in h.scores)
    # score text never bleeds into the hymn text
    assert "GTheodoridis" not in h.text_gr and "c1014" not in h.text_gr
    assert {a.source for a in h.audio} == {"dedes", "eikona"}
    assert all(a.language == "en" for a in h.audio)


def test_melody_model_and_designation_do_not_leak(hymns):
    h = hymns[1]
    assert h.mode == 4
    assert h.melody_model_gr == "Ταχὺ προκατάλαβε."
    assert h.melody_model_en == "Come quickly."
    assert h.designation_gr == ""  # this hymn had no designation row of its own
    assert h.text_gr.startswith("Οἱ Μάρτυρές σου Κύριε")


# --- Vespers: Kekragaria, stichera, Glory / Both now ----------------------------------------------


def test_local_media_row_serves_the_hymn_after_it(stichera):
    v1, v2 = stichera[0], stichera[1]
    assert (v1.id, v2.id) == ("liturgical.verses.psVE.lihc.v1", "liturgical.verses.psVE.lihc.v2")
    assert v1.mode == v2.mode == 8
    assert {s.path.split("/")[-1] for s in v1.scores} >= {"lihc1.pdf", "lihc_concise.pdf"}
    assert not any("lihc2" in s.path for s in v1.scores)
    assert all("lihc2" in s.path for s in v2.scores)  # the second row replaced the first


def test_own_media_closes_local_media(stichera):
    by_id = {h.id: h for h in stichera}
    assert {s.path.split("/")[-1] for s in by_id["oc.m8.d1.ocVE.Stichera1"].scores} >= {"stichera1.pdf"}
    # the Menaion stichera have no media of their own and must not inherit the stichologia's
    assert by_id["me.m09.d27.meVE.Stichera01"].scores == []
    assert by_id["me.m09.d27.meVE.Stichera03"].scores == []


def test_mode_inside_glory_and_both_now_rows(stichera):
    by_id = {h.id: h for h in stichera}
    assert by_id["me.m09.d27.meVE.Stichera01"].mode == 8  # "Ἦχος πλ. δʹ. Ὢ τοῦ παραδόξου."
    assert by_id["me.m09.d27.meVE.SticGlory"].mode == 4  # "Δόξα." then "Ἦχος δʹ."
    # "Καὶ νῦν. Ἦχος πλ. δʹ." is one `mixed` row; the Theotokion is pl. 4, not the Glory's 4
    assert by_id["oc.m8.d1.ocVE.SticTheotokion"].mode == 8
    assert by_id["oc.m8.d1.ocVE.SticTheotokion"].mode_gr.startswith("Καὶ νῦν.")


# --- Liturgy: Kontakion to Axion Estin -------------------------------------------------------------


def test_liturgy_page_order(liturgy):
    assert list(liturgy) == [
        "he.a.m4.heAU.OYpsotheisEnToStavro",
        "ho.ho07.hoLI.TrisagiosHymn",
        "ho.ho07.hoLI.TrisagiosHymnDynamis",
        "eu.lichrysbasil.euLI.Key1102",
        "eu.lichrysbasil.euLI.Key1123",
        "eu.lichrysbasil.euLI.Key1205",
        "eu.lichrysbasil.euLI.Key1311",
        "eu.lichrysbasil.euLI.Key1318",
        "prayers.pr.ItIsTrulyRight_complete",
    ]


def test_holy_holy_holy(liturgy):
    h = liturgy["eu.lichrysbasil.euLI.Key1311"]
    assert h.icxc_key == "eu.lichrysbasil_gr_US_goa|euLI.Key1311.text"
    assert h.text_gr.startswith("Ἅγιος, ἅγιος, ἅγιος, Κύριος Σαβαώθ")
    assert h.text_gr.endswith("Ὡσαννά, ὁ ἐν τοῖς ὑψίστοις.")
    assert h.text_en.startswith("Holy, holy, holy, Lord Sabaoth")
    assert h.text_en.endswith("Hosanna in the highest.")
    assert h.book == "Euchologion" and h.service == "Liturgy"
    assert "GOA" in h.translations_en and "Lash" in h.translations_en
    # The page prints no mode line for the Anaphora responses, and neither does the parser.
    assert h.mode is None and h.mode_en == ""
    # The Creed's designation, three litanies back, does not reach it.
    assert h.designation_en == ""
    # Its own media slot is empty; the Liturgika filed under ΤΑ ΠΛΗΡΩΤΙΚΑ stand in.
    assert h.scores and all("liturgicmode" in s.path for s in h.scores)
    byz = [s for s in h.scores if s.notation == "byzantine"]
    assert {(s.source, s.language, s.mode) for s in byz} == {("barrett", "gr", 4), ("barrett", "en", 4)}
    assert {s.mode for s in h.scores} == {1, 4, 6, 8}
    pl4 = [s for s in h.scores if s.mode == 8]
    assert pl4 and all(s.language == "en" and s.notation == "western" for s in pl4)
    assert h.audio == []


def test_section_media_reaches_the_anaphora_and_stops_at_own_media(liturgy):
    liturgika = {s.path for s in liturgy["eu.lichrysbasil.euLI.Key1311"].scores}
    # "Father, Son and Holy Spirit" opens the same set
    assert {s.path for s in liturgy["eu.lichrysbasil.euLI.Key1205"].scores} == liturgika
    # "We praise You" has a score of its own, which closes the section
    assert [s.path.split("/")[-1] for s in liturgy["eu.lichrysbasil.euLI.Key1318"].scores] == ["wepraiseyoumode8.pdf"]
    assert liturgy["prayers.pr.ItIsTrulyRight_complete"].scores == []
    # a hymn with no media slot at all gets nothing
    assert liturgy["eu.lichrysbasil.euLI.Key1123"].scores == []


def test_mode_and_designation_stop_at_spoken_rows(liturgy):
    k = liturgy["he.a.m4.heAU.OYpsotheisEnToStavro"]
    assert k.mode == 4 and k.melody_model_en == "Automelon."
    t = liturgy["ho.ho07.hoLI.TrisagiosHymn"]
    assert t.mode is None and t.mode_en == "" and t.melody_model_gr == ""
    assert t.designation_en == "Trisagios Hymn"
    assert t.source_en == ""
    assert len(t.scores) > 10  # its own key row
    c = liturgy["eu.lichrysbasil.euLI.Key1102"]
    assert c.designation_en == "The Cherubic Hymn."
    assert c.mode is None
    # own media wins over the Alleluia's local media row before it
    assert all("cherubic" in s.path for s in c.scores)


# --- writing ---------------------------------------------------------------------------------------


def test_write_hymn_keeps_operator_fields(hymns, tmp_path):
    p = ingest.write_hymn(hymns[0], "/2026/09/19/vespers/", catalogue_dir=tmp_path)
    rec = json.loads(p.read_text(encoding="utf-8"))
    assert rec["id"] == "oc.m7.d1.ocVE.Apolytikion"
    assert rec["title_gr"] == "Κατέλυσας τῷ Σταυρῷ σου"
    assert "settings" not in rec
    assert rec["icxc"]["mode"] == 7
    assert rec["icxc"]["page"] == "/2026/09/19/vespers/"
    assert rec["icxc"]["scores"][0]["label"]

    rec["slug"] = "you-descended"
    rec["title_gr"] = "Κατέλυσας"
    rec["settings"] = [{"id": "gr-grave", "language": "gr", "mode": "grave"}]
    rec["rundown_note"] = "kept"
    p.write_text(json.dumps(rec, ensure_ascii=False), encoding="utf-8")

    ingest.write_hymn(hymns[0], "/2026/10/03/vespers/", catalogue_dir=tmp_path)
    rec2 = json.loads(p.read_text(encoding="utf-8"))
    assert rec2["slug"] == "you-descended"
    assert rec2["title_gr"] == "Κατέλυσας"
    assert rec2["settings"] == [{"id": "gr-grave", "language": "gr", "mode": "grave"}]
    assert rec2["rundown_note"] == "kept"
    assert rec2["icxc"]["page"] == "/2026/10/03/vespers/"


def test_write_holy_holy_holy(liturgy, tmp_path):
    p = ingest.write_hymn(liturgy["eu.lichrysbasil.euLI.Key1311"], "/2026/09/20/liturgy/", catalogue_dir=tmp_path)
    rec = json.loads(p.read_text(encoding="utf-8"))
    assert p.name == "eu.lichrysbasil.euLI.Key1311.json"
    assert rec["title_gr"] == "Ἅγιος, ἅγιος, ἅγιος, Κύριος"
    assert rec["title_en"] == "Holy, holy, holy, Lord"
    assert rec["icxc"]["mode"] is None
    assert any(s["notation"] == "byzantine" for s in rec["icxc"]["scores"])
