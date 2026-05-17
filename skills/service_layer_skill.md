# Skill: Django Service Layer Pattern

## Purpose
Isolate complex business operations (like Third-party Payment Hashing, Vector DB ingestion, Certificate generation) away from DRF views into specialized, testable service classes.

## Service Implementation Pattern
Create standalone Python classes under `learningapi/services/`.

Example structure for a service:
```python
import logging

logger = logging.getLogger(__name__)

class BaseBusinessService:
    def __init__(self, execution_context=None):
        self.context = execution_context

    @classmethod
    def execute_action(cls, *args, **kwargs):
        # Implementation of core domain logic
        try:
            pass
        except Exception as e:
            logger.error(f"Service Execution Failed: {str(e)}")
            raise e