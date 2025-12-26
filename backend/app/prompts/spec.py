from __future__ import annotations


def build_spec_blueprint_instructions(blueprint) -> str:
    """把前端的 blueprint 转成给 LLM 的“额外指令”文本。"""
    parts: list[str] = []

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
                "Follow Equivalence Theory with formal equivalence - "
                "preserve the form and structure of the source text as much as possible"
            )
        else:
            parts.append(
                "Follow Equivalence Theory with dynamic equivalence - "
                "prioritize equivalent reader response over literal form"
            )

    elif theory_id == "functionalism":
        purpose = theory_config.get("purpose", "")
        audience = theory_config.get("targetAudience", "")
        prompt_parts = [
            "Follow Functionalism/Skopos Theory - focus on the purpose of the translation"
        ]
        if purpose:
            prompt_parts.append(f"Translation purpose: {purpose}")
        if audience:
            prompt_parts.append(f"Target audience: {audience}")
        parts.append(". ".join(prompt_parts))

    elif theory_id == "dts":
        ref_source = theory_config.get("referenceSource", "")
        ref_trans = theory_config.get("referenceTranslation", "")
        prompt_parts = [
            "Follow Descriptive Translation Studies approach - "
            "respect target culture norms and conventions"
        ]
        if ref_source and ref_trans:
            prompt_parts.append(
                f"Reference style - Source: '{ref_source[:200]}' -> Translation: '{ref_trans[:200]}'"
            )
        parts.append(". ".join(prompt_parts))

    method = blueprint.method
    pref = method.get("preference", "balanced")
    weight = method.get("weight", 0.5)

    if pref == "literal":
        parts.append(
            f"Translation method: Literal translation (strictness: {weight:.1%}) - "
            "maintain source text form and structure, translate word-by-word where possible"
        )
    elif pref == "free":
        parts.append(
            f"Translation method: Free translation (freedom: {weight:.1%}) - "
            "prioritize natural expression in target language, feel free to restructure"
        )
    else:
        parts.append(
            f"Translation method: Balanced approach (weight: {weight:.1%}) - "
            "balance between form preservation and natural expression"
        )

    strategy = blueprint.strategy
    approach = strategy.get("approach", "domestication")
    strategy_weight = strategy.get("weight", 0.5)

    if approach == "domestication":
        parts.append(
            f"Translation strategy: Domestication (strength: {strategy_weight:.1%}) - "
            "adapt cultural references and expressions to target culture norms"
        )
    else:
        parts.append(
            f"Translation strategy: Foreignization (strength: {strategy_weight:.1%}) - "
            "preserve source culture elements and foreign flavor"
        )

    if blueprint.context:
        parts.append(f"Additional context: {blueprint.context}")

    return "\n\n".join(parts)

