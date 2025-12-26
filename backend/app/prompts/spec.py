from __future__ import annotations

"""Spec Translation 蓝图到“最终翻译提示词”的转换。

该文件仅负责把 blueprint（尤其是 prompt_blocks）转换为用于最终翻译的“额外指令”文本。
蓝图生成阶段所用的提示词与默认分块构建，统一放在 `app/prompts/blueprint.py`。
"""

from app.models.blueprint import PromptBlock, TranslationBlueprint
from app.prompts.blueprint import build_blueprint_default_prompt_blocks


def build_spec_prompt_from_prompt_blocks(prompt_blocks: list[PromptBlock]) -> str:
    parts: list[str] = []
    for block in prompt_blocks:
        if not block.enabled:
            continue
        content = (block.content or "").strip()
        if not content:
            continue
        parts.append(f"{block.title}\n{content}")
    return "\n\n".join(parts).strip()


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
    # 新版：优先使用 prompt_blocks；否则根据蓝图字段生成默认分块，再拼装为提示词。
    prompt_blocks = getattr(blueprint, "prompt_blocks", None)
    if isinstance(prompt_blocks, list) and prompt_blocks:
        return build_spec_prompt_from_prompt_blocks(prompt_blocks)

    if isinstance(blueprint, TranslationBlueprint):
        default_blocks = build_blueprint_default_prompt_blocks(blueprint)
        return build_spec_prompt_from_prompt_blocks(default_blocks)

    # 兼容兜底：极端情况下 blueprint 不是新模型，直接返回空字符串避免崩溃
    return ""
