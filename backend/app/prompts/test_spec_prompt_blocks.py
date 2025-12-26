import unittest

from app.models.blueprint import (
    DTSTheoryConfig,
    EquivalenceTheoryConfig,
    FunctionalismTheoryConfig,
    TranslationBlueprint,
)
from app.prompts.blueprint import build_blueprint_default_prompt_blocks
from app.prompts.spec import build_spec_prompt_from_prompt_blocks


class TestSpecPromptBlocks(unittest.TestCase):
    def test_build_default_blocks_and_prompt(self):
        blueprint = TranslationBlueprint()
        blueprint.theory.configs = [
            EquivalenceTheoryConfig(enabled=True, ai_suggestion="建议 A"),
            FunctionalismTheoryConfig(enabled=True, purpose="用于技术文档", targetAudience="开发者"),
            DTSTheoryConfig(
                enabled=True,
                referenceSource="Ref S",
                referenceTranslation="Ref T",
                ai_analysis="分析 B",
            ),
        ]
        blueprint.method.preference = "literal"
        blueprint.method.weight = 0.7
        blueprint.strategy.approach = "foreignization"
        blueprint.strategy.weight = 0.6
        blueprint.context = "这是额外上下文"

        blocks = build_blueprint_default_prompt_blocks(blueprint)
        prompt = build_spec_prompt_from_prompt_blocks(blocks)

        self.assertIn("对等理论（动态对等）", prompt)
        self.assertIn("建议 A", prompt)
        self.assertIn("功能主义（目的论）", prompt)
        self.assertIn("用于技术文档", prompt)
        self.assertIn("描述翻译学（DTS）", prompt)
        self.assertIn("分析 B", prompt)
        self.assertIn("翻译方法", prompt)
        self.assertIn("直译", prompt)
        self.assertIn("翻译策略", prompt)
        self.assertIn("异化", prompt)
        self.assertIn("额外上下文", prompt)
        self.assertIn("这是额外上下文", prompt)


if __name__ == "__main__":
    unittest.main()
