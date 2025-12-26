from __future__ import annotations

from typing import Iterable

from app.models.translation import ScoredEngineResult


def build_vibe_judge_system_prompt() -> str:
    # 这个 system prompt 的职责是“约束输出格式”，把具体评分/综合规则放到 user prompt（可变部分）里。
    return "你是翻译质量评估器。只返回严格的 JSON，不要包含多余文本。"


def build_vibe_judge_prompt(*, source_text: str, intent: str, results: Iterable[ScoredEngineResult]) -> str:
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

    for r in results:
        if not r.success:
            continue
        blocks.append(f"- {r.engine_id}: {r.translated_text}")

    blocks.extend(
        [
            "",
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
