import { z } from "zod";

import {
  budgetRangeValues,
  businessModelValues,
  currentStageValues,
  industryValues,
  launchPlatformValues,
  marketValues,
  productTypeValues,
  promotionChannelValues,
  teamResourceValues,
  technicalFeatureValues,
  userProfileValues
} from "./options";

const requiredText = z.string().trim().min(1);

const uniqueEnumArray = <TValues extends readonly [string, ...string[]]>(
  values: TValues
) =>
  z
    .array(z.enum(values))
    .min(1)
    .refine((items) => new Set(items).size === items.length, {
      message: "Duplicate selections are not allowed."
    });

export const planningInputSchema = z
  .object({
    productName: requiredText,
    description: requiredText,
    productTypes: uniqueEnumArray(productTypeValues),
    industries: uniqueEnumArray(industryValues),
    currentStage: z.enum(currentStageValues),
    businessModels: uniqueEnumArray(businessModelValues),
    targetMarkets: uniqueEnumArray(marketValues),
    userProfiles: uniqueEnumArray(userProfileValues),
    launchPlatforms: uniqueEnumArray(launchPlatformValues),
    budgetRange: z.enum(budgetRangeValues),
    technicalFeatures: uniqueEnumArray(technicalFeatureValues),
    teamResources: uniqueEnumArray(teamResourceValues),
    promotionChannels: uniqueEnumArray(promotionChannelValues),
    customNotes: z.string().trim().optional()
  })
  .strict();

export const perspectiveSchema = z
  .object({
    conservative: requiredText,
    growth: requiredText,
    risk: requiredText
  })
  .strict();

export const reportSectionSchema = z
  .object({
    title: requiredText,
    summary: requiredText,
    perspectives: perspectiveSchema,
    actions: z.array(requiredText).min(1)
  })
  .strict();

export const executiveDecisionSchema = z
  .object({
    recommendation: requiredText,
    firstLaunchVersion: requiredText,
    estimatedCostRange: requiredText,
    estimatedTimeline: requiredText,
    coreUsers: z.array(requiredText).min(1),
    priorityPlatforms: z.array(requiredText).min(1),
    mainRisks: z.array(requiredText).min(1),
    recommendedTeam: z.array(requiredText).min(1),
    recommendedPromotionPath: z.array(requiredText).min(1)
  })
  .strict();

export const costRowSchema = z
  .object({
    category: requiredText,
    item: requiredText,
    estimate: requiredText,
    timing: requiredText,
    owner: requiredText,
    rationale: requiredText
  })
  .strict();

export const launchRowSchema = z
  .object({
    phase: requiredText,
    timeframe: requiredText,
    platform: requiredText,
    goal: requiredText,
    successMetric: requiredText
  })
  .strict();

export const recruitmentRowSchema = z
  .object({
    role: requiredText,
    priority: requiredText,
    timing: requiredText,
    responsibility: requiredText,
    hiringType: requiredText
  })
  .strict();

export const promotionRowSchema = z
  .object({
    channel: requiredText,
    audience: requiredText,
    message: requiredText,
    budget: requiredText,
    metric: requiredText
  })
  .strict();

export const taskRowSchema = z
  .object({
    milestone: requiredText,
    task: requiredText,
    owner: requiredText,
    due: requiredText,
    status: requiredText
  })
  .strict();

export const planningReportSchema = z
  .object({
    title: requiredText,
    generatedAt: z.string().datetime(),
    executiveDecision: executiveDecisionSchema,
    sections: z.array(reportSectionSchema).min(8),
    boards: z
      .object({
        costs: z.array(costRowSchema).min(1),
        launches: z.array(launchRowSchema).min(1),
        recruitments: z.array(recruitmentRowSchema).min(1),
        promotions: z.array(promotionRowSchema).min(1),
        tasks: z.array(taskRowSchema).min(1)
      })
      .strict(),
    sourceNotes: z.array(requiredText).min(1)
  })
  .strict();

export type PlanningInput = z.infer<typeof planningInputSchema>;
export type Perspective = z.infer<typeof perspectiveSchema>;
export type ReportSection = z.infer<typeof reportSectionSchema>;
export type ExecutiveDecision = z.infer<typeof executiveDecisionSchema>;
export type CostRow = z.infer<typeof costRowSchema>;
export type LaunchRow = z.infer<typeof launchRowSchema>;
export type RecruitmentRow = z.infer<typeof recruitmentRowSchema>;
export type PromotionRow = z.infer<typeof promotionRowSchema>;
export type TaskRow = z.infer<typeof taskRowSchema>;
export type PlanningReport = z.infer<typeof planningReportSchema>;
