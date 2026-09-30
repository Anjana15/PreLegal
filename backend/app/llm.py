"""LLM access via LiteLLM and OpenRouter, with Cerebras as the inference provider."""

from litellm import completion
from pydantic import BaseModel

from app.config import get_settings

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


def complete_structured[T: BaseModel](messages: list[dict], response_model: type[T]) -> T:
    """Ask the model for a reply matching `response_model` (Structured Outputs) and parse it."""
    response = completion(
        model=MODEL,
        messages=messages,
        response_format=response_model,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
        api_key=get_settings().openrouter_api_key or None,
    )
    return response_model.model_validate_json(response.choices[0].message.content)
