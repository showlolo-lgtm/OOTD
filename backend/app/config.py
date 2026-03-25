from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://ootd:ootd@localhost:5432/ootd"
    ANTHROPIC_API_KEY: str = ""
    REPLICATE_API_TOKEN: str = ""
    OPENWEATHERMAP_API_KEY: str = ""
    UPLOAD_DIR: str = "./uploads"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
