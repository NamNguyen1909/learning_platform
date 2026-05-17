# Django 5.2+ & DRF Coding Rules

## ViewSet Constraints
- DO NOT use generic `ModelViewSet` or `GenericViewSet` with blind mixins.
- Always declare actions explicitly using explicit API View classes.
- Pattern template:
  ```python
  from rest_framework import viewsets, generics
  
  class ExampleViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
      queryset = Example.objects.all()
      serializer_class = ExampleSerializer

## View Architecture (Hybrid Approach)
- Use **`views.py`** for **Simple CRUD & Core Logic** (single-responsibility).
- Use **`api_views.py`** ONLY for **Complex Operations** requiring DRF ViewSets (e.g., advanced filtering, custom actions).
- **Rule**: Never mix ViewSet logic into `views.py`.

## Database Optimization
- **Strict N+1 Prevention**: You MUST use `select_related()` (ForeignKey/OneToOne) and `prefetch_related()` (ManyToMany) in EVERY query that accesses related objects.
- **Validation**: Before finalizing code, verify optimized queries using Django Debug Toolbar or `connection.queries`.

## Model & Admin Sync
- When creating a new model in `models.py`, you MUST:
  - Create a corresponding serializer in `serializers.py`.
  - Automatically register the model in `admin.py` with `list_display`.

## Code Style & Language
- All code, variable names, function names, docstrings, and comments MUST be written in **English**.