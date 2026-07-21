export type PlanningOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  helper: string;
};

export const productTypeValues = [
  "saas",
  "mobile_app",
  "marketplace",
  "ai_tool",
  "hardware_enabled",
  "service_platform"
] as const;

export const industryValues = [
  "retail",
  "education",
  "healthcare",
  "finance",
  "manufacturing",
  "logistics",
  "enterprise_services"
] as const;

export const currentStageValues = [
  "idea",
  "research",
  "prototype",
  "mvp",
  "growth",
  "scale"
] as const;

export const businessModelValues = [
  "subscription",
  "transaction_commission",
  "license",
  "usage_based",
  "service_fee",
  "advertising"
] as const;

export const marketValues = [
  "china",
  "north_america",
  "europe",
  "southeast_asia",
  "global_niche",
  "local_city"
] as const;

export const userProfileValues = [
  "founder",
  "operations_manager",
  "finance_lead",
  "sales_lead",
  "field_staff",
  "consumer_user",
  "enterprise_admin"
] as const;

export const launchPlatformValues = [
  "web",
  "ios",
  "android",
  "wechat_mini_program",
  "desktop",
  "api"
] as const;

export const budgetRangeValues = [
  "budget_under_100k",
  "budget_100k_500k",
  "budget_500k_1m",
  "budget_1m_3m",
  "budget_above_3m"
] as const;

export const technicalFeatureValues = [
  "analytics_dashboard",
  "ai_recommendation",
  "workflow_automation",
  "payment_integration",
  "role_permissions",
  "data_import_export",
  "notification_system",
  "third_party_api"
] as const;

export const teamResourceValues = [
  "product_manager",
  "ui_designer",
  "frontend_engineer",
  "backend_engineer",
  "data_engineer",
  "qa_engineer",
  "growth_marketer",
  "customer_success"
] as const;

export const promotionChannelValues = [
  "industry_events",
  "content_marketing",
  "search_ads",
  "social_media",
  "partner_channels",
  "direct_sales",
  "customer_referral",
  "community_operations"
] as const;

export const productTypeOptions: readonly PlanningOption<
  (typeof productTypeValues)[number]
>[] = [
  { value: "saas", label: "SaaS 平台", helper: "适合持续订阅、多人协作和企业级管理场景。" },
  { value: "mobile_app", label: "移动应用", helper: "适合高频个人使用、移动办公和现场作业。" },
  { value: "marketplace", label: "交易撮合平台", helper: "适合连接供需双方并通过交易规模增长。" },
  { value: "ai_tool", label: "AI 工具", helper: "适合自动化分析、内容生成和智能辅助决策。" },
  { value: "hardware_enabled", label: "软硬结合产品", helper: "适合需要设备采集、边缘控制或线下交付的业务。" },
  { value: "service_platform", label: "服务运营平台", helper: "适合将专业服务流程标准化、产品化。" }
];

export const industryOptions: readonly PlanningOption<
  (typeof industryValues)[number]
>[] = [
  { value: "retail", label: "零售连锁", helper: "关注库存、门店效率、会员运营和毛利改善。" },
  { value: "education", label: "教育培训", helper: "关注课程交付、教务管理、续费和学习效果。" },
  { value: "healthcare", label: "医疗健康", helper: "关注合规、数据安全、服务体验和专业流程。" },
  { value: "finance", label: "金融服务", helper: "关注风控、合规审计、客户分层和运营效率。" },
  { value: "manufacturing", label: "制造业", helper: "关注产线协同、质量追踪、供应链和设备效率。" },
  { value: "logistics", label: "物流供应链", helper: "关注履约时效、路径优化、成本控制和节点可视化。" },
  { value: "enterprise_services", label: "企业服务", helper: "关注组织协同、销售效率、项目交付和客户成功。" }
];

export const currentStageOptions: readonly PlanningOption<
  (typeof currentStageValues)[number]
>[] = [
  { value: "idea", label: "概念阶段", helper: "需求和商业假设尚待验证。" },
  { value: "research", label: "调研阶段", helper: "正在访谈客户、评估市场和梳理竞品。" },
  { value: "prototype", label: "原型阶段", helper: "已有可演示流程，适合小范围验证。" },
  { value: "mvp", label: "MVP 阶段", helper: "已有最小可用版本，需要优化首批用户留存。" },
  { value: "growth", label: "增长阶段", helper: "已有稳定客户，需要扩大获客和收入规模。" },
  { value: "scale", label: "规模化阶段", helper: "需要强化组织、系统、合规和运营效率。" }
];

export const businessModelOptions: readonly PlanningOption<
  (typeof businessModelValues)[number]
>[] = [
  { value: "subscription", label: "订阅制", helper: "适合持续价值交付和可预测收入。" },
  { value: "transaction_commission", label: "交易佣金", helper: "适合交易平台、撮合业务和供需网络。" },
  { value: "license", label: "授权许可", helper: "适合企业私有化部署或年度授权。" },
  { value: "usage_based", label: "按量计费", helper: "适合 API、算力、消息或数据处理类产品。" },
  { value: "service_fee", label: "服务费", helper: "适合顾问、代运营、实施和专业交付。" },
  { value: "advertising", label: "广告变现", helper: "适合有足够流量和明确人群标签的产品。" }
];

export const marketOptions: readonly PlanningOption<
  (typeof marketValues)[number]
>[] = [
  { value: "china", label: "中国市场", helper: "适合本地渠道、微信生态和行业关系驱动的增长。" },
  { value: "north_america", label: "北美市场", helper: "适合成熟 SaaS 采购、内容获客和高客单价策略。" },
  { value: "europe", label: "欧洲市场", helper: "适合重视隐私、合规和多语言本地化的业务。" },
  { value: "southeast_asia", label: "东南亚市场", helper: "适合移动优先和区域伙伴合作。" },
  { value: "global_niche", label: "全球细分市场", helper: "适合垂直场景、英文内容和远程交付。" },
  { value: "local_city", label: "本地城市市场", helper: "适合线下服务、区域试点和密集运营。" }
];

