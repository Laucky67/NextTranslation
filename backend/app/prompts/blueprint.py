from __future__ import annotations

"""Spec Translation 蓝图生成相关提示词与分块构建。

- 生成对等理论建议（AI）
- 生成 DTS 分析与建议（AI）
- 根据蓝图字段生成默认 prompt_blocks（供用户逐块编辑）
"""

from app.models.blueprint import PromptBlock, PromptBlockId, TranslationBlueprint


EQUIVALENCE_DEFINITION = (
    "对等理论（动态对等）：优先考虑译文对目标读者产生的影响（impact），"
    "与原文对原读者产生的影响相似，而非拘泥于字面形式。"
)

PROMPT_BLOCK_TITLES: dict[PromptBlockId, str] = {
    "theory.equivalence": "对等理论（动态对等）",
    "theory.functionalism": "功能主义（目的论）",
    "theory.dts": "描述翻译学（DTS）",
    "method": "翻译方法",
    "strategy": "翻译策略",
    "context": "额外上下文",
}


def _clip(text: str | None, max_chars: int) -> str:
    if not text:
        return ""
    t = text.strip()
    if len(t) <= max_chars:
        return t
    return t[: max_chars - 1] + "…"


def build_equivalence_suggestion_prompts(
    *,
    definition: str,
    source_lang: str,
    target_lang: str,
    source_text: str,
) -> tuple[str, str]:
    system_prompt = (
        "你是资深翻译顾问。请基于“对等理论（动态对等）”为一次翻译给出建议。\n"
        "要求：\n"
        "- 输出使用简体中文\n"
        "- 只输出建议正文，不要加标题，不要列出 JSON/字段名\n"
        "- 建议要可执行、可直接用于提示词追加\n"
        "- 重点关注目标读者的阅读体验与 impact 的等效\n"
        "- 输出建议，而不是输出翻译"
    )

    user_content = (
        f"理论定义：{definition}\n\n"
        f"源语言：{source_lang}\n目标语言：{target_lang}\n\n"
        f"待翻译原文：\n{_clip(source_text, 6000)}"
    )
    return system_prompt, user_content


def build_dts_analysis_prompts(
    *,
    source_lang: str,
    target_lang: str,
    reference_source: str | None,
    reference_translation: str | None,
    source_text: str,
) -> tuple[str, str]:
    system_prompt = (
        "你是描述翻译学（DTS）方向的翻译研究者。请基于给定的参考译对，分析其风格与规范，"
        "并给出对本次待翻译文本的可执行建议。\n"
        "要求：\n"
        "- 输出使用简体中文\n"
        "- 只输出分析与建议正文，不要加标题，不要列出 JSON/字段名\n"
        "- 重点包括：风格/句法习惯/术语处理/文化指涉处理/一致性注意事项\n"
        "- 建议要可直接用于提示词追加\n"
        "- 输出分析和建议，而不是输出翻译"
    )

    user_content = (
        f"源语言：{source_lang}\n目标语言：{target_lang}\n\n"
        f"参考原文：\n{_clip(reference_source, 4000)}\n\n"
        f"参考译文：\n{_clip(reference_translation, 4000)}\n\n"
        f"待翻译原文：\n{_clip(source_text, 6000)}"
    )
    return system_prompt, user_content


