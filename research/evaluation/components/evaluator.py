from langchain_core.language_models import BaseChatModel

class Evaluator:
    def __init__(self, llm: BaseChatModel, vector_store: 