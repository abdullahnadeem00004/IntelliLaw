from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class AgentState(BaseModel):
    session_id: str = ""
    user_role: str = "user"
    trace: list[dict[str, Any]] = Field(default_factory=list)
    iteration_count: int = 0
    max_iterations: int = 5

    def log_step(
        self,
        step: str,
        thought: str,
        action: str | None = None,
        result: str | None = None,
    ) -> None:
        self.trace.append({
            "step": step,
            "thought": thought,
            "action": action,
            "result": result,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        self.iteration_count += 1


class BaseAgent(ABC):
    @abstractmethod
    async def run(self, input_data: dict, state: AgentState) -> dict:
        ...
