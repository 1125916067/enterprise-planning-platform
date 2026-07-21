"use client";

import { Sparkles } from "lucide-react";
import React from "react";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";

import {
  budgetRangeOptions,
  businessModelOptions,
  currentStageOptions,
  industryOptions,
  launchPlatformOptions,
  marketOptions,
  productTypeOptions,
  promotionChannelOptions,
  teamResourceOptions,
  technicalFeatureOptions,
  userProfileOptions,
  type PlanningOption
} from "@/lib/planning/options";
import type { PlanningInput } from "@/lib/planning/schema";

type MultiSelectKey =
  | "productTypes"
  | "industries"
  | "businessModels"
  | "targetMarkets"
  | "userProfiles"
  | "launchPlatforms"
  | "technicalFeatures"
  | "teamResources"
  | "promotionChannels";

type SelectionState = Record<MultiSelectKey, string[]>;

const inputClass =
  "w-full rounded-md border border-[#c7d0dc] bg-white px-3 py-2 text-sm text-[#172033] outline-none transition focus:border-[#2d7180] focus:ring-2 focus:ring-[#d8edf1]";

const initialSelections: SelectionState = {
  productTypes: ["saas"],
  industries: ["enterprise_services"],
  businessModels: ["subscription"],
  targetMarkets: ["china"],
  userProfiles: ["operations_manager"],
  launchPlatforms: ["web"],
  technicalFeatures: ["analytics_dashboard"],
  teamResources: ["product_manager"],
  promotionChannels: ["content_marketing"]
};

const groups: {
  key: MultiSelectKey;
  title: string;
  helper: string;
  options: readonly PlanningOption[];
}[] = [
  {
    key: "productTypes",
    title: "产品类型",
    helper: "选择产品形态，帮助报告判断交付边界和定价方式。",
    options: productTypeOptions
  },
  {
    key: "industries",
    title: "行业领域",
    helper: "可多选相邻行业，用于生成更贴近客户场景的建议。",
    options: industryOptions
  },
  {
    key: "businessModels",
    title: "商业模式",
    helper: "标记收入路径，后续会影响成本、推广和团队配置。",
    options: businessModelOptions
  },
  {
    key: "targetMarkets",
    title: "目标市场",
    helper: "用于判断上线平台、本地化、渠道和合规重点。",
    options: marketOptions
  },
  {
    key: "userProfiles",
    title: "用户画像",
    helper: "选择主要使用者或决策者，报告会优先围绕他们展开。",
    options: userProfileOptions
  },
  {
    key: "launchPlatforms",
    title: "上线平台",
    helper: "决定首发版本范围、研发复杂度和发布节奏。",
    options: launchPlatformOptions
  },
  {
    key: "technicalFeatures",
    title: "技术功能",
    helper: "勾选关键能力，便于评估研发投入和技术风险。",
    options: technicalFeatureOptions
  },
  {
    key: "teamResources",
    title: "团队资源",
    helper: "说明现有或计划投入的人力，报告会据此安排招聘优先级。",
    options: teamResourceOptions
  },
  {
    key: "promotionChannels",
    title: "推广渠道",
    helper: "选择适合早期验证和增长复制的获客方式。",
    options: promotionChannelOptions
  }
];

