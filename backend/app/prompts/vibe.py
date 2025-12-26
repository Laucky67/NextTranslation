from __future__ import annotations

"""Vibe 评审（Judge）提示词构建。
- `build_vibe_judge_system_prompt`：system prompt，主要负责约束输出格式（例如必须返回 JSON）。
- `build_vibe_judge_prompt`：user prompt，包含具体评分维度、候选译文与输出 JSON 结构约束。
"""

from typing import Iterable

from app.models.translation import ScoredEngineResult


def build_vibe_judge_system_prompt() -> str:
    """构建 Vibe 评审的 system prompt。
    """
    return "你是翻译质量评估器。只返回严格的 JSON，不要包含多余文本。"


def build_vibe_judge_prompt(
    *, source_text: str, intent: str, results: Iterable[ScoredEngineResult]
) -> str:
    """构建 Vibe 评审的 user prompt。

    参数:
    - source_text: 原文。
    - intent: 用户的翻译要求/意图（例如风格、术语偏好等）。
    - results: 各翻译引擎的候选结果（仅会纳入 `success=True` 的项）。

    输出:
    - 返回一段文本提示词，要求 LLM 以严格 JSON 结构输出：
      1) 对每个候选译文给出多维度评分与简短评语；
      2) 综合各家优点生成“最终最佳译文”（必须是新生成，不得直接拷贝某个候选）。
    """
    # 逐段拼装提示词：先给角色与总体任务，再给原文/意图/候选译文，最后给 JSON 输出模板。
    blocks: list[str] = [
        "你是翻译质量评估器与译文整合者。",
        "你会先为每个候选译文打分并给出约100字的评语，评语自行然后综合各家优势生成“最终最佳译文”。",
        "注意：最终最佳译文必须是综合后的新译文，不允许直接复制任何一个候选译文。",
        "",
        f"原文：{source_text}",
        f"用户翻译要求/意图：{intent}",
        "",
        "候选译文如下（engine_id -> 译文）：",
    ]

    '''将每个模型的翻译结果，以“ id+结果 ”的形式追加进提示词'''
    for r in results:
        # 只纳入成功返回的翻译结果，避免把失败信息污染到评审输入里。
        if not r.success:
            continue
        blocks.append(f"- {r.engine_id}: {r.translated_text}")

    '''严格规定输出格式，追加至提示词最后'''
    blocks.extend(
        [
            "",
            # 用明确的“输出模板”约束模型返回结构，便于下游稳定解析。
            "请严格输出一个 JSON 对象，结构如下：",
            "{",
            '  "scores": [',
            '    {"engine_id": "xxx", "accuracy": 0-10, "fluency": 0-10, "style_match": 0-10, "terminology": 0-10, "comment": "约100字"},',
            "    ...",
            "  ],",
            '  "final": {',
            '    "translation": "最终最佳译文（必须综合生成）",',
            '    "comment": "对最终译文的约100字评语",',
            '    "rationale": "约200字说明你如何综合取舍",',
            '    "overall": 0-10',
            "  }",
            "}",
        ]
    )

    return "\n".join(blocks)