export const userProfileOptions: readonly PlanningOption<
  (typeof userProfileValues)[number]
>[] = [
  { value: "founder", label: "创始人/负责人", helper: "关注战略判断、资源投入和收入结果。" },
  { value: "operations_manager", label: "运营经理", helper: "关注流程效率、执行质量和跨团队协同。" },
  { value: "finance_lead", label: "财务负责人", helper: "关注预算、成本、回款和经营指标。" },
  { value: "sales_lead", label: "销售负责人", helper: "关注线索、转化、客户分层和续约。" },
  { value: "field_staff", label: "一线员工", helper: "关注任务清晰度、移动可用性和操作负担。" },
  { value: "consumer_user", label: "个人消费者", helper: "关注体验、价格、信任和即时反馈。" },
  { value: "enterprise_admin", label: "企业管理员", helper: "关注权限、安全、审计和配置能力。" }
];

export const launchPlatformOptions: readonly PlanningOption<
  (typeof launchPlatformValues)[number]
>[] = [
  { value: "web", label: "Web 管理端", helper: "适合复杂配置、数据看板和企业后台流程。" },
  { value: "ios", label: "iOS 应用", helper: "适合高频移动使用和较高体验要求。" },
  { value: "android", label: "Android 应用", helper: "适合覆盖更广移动设备和现场场景。" },
  { value: "wechat_mini_program", label: "微信小程序", helper: "适合轻量触达、分享传播和本地服务。" },
  { value: "desktop", label: "桌面端", helper: "适合专业工具、重度操作和本地文件处理。" },
  { value: "api", label: "开放 API", helper: "适合生态集成、伙伴分发和自动化工作流。" }
];

export const budgetRangeOptions: readonly PlanningOption<
  (typeof budgetRangeValues)[number]
>[] = [
  { value: "budget_under_100k", label: "10万以内", helper: "适合验证需求和制作可演示原型。" },
  { value: "budget_100k_500k", label: "10万至50万", helper: "适合小团队交付 MVP 和有限试点。" },
  { value: "budget_500k_1m", label: "50万至100万", helper: "适合完整 MVP、基础运营和首批客户试点。" },
  { value: "budget_1m_3m", label: "100万至300万", helper: "适合多端发布、数据能力和增长投入。" },
  { value: "budget_above_3m", label: "300万以上", helper: "适合规模化产品、合规建设和市场扩张。" }
];

export const technicalFeatureOptions: readonly PlanningOption<
  (typeof technicalFeatureValues)[number]
>[] = [
  { value: "analytics_dashboard", label: "数据看板", helper: "用于追踪关键指标、趋势和经营异常。" },
  { value: "ai_recommendation", label: "AI 推荐", helper: "用于预测、排序、建议和智能辅助决策。" },
  { value: "workflow_automation", label: "流程自动化", helper: "用于减少重复操作并推动任务闭环。" },
  { value: "payment_integration", label: "支付集成", helper: "用于订单、订阅、退款和财务对账。" },
  { value: "role_permissions", label: "角色权限", helper: "用于企业组织、数据隔离和审计管理。" },
  { value: "data_import_export", label: "数据导入导出", helper: "用于历史迁移、报表交付和系统对接。" },
  { value: "notification_system", label: "消息通知", helper: "用于提醒、审批、异常预警和用户召回。" },
  { value: "third_party_api", label: "第三方 API", helper: "用于连接外部系统、生态伙伴和自动化工具。" }
];

export const teamResourceOptions: readonly PlanningOption<
  (typeof teamResourceValues)[number]
>[] = [
  { value: "product_manager", label: "产品经理", helper: "负责需求判断、路线图和验收标准。" },
  { value: "ui_designer", label: "UI/UX 设计师", helper: "负责用户体验、界面规范和可用性验证。" },
  { value: "frontend_engineer", label: "前端工程师", helper: "负责 Web 或移动端交互实现。" },
  { value: "backend_engineer", label: "后端工程师", helper: "负责服务端、数据模型、权限和接口。" },
  { value: "data_engineer", label: "数据工程师", helper: "负责数据接入、清洗、指标和分析基础。" },
  { value: "qa_engineer", label: "测试工程师", helper: "负责质量策略、自动化测试和发布验收。" },
  { value: "growth_marketer", label: "增长营销", helper: "负责获客渠道、内容、投放和转化优化。" },
  { value: "customer_success", label: "客户成功", helper: "负责试点推进、培训、续费和反馈闭环。" }
];

export const promotionChannelOptions: readonly PlanningOption<
  (typeof promotionChannelValues)[number]
>[] = [
  { value: "industry_events", label: "行业活动", helper: "适合高信任度获客和重点客户交流。" },
  { value: "content_marketing", label: "内容营销", helper: "适合沉淀专业认知、SEO 和长期线索。" },
  { value: "search_ads", label: "搜索广告", helper: "适合承接明确需求和可量化投放测试。" },
  { value: "social_media", label: "社交媒体", helper: "适合品牌曝光、案例传播和用户教育。" },
  { value: "partner_channels", label: "伙伴渠道", helper: "适合借助生态伙伴进入目标客户群。" },
  { value: "direct_sales", label: "直销拜访", helper: "适合高客单价、复杂决策链和定制化方案。" },
  { value: "customer_referral", label: "客户转介绍", helper: "适合依赖口碑和标杆客户背书的业务。" },
  { value: "community_operations", label: "社群运营", helper: "适合持续互动、需求收集和轻量转化。" }
];
