from __future__ import annotations

"""翻译规格（Spec/Blueprint）到提示词的转换。

将前端传来的 blueprint（翻译理论/方法/策略等配置）转换为一段“额外指令”，
供各翻译引擎在构建 system/user prompt 时拼接使用，从而实现可配置的翻译偏好控制。
"""


def build_spec_blueprint_instructions(blueprint) -> str:
    """把前端的 blueprint 转成给 LLM 的“额外指令”文本。

    预期 blueprint 结构（按当前使用到的字段）：
    - `blueprint.theory`:
      - `primary`: 理论 id（如 `"equivalence"` / `"functionalism"` / `"dts"`）
      - `configs`: 理论配置列表（包含不同理论/不同参数的配置项）
    - `blueprint.method`:
      - `preference`: `"literal"` / `"free"` / `"balanced"`
      - `weight`: 0~1（越大代表倾向越强）
    - `blueprint.strategy`:
      - `approach`: `"domestication"` / `"foreignization"`
      - `weight`: 0~1
    - `blueprint.context`: 可选补充语境/背景信息
    """
    parts: list[str] = []

    # 1) 翻译理论：从 configs 中选出 primary 对应的配置，再拼成一段英文指导语。
    theory = blueprint.theory
    theory_id = theory.get("primary", "equivalence")
    configs = theory.get("configs", [])

    theory_config = {}
    for cfg in configs:
        if cfg.get("id") == theory_id:
            theory_config = cfg
            break

    if theory_id == "equivalence":
        eq_type = theory_config.get("equivalenceType", "dynamic")
        if eq_type == "formal":
            parts.append(
                "遵循对等理论（形式对等）——尽可能保留原文的形式与结构。"
            )
        else:
            parts.append(
                "遵循对等理论（动态对等）——优先实现等效读者反应，而非拘泥于字面形式。"
            )

    elif theory_id == "functionalism":
        purpose = theory_config.get("purpose", "")
        audience = theory_config.get("targetAudience", "")
        prompt_parts = [
            "遵循功能主义/目的论——以翻译目的为核心来决定表达方式。"
        ]
        if purpose:
            prompt_parts.append(f"翻译目的：{purpose}")
        if audience:
            prompt_parts.append(f"目标受众：{audience}")
        parts.append(". ".join(prompt_parts))

    elif theory_id == "dts":
        ref_source = theory_config.get("referenceSource", "")
        ref_trans = theory_config.get("referenceTranslation", "")
        prompt_parts = [
            "遵循描述翻译学（DTS）方法——尊重目标文化的规范与惯例。"
        ]
        if ref_source and ref_trans:
            prompt_parts.append(
                f"参考风格（示例）——原文：'{ref_source[:200]}' -> 译文：'{ref_trans[:200]}'"
            )
        parts.append(". ".join(prompt_parts))

    # 2) 翻译方法：控制“直译/意译”的倾向程度。
    method = blueprint.method
    pref = method.get("preference", "balanced")
    weight = method.get("weight", 0.5)

    if pref == "literal":
        parts.append(
            f"翻译方法：直译（严格度：{weight:.1%}）——尽量保持原文形式与结构，尽可能逐词对译。"
        )
    elif pref == "free":
        parts.append(
            f"翻译方法：意译（自由度：{weight:.1%}）——优先目标语言自然表达，可适当重组句式。"
        )
    else:
        parts.append(
            f"翻译方法：平衡（权重：{weight:.1%}）——在形式保留与自然表达之间取得平衡。"
        )

    # 3) 翻译策略：控制文化表达层面的“归化/异化”取舍。
    strategy = blueprint.strategy
    approach = strategy.get("approach", "domestication")
    strategy_weight = strategy.get("weight", 0.5)

    if approach == "domestication":
        parts.append(
            f"翻译策略：归化（强度：{strategy_weight:.1%}）——将文化指涉与表达方式适配到目标文化习惯。"
        )
    else:
        parts.append(
            f"翻译策略：异化（强度：{strategy_weight:.1%}）——保留源文化元素与异域风格。"
        )

    # 4) 额外上下文：补充领域背景、语境等，提升一致性。
    if blueprint.context:
        parts.append(f"补充上下文：{blueprint.context}")

    # 按段落拼接：每一段代表一个维度的额外指令，方便阅读与调试。
    return "\n\n".join(parts)
