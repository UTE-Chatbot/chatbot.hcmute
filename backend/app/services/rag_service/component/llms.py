from langchain.chat_models import init_chat_model
from langchain_core.language_models.chat_models import BaseChatModel
from app.core.config import settings
from app.utils.logger import logger


def get_cost_effective_chat_model(temperature: float = 0) -> BaseChatModel:
    if settings.llm_provider.lower() == "openai":
        return init_chat_model(
            model=settings.llm_cost_effective_model_name,
            temperature=temperature,
            model_provider="openai",
            openai_api_key=settings.openai_api_key
        )
    elif settings.llm_provider.lower() == "deepseek":
        return init_chat_model(
            model=settings.llm_cost_effective_model_name,
            temperature=temperature,
            model_provider="deepseek",
            deepseek_api_key=settings.deepseek_api_key
        )

def get_high_performance_chat_model(temperature: float = 0) -> BaseChatModel:
    if settings.llm_provider.lower() == "openai":
        return init_chat_model(
            model=settings.llm_high_performance_model_name,
            temperature=temperature,
            model_provider="openai",
            api_key=settings.openai_api_key
        )
    elif settings.llm_provider.lower() == "deepseek":
        return init_chat_model(
            model=settings.llm_high_performance_model_name,
            temperature=temperature,
            model_provider="deepseek",
            api_key=settings.deepseek_api_key
        )
