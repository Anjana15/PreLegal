from types import SimpleNamespace

from pydantic import BaseModel

from app import llm


class Party(BaseModel):
    name: str
    city: str


def fake_response(content: str):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])


def test_complete_structured_calls_cerebras_and_parses_reply(monkeypatch):
    calls = []

    def fake_completion(**kwargs):
        calls.append(kwargs)
        return fake_response('{"name": "Acme Inc.", "city": "Austin"}')

    monkeypatch.setattr(llm, "completion", fake_completion)
    messages = [{"role": "user", "content": "Who is the first party?"}]

    result = llm.complete_structured(messages, Party)

    assert result == Party(name="Acme Inc.", city="Austin")
    [call] = calls
    assert call["model"] == "openrouter/openai/gpt-oss-120b"
    assert call["extra_body"] == {"provider": {"order": ["cerebras"]}}
    assert call["response_format"] is Party
    assert call["reasoning_effort"] == "low"
    assert call["messages"] == messages
