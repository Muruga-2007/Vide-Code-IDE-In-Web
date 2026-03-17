from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GOOGLE_API_KEY: str
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    TOKEN_BUDGET: int = 40000
    STAGE_TIMEOUT_SEC: int = 90
    REFINE_THRESHOLD: float = 7.5

    # File system
    WORKSPACE_ROOT: str = r"D:\videe\workspace"
    MAX_FILES_PER_PROJECT: int = 50

    # Ground-Tower concurrency
    MAX_CONCURRENT_FILES: int = 3

    # Terminal
    TERMINAL_SHELL: str = "powershell.exe"
    TERMINAL_SHELL_ARGS: list[str] = ["-NoLogo", "-NoProfile"]

    model_config = {"env_file": ".env"}


settings = Settings()
