from dataclasses import dataclass
from typing import List
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from components.prompt import LLM_ONLY_PROMPT
from config import settings

@dataclass
class PipelineResult:
    question: str
    context: List[str]
    doc_ids: List[str]
    answer: str

class LLMOnlyPipeline:
    """
    Pipeline chi dung LLM, khong truy xuat du lieu
    """
    def __init__(
        self,
        model_name: str = "gpt-4o-mini",
        temperature: float = 0.0
    ):
        self.llm = ChatOpenAI(model=model_name, temperature=temperature, api_key=settings.api_key)

    async def run(self, question: str) -> PipelineResult:
        prompt = LLM_ONLY_PROMPT.format(question=question)
        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        return PipelineResult(
            question=question,
            context=[],
            doc_ids=[],
            answer=response.content
        )
