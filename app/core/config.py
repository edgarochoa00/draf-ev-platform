from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "+EV Sports Betting Engine"
    API_V1_STR: str = "/api/v1"
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "prueba-dde32-firebase-adminsdk-fbsvc-aeb12f9889.json"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: str = "6379"
    
    @property
    def REDIS_URI(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
