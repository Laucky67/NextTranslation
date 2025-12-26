"""提示词构建模块。

按职责拆分：
- `system.py`：通用翻译 system prompt 骨架。
- `spec.py`：将前端 blueprint 转为额外指令（additional instructions）。
- `vibe.py`：候选译文打分 + 融合生成最终译文的提示词。
"""

__all__ = ["spec", "system", "vibe"]
