WORKFLOW FRAMEWORK RULES
- Core Tech Stack: Django 5.2+, React 19+ (Vite SPA, Material-UI Web). 
- STRICT RULE: NO REACT NATIVE.
- Code Pattern: Áp dụng nghiêm ngặt Service Layer Pattern cho logic nghiệp vụ phức tạp.
- DB Optimization: Tối ưu giảm lỗi N+1 Query bằng select_related/prefetch_related.
- Code: All code and comments should be in English.
- Quality Gate & Auto-Audit Hook: Every code modification phase must conclude with an automatic cross-layer diagnostic self-review defined in `rules/auto_audit_rules.md`. Never declare a task complete without evaluating your Git Diff for architectural regression, memory leaks, or contract drifting between Django and React.