export function ProductIntakeForm({
  onGenerate,
  onKnowledgeUpload,
  loading
}: {
  onGenerate: (input: PlanningInput) => void | Promise<void>;
  onKnowledgeUpload: (file: File) => void | Promise<void>;
  loading: boolean;
}) {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [currentStage, setCurrentStage] =
    useState<PlanningInput["currentStage"]>("idea");
  const [budgetRange, setBudgetRange] =
    useState<PlanningInput["budgetRange"]>("budget_500k_1m");
  const [customNotes, setCustomNotes] = useState("");
  const [selections, setSelections] = useState<SelectionState>(initialSelections);

  const canSubmit = useMemo(
    () =>
      productName.trim().length > 0 &&
      description.trim().length > 0 &&
      Object.values(selections).every((items) => items.length > 0),
    [description, productName, selections]
  );

  function updateSelection(key: MultiSelectKey, value: string) {
    setSelections((current) => {
      const values = current[key];
      const next = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return { ...current, [key]: next };
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    void onGenerate({
      productName: productName.trim(),
      description: description.trim(),
      productTypes: selections.productTypes as PlanningInput["productTypes"],
      industries: selections.industries as PlanningInput["industries"],
      businessModels:
        selections.businessModels as PlanningInput["businessModels"],
      targetMarkets: selections.targetMarkets as PlanningInput["targetMarkets"],
      userProfiles: selections.userProfiles as PlanningInput["userProfiles"],
      launchPlatforms:
        selections.launchPlatforms as PlanningInput["launchPlatforms"],
      technicalFeatures:
        selections.technicalFeatures as PlanningInput["technicalFeatures"],
      teamResources: selections.teamResources as PlanningInput["teamResources"],
      promotionChannels:
        selections.promotionChannels as PlanningInput["promotionChannels"],
      currentStage,
      budgetRange,
      customNotes: customNotes.trim()
    });
  }

  function uploadKnowledge(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void onKnowledgeUpload(file);
    event.target.value = "";
  }

  return (
    <aside className="h-auto rounded-lg border border-[#d8dee8] bg-white xl:h-[calc(100vh-32px)] xl:overflow-auto">
      <form className="space-y-5 p-5" onSubmit={submit}>
        <div>
          <p className="text-xs font-semibold uppercase text-[#2d7180]">
            Product Intake
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-[#172033]">
            产品专业输入
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#516070]">
            用结构化选择描述产品、市场、团队和推广条件。
          </p>
        </div>

        <label className="block space-y-2" htmlFor="product-name">
          <span className="text-sm font-medium text-[#243044]">产品名称</span>
          <input
            className={inputClass}
            id="product-name"
            onChange={(event) => setProductName(event.target.value)}
            required
            value={productName}
          />
        </label>

        <label className="block space-y-2" htmlFor="product-description">
          <span className="text-sm font-medium text-[#243044]">产品简介</span>
          <textarea
            className={`${inputClass} min-h-28 resize-y leading-6`}
            id="product-description"
            onChange={(event) => setDescription(event.target.value)}
            required
            value={description}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SelectField
            label="当前阶段"
            onChange={(value) =>
              setCurrentStage(value as PlanningInput["currentStage"])
            }
            options={currentStageOptions}
            value={currentStage}
          />
          <SelectField
            label="预算范围"
            onChange={(value) =>
              setBudgetRange(value as PlanningInput["budgetRange"])
            }
            options={budgetRangeOptions}
            value={budgetRange}
          />
        </div>

        {groups.map((group) => (
          <OptionGroup
            key={group.key}
            helper={group.helper}
            onToggle={(value) => updateSelection(group.key, value)}
            options={group.options}
            selected={selections[group.key]}
            title={group.title}
          />
        ))}

        <label className="block space-y-2" htmlFor="custom-notes">
          <span className="text-sm font-medium text-[#243044]">补充说明</span>
          <textarea
            className={`${inputClass} min-h-24 resize-y leading-6`}
            id="custom-notes"
            onChange={(event) => setCustomNotes(event.target.value)}
            placeholder="例如：已有客户资源、上线时间约束、合规要求或希望规避的方向。"
            value={customNotes}
          />
        </label>

        <label className="block space-y-2" htmlFor="knowledge-upload">
          <span className="text-sm font-medium text-[#243044]">
            上传知识文件
          </span>
          <input
            aria-label="上传知识文件"
            accept=".txt,.md,.csv,.xlsx,.docx,.pdf"
            className={inputClass}
            id="knowledge-upload"
            onChange={uploadKnowledge}
            type="file"
          />
          <span className="block text-xs leading-5 text-[#657184]">
            支持 txt、md、csv、xlsx、docx 和 pdf。旧版 xls 请另存为 xlsx 后上传。
          </span>
        </label>

        <button
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2d7180] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#235d69] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || !canSubmit}
          type="submit"
        >
          <Sparkles aria-hidden="true" size={18} />
          {loading ? "生成中..." : "生成企业规划报告"}
        </button>
      </form>
    </aside>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly PlanningOption[];
  value: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#243044]">{label}</span>
      <select
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function OptionGroup({
  helper,
  onToggle,
  options,
  selected,
  title
}: {
  helper: string;
  onToggle: (value: string) => void;
  options: readonly PlanningOption[];
  selected: readonly string[];
  title: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-[#243044]">{title}</legend>
      <p className="text-xs leading-5 text-[#657184]">{helper}</p>
      <div className="grid grid-cols-1 gap-2">
        {options.map((option) => {
          const active = selected.includes(option.value);

          return (
            <button
              aria-pressed={active}
              className={`min-h-[74px] rounded-md border px-3 py-2 text-left text-sm transition ${
                active
                  ? "border-[#2d7180] bg-[#e8f1f4] text-[#173f47]"
                  : "border-[#d8dee8] bg-white text-[#172033] hover:border-[#8ab8c0]"
              }`}
              key={option.value}
              onClick={() => onToggle(option.value)}
              type="button"
            >
              <span className="block font-medium">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-[#516070]">
                {option.helper}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
