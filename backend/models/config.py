from dataclasses import dataclass


@dataclass
class StageConfig:
    stage: str
    model: str
    temperature: float
    max_tokens: int
    display_name: str
    description: str


PIPELINE_STAGES: list[StageConfig] = [
    StageConfig(
        stage="planner",
        model="gemini-2.5-pro",
        temperature=0.2,
        max_tokens=2048,
        display_name="Planner",
        description="Analyzes the task and creates a structured implementation plan",
    ),
    StageConfig(
        stage="coder",
        model="gemini-2.5-flash",
        temperature=0.6,
        max_tokens=4096,
        display_name="Coder",
        description="Implements the plan into working code",
    ),
    StageConfig(
        stage="critic",
        model="gemini-2.5-flash",
        temperature=0.1,
        max_tokens=4096,
        display_name="Critic",
        description="Reviews code for bugs, edge cases, and security issues",
    ),
    StageConfig(
        stage="optimizer",
        model="gemini-2.0-flash",
        temperature=0.3,
        max_tokens=3072,
        display_name="Optimizer",
        description="Polishes code for readability and efficiency",
    ),
]
