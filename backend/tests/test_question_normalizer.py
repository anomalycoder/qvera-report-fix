import pytest
from app.services.data_loader import data_loader
from app.services.question_normalizer import question_normalizer


def test_normalize_all_questions():
    questions = data_loader.load_questions()
    for q in questions:
        norm = question_normalizer.normalize(q)
        assert norm.question_id == q["_id"]
        assert norm.question_type in ["scq", "mcq", "integerQuestion"]
        assert norm.stored_answer is not None
        assert norm.raw_question_html is not None


def test_option_extraction_scq():
    # Test standard SCQ with 4 options
    q = data_loader.get_question_by_id("60ca4feb6420652745f55522")
    assert q is not None
    norm = question_normalizer.normalize(q)

    assert norm.question_type == "scq"
    assert len(norm.options) == 4
    for label in ["A", "B", "C", "D"]:
        assert label in norm.options
        assert not norm.options[label].is_blank
    assert len(norm.missing_options) == 0


def test_integer_question_handling():
    # Integer questions have no options
    q = data_loader.get_question_by_id("68dea616d0cda73d07e93ae6")
    assert q is not None
    norm = question_normalizer.normalize(q)

    assert norm.question_type == "integerQuestion"
    assert len(norm.options) == 0
    assert len(norm.missing_options) == 0
    assert norm.stored_answer == "2"


def test_missing_option_detection():
    # Question 622f08d7b70e4b50e4500a1b is missing option D
    q = data_loader.get_question_by_id("622f08d7b70e4b50e4500a1b")
    assert q is not None
    norm = question_normalizer.normalize(q)

    assert "D" in norm.missing_options
    assert "A" in norm.options
    assert "B" in norm.options
    assert "C" in norm.options
    assert "D" not in norm.options


def test_markup_warning_detection():
    # Question 63765a28f1d8416ae0408d89 has raw \frac leak
    q = data_loader.get_question_by_id("63765a28f1d8416ae0408d89")
    assert q is not None
    norm = question_normalizer.normalize(q)

    assert len(norm.markup_warnings) > 0
    assert any("frac" in w for w in norm.markup_warnings)
