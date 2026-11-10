from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class QuestionContent(BaseModel):
    question: str = Field(..., description="HTML with inline MathML for the question text and options")
    solution: Optional[str] = Field(None, description="HTML with inline MathML for solution")
    answer: Any = Field(..., description="Answer key string or number, e.g. 'C', '1', ['A', 'B']")
    quesImages: List[str] = Field(default_factory=list)
    solutionImages: List[str] = Field(default_factory=list)


class QuestionItem(BaseModel):
    id: str = Field(..., alias="_id", description="Question unique identifier")
    qid: Optional[str] = None
    questionType: str = Field(..., description="scq, mcq, or integerQuestion")
    subject: Optional[str] = None
    chapter: Optional[str] = None
    concept: Optional[str] = None
    subConcept: Optional[str] = None
    level: Optional[str] = None
    error: Optional[int] = 0
    updatedAt: Optional[str] = None
    
    scq: Optional[QuestionContent] = None
    mcq: Optional[QuestionContent] = None
    integerQuestion: Optional[QuestionContent] = None

    model_config = ConfigDict(populate_by_name=True)


class OptionItem(BaseModel):
    label: str = Field(..., description="Option letter: A, B, C, D")
    raw_html: str = Field(..., description="Option HTML including any MathML")
    text: str = Field(..., description="Extracted plain text of option")
    is_blank: bool = Field(False, description="True if option has empty content")


class NormalizedQuestion(BaseModel):
    question_id: str
    qid: Optional[str] = None
    question_type: str
    subject: Optional[str] = None
    chapter: Optional[str] = None
    concept: Optional[str] = None
    sub_concept: Optional[str] = None
    difficulty: Optional[str] = None
    
    raw_question_html: str
    raw_solution_html: Optional[str] = None
    stored_answer: Any
    
    stem_text: str = Field(..., description="Extracted stem plain text")
    options: Dict[str, OptionItem] = Field(default_factory=dict)
    missing_options: List[str] = Field(default_factory=list)
    
    declared_question_images: List[str] = Field(default_factory=list)
    declared_solution_images: List[str] = Field(default_factory=list)
    inline_images: List[str] = Field(default_factory=list)
    has_missing_figure_signal: bool = False
    
    mathml_count: int = 0
    markup_warnings: List[str] = Field(default_factory=list)


class QuestionDetailResponse(BaseModel):
    raw: Dict[str, Any]
    normalized: NormalizedQuestion
    report_count: int
    reports: List[Dict[str, Any]] = Field(default_factory=list)


class QuestionListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    questions: List[Dict[str, Any]]
