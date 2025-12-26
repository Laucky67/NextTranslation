from __future__ import annotations

"""通用 system prompt 构建。用于简单翻译与氛围翻译中的单词翻译

此处的 system prompt 主要用于约束“翻译任务”的角色与输出形式，
并支持在末尾追加来自 blueprint/业务规则的额外指令。
"""

def build_translation_system_prompt(
    *,
    source_lang: str,
    target_lang: str,
    additional_instructions: str = "",
) -> str:
    """构建翻译引擎使用的 system prompt。
    - `source_lang` / `target_lang`：用于显式声明翻译方向，减少模型误解。
    - `additional_instructions`：可选追加指令（例如由 Spec/Blueprint 生成的偏好约束）。
    """
    base = (
        "你是一名专业翻译。"
        f"请将以下文本从 {source_lang} 翻译成 {target_lang}。\n"
        "只输出译文，不要包含任何解释或额外内容。"
    )
    # 额外指令为空时，直接返回基础提示词，避免无意义的空段落。
    extra = (additional_instructions or "").strip()
    if not extra:
        return base
    # 统一以一个分隔段落追加，便于日志/调试中快速定位附加约束。
    return base + f"\n\n补充要求：\n{extra}"
