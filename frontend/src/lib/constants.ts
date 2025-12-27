/**
 * 应用常量定义
 */

import type { Language } from "../types";

/**
 * 支持的语言列表
 */
export const LANGUAGES: Language[] = [
  { code: "auto", name: "自动检测" },
  { code: "zh", name: "中文" },
  { code: "en", name: "英语" },
  { code: "ja", name: "日语" },
  { code: "ko", name: "韩语" },
  { code: "fr", name: "法语" },
  { code: "de", name: "德语" },
  { code: "es", name: "西班牙语" },
  { code: "pt", name: "葡萄牙语" },
  { code: "ru", name: "俄语" },
];

/**
 * 可以作为目标语言的列表（排除自动检测）
 */
export const TARGET_LANGUAGES: Language[] = LANGUAGES.filter(
  (lang) => lang.code !== "auto"
);

/**
 * 翻译理论定义
 */
export const THEORY_DEFINITIONS = [
  {
    id: "equivalence" as const,
    name: "对等理论",
    englishName: "Equivalence Theory",
    description:
      "动态对等：优先确保译文对目标读者产生的影响与原文对原读者产生的影响相似",
  },
  {
    id: "functionalism" as const,
    name: "功能主义",
    englishName: "Skopos Theory",
    description: "以翻译目的为导向，根据目标读者需求调整翻译策略",
  },
  {
    id: "dts" as const,
    name: "描述翻译学",
    englishName: "Descriptive Translation Studies",
    description:
      "基于目标文化规范，参考已有译文，尊重译入语习惯，请注意：选择此项会显著增加token使用量",
  },
] as const;

/**
 * 引擎渠道选项
 */
export const CHANNEL_OPTIONS = [
  {
    value: "openai" as const,
    label: "OpenAI 兼容",
    description: "支持 OpenAI API 格式的服务",
  },
  {
    value: "anthropic" as const,
    label: "Anthropic 兼容",
    description: "支持 Anthropic API 格式的服务",
  },
] as const;

/**
 * 默认配置值
 */
export const DEFAULTS = {
  SOURCE_LANG: "auto",
  TARGET_LANG: "zh",
  MIN_TEXTAREA_HEIGHT: "150px",
  MAX_HISTORY_ITEMS: 10,
} as const;