def build_blueprint_default_prompt_blocks(blueprint: TranslationBlueprint) -> list[PromptBlock]:
    """根据蓝图配置生成默认提示词分块（每块 content 可编辑）。"""

    blocks: list[PromptBlock] = []

    eq_cfg = _get_theory_config(blueprint, "equivalence")
    fn_cfg = _get_theory_config(blueprint, "functionalism")
    dts_cfg = _get_theory_config(blueprint, "dts")

    # 1) 理论分块：固定顺序
    eq_enabled = bool(getattr(eq_cfg, "enabled", False))
    eq_definition = getattr(eq_cfg, "definition", None) or EQUIVALENCE_DEFINITION
    eq_suggestion = getattr(eq_cfg, "ai_suggestion", None) or ""
    eq_content = eq_definition
    if eq_suggestion.strip():
        eq_content = f"{eq_content}\n\n{eq_suggestion.strip()}"
    blocks.append(
        PromptBlock(
            id="theory.equivalence",
            enabled=eq_enabled,
            title=PROMPT_BLOCK_TITLES["theory.equivalence"],
            content=eq_content if eq_enabled else "",
            sources=["system"] + (["ai"] if eq_suggestion.strip() else []),
        )
    )

    fn_enabled = bool(getattr(fn_cfg, "enabled", False))
    purpose = _clip(getattr(fn_cfg, "purpose", None), 500)
    audience = _clip(getattr(fn_cfg, "target_audience", None), 500)
    fn_parts = ["以翻译目的为导向，优先满足目标读者的理解与使用场景。"]
    if purpose:
        fn_parts.append(f"本次翻译目的：{purpose}")
    if audience:
        fn_parts.append(f"目标读者：{audience}")
    blocks.append(
        PromptBlock(
            id="theory.functionalism",
            enabled=fn_enabled,
            title=PROMPT_BLOCK_TITLES["theory.functionalism"],
            content="\n".join(fn_parts) if fn_enabled else "",
            sources=["user"],
        )
    )

    dts_enabled = bool(getattr(dts_cfg, "enabled", False))
    ref_source = _clip(getattr(dts_cfg, "reference_source", None), 800)
    ref_trans = _clip(getattr(dts_cfg, "reference_translation", None), 800)
    dts_analysis = getattr(dts_cfg, "ai_analysis", None) or ""
    dts_parts = ["尊重目标文化规范与译入语惯例，参考既有译文风格与表达习惯。"]
    if ref_source and ref_trans:
        dts_parts.append(f"参考示例（原文）：{ref_source}")
        dts_parts.append(f"参考示例（译文）：{ref_trans}")
    if dts_analysis.strip():
        dts_parts.append(dts_analysis.strip())
    blocks.append(
        PromptBlock(
            id="theory.dts",
            enabled=dts_enabled,
            title=PROMPT_BLOCK_TITLES["theory.dts"],
            content="\n\n".join(dts_parts) if dts_enabled else "",
            sources=["user"] + (["ai"] if dts_analysis.strip() else []),
        )
    )

    # 2) 方法分块
    pref = blueprint.method.preference
    weight = blueprint.method.weight
    if pref == "literal":
        method_content = (
            f"以直译为主（严格度：{weight:.0%}），尽量保留原文结构与信息组织方式，避免不必要改写。"
        )
    elif pref == "free":
        method_content = (
            f"以意译为主（自由度：{weight:.0%}），优先目标语言自然表达，可重组句式以提升可读性。"
        )
    elif pref == "adaptation":
        method_content = (
            f"以改编为主（强度：{weight:.0%}），在不改变核心信息前提下为目标读者调整表达与结构。"
        )
    else:
        method_content = f"在直译与意译之间保持平衡（权重：{weight:.0%}），兼顾信息准确与可读性。"

    blocks.append(
        PromptBlock(
            id="method",
            enabled=True,
            title=PROMPT_BLOCK_TITLES["method"],
            content=method_content,
            sources=["system"],
        )
    )

    # 3) 策略分块
    approach = blueprint.strategy.approach
    s_weight = blueprint.strategy.weight
    if approach == "domestication":
        strategy_content = (
            f"偏向归化（强度：{s_weight:.0%}），将文化指涉与表达方式适配到目标文化习惯。"
        )
    else:
        strategy_content = (
            f"偏向异化（强度：{s_weight:.0%}），保留源文化元素与异域风格，必要时用简短说明保证理解。"
        )

    blocks.append(
        PromptBlock(
            id="strategy",
            enabled=True,
            title=PROMPT_BLOCK_TITLES["strategy"],
            content=strategy_content,
            sources=["system"],
        )
    )

    # 4) 上下文分块：默认启用，内容可为空
    blocks.append(
        PromptBlock(
            id="context",
            enabled=True,
            title=PROMPT_BLOCK_TITLES["context"],
            content=(blueprint.context or "").strip(),
            sources=["user"],
        )
    )

    return blocks


def _get_theory_config(blueprint: TranslationBlueprint, theory_id: str):
    for cfg in blueprint.theory.configs:
        if getattr(cfg, "id", None) == theory_id:
            return cfg
    return None

