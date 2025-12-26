from __future__ import annotations


def build_translation_system_prompt(
    *,
    source_lang: str,
    target_lang: str,
    additional_instructions: str = "",
) -> str:
    base = (
        "You are a professional translator. "
        f"Translate the following text from {source_lang} to {target_lang}.\n"
        "Only output the translated text, without any explanations or additional content."
    )
    extra = (additional_instructions or "").strip()
    if not extra:
        return base
    return base + f"\n\nAdditional instructions:\n{extra}"

