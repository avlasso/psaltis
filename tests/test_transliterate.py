from psaltis.transliterate import transliterate


def test_apolytikion_opening():
    assert transliterate("Κατέλυσας τῷ Σταυρῷ σου τὸν θάνατον·") == "Katélisas tó Stavró sou tón thánaton;"


def test_vowel_digraphs_and_stress_position():
    assert transliterate("Παράδεισον") == "Parádison"
    assert transliterate("Μυροφόρων") == "Mirofóron"
    assert transliterate("εὐλογητός") == "evloyitós"
    assert transliterate("εὐχαριστῶ") == "efcharistó"
    assert transliterate("Ἀποστόλοις") == "Apostólis"
    assert transliterate("κραυγάζοντες") == "kravgázondes"


def test_stress_on_first_vowel_breaks_digraph():
    assert transliterate("ἄυλος") == "áilos"


def test_consonant_clusters():
    assert transliterate("ἄγγελος") == "ángelos"
    assert transliterate("ἐγκράτεια") == "engrátia"
    assert transliterate("μπορῶ") == "boró"
    assert transliterate("ἀντί") == "andí"


def test_gamma_before_front_vowel():
    assert transliterate("γένος") == "yénos"
    assert transliterate("γάρ") == "gár"
    assert transliterate("ἁγία") == "ayía"


def test_keeps_lines_and_punctuation():
    assert transliterate("Δόξα.\nΚαὶ νῦν.") == "Dóxa.\nKé nín."
