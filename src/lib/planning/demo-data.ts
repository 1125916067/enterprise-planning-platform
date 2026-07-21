import { type PlanningReport, planningReportSchema } from "./schema";

export const demoReport: PlanningReport = planningReportSchema.parse({
  title: "智能门店运营平台规划报告",
  generatedAt: "2026-07-21T08:00:00.000Z",
  executiveDecision: {
    recommendation:
      "建议先以库存预测、门店经营看板和异常提醒作为首发范围，选择3至5家门店完成闭环试点，再逐步扩展排班、会员运营和自动补货能力。",
    firstLaunchVersion: "MVP 版本：Web 管理端加移动端轻量入口",
    estimatedCostRange: "50万至100万人民币",
    estimatedTimeline: "12至16周完成首批试点上线",
    coreUsers: ["区域运营经理", "门店店长", "商品运营专员"],
    priorityPlatforms: ["Web 管理端", "微信小程序", "开放数据接口"],
    mainRisks: ["历史销售和库存数据质量不稳定", "门店执行流程差异导致培训成本上升", "预测结果需要时间建立业务信任"],
    recommendedTeam: ["产品经理", "全栈工程师", "数据分析师", "客户成功经理"],
    recommendedPromotionPath: ["标杆门店试点", "行业社群分享", "客户成功案例", "区域直销拜访"]
  },
  sections: [
    {
      title: "目标定位",
      summary:
        "产品应定位为连锁零售经营效率工具，先解决库存、缺货和滞销的可视化问题，再延伸到自动化运营建议。",
      perspectives: {
        conservative: "先以经营看板和人工确认建议为主，避免过早承诺全自动决策。",
        growth: "把库存预测包装成可复制的门店增长方案，利于形成行业案例。",
        risk: "如果目标过宽，首版会被排班、会员、采购等需求拉散。"
      },
      actions: ["确认首发北极星指标", "梳理门店日常运营决策链路", "冻结 MVP 功能边界"]
    },
    {
      title: "用户与场景",
      summary:
        "核心用户是区域运营经理和门店店长，他们需要快速识别异常库存、跟进门店执行并向总部解释经营变化。",
      perspectives: {
        conservative: "优先服务管理半径明确的区域团队，降低跨组织推广难度。",
        growth: "围绕店长每日任务入口建立使用习惯，提高数据采集和反馈频率。",
        risk: "一线用户如果觉得系统增加填报负担，会影响试点活跃度。"
      },
      actions: ["完成10位运营和店长访谈", "整理高频异常场景", "定义店长每日待办模板"]
    },
    {
      title: "首发功能",
      summary:
        "首发功能包括门店经营总览、库存异常列表、单品趋势分析、补货建议、任务跟进和基础权限管理。",
      perspectives: {
        conservative: "先保留人工确认环节，保证建议可解释、可回溯。",
        growth: "将趋势分析和行动建议组合成可展示的价值闭环。",
        risk: "过多自定义报表会拉长开发周期，应延后到付费客户阶段。"
      },
      actions: ["完成信息架构", "输出关键页面原型", "定义异常规则和建议逻辑"]
    },
    {
      title: "数据策略",
      summary:
        "MVP 需要接入历史销售、库存、商品档案和门店基础信息，并建立数据质量检查和异常提示机制。",
      perspectives: {
        conservative: "先支持 Excel 导入和标准接口两种方式，减少系统对接阻力。",
        growth: "沉淀标准指标口径，为后续跨客户复制和行业基准分析打基础。",
        risk: "数据缺失、编码不统一和滞后同步会直接影响预测可信度。"
      },
      actions: ["设计数据字段模板", "建立导入校验规则", "设置数据质量评分"]
    },
    {
      title: "商业模式",
      summary:
        "建议采用门店数量阶梯订阅加实施服务费，试点阶段以低门槛套餐换取数据和案例授权。",
      perspectives: {
        conservative: "首批客户以试点服务费覆盖交付成本，避免长期免费试用。",
        growth: "按门店数量扩展收入，便于从区域客户升级到总部采购。",
        risk: "如果价值指标不能量化，续费谈判会变成定制服务议价。"
      },
      actions: ["制定试点报价", "定义续费价值指标", "准备客户案例授权条款"]
    },
    {
      title: "发布节奏",
      summary:
        "项目应分为调研确认、原型验证、MVP 开发、试点上线和复盘扩展五个阶段，每阶段设置明确验收标准。",
      perspectives: {
        conservative: "以两周为迭代周期，优先修复影响试点闭环的问题。",
        growth: "在试点中同步准备销售材料和案例素材，缩短下一批客户转化周期。",
        risk: "若试点范围没有负责人签字确认，需求会持续膨胀。"
      },
      actions: ["建立阶段验收表", "安排双周评审", "定义上线回滚方案"]
    },
    {
      title: "组织配置",
      summary:
        "早期团队应小而完整，由产品、工程、数据分析和客户成功组成，必要设计和测试资源可阶段性外包。",
      perspectives: {
        conservative: "保持核心团队精简，先让产品经理兼任项目管理。",
        growth: "尽早配置客户成功，确保试点门店执行和反馈闭环。",
        risk: "缺少数据分析角色会让预测能力停留在展示层，难以形成差异化。"
      },
      actions: ["确认核心岗位职责", "安排外包测试预算", "制定客户成功试点手册"]
    },
    {
      title: "推广路径",
      summary:
        "推广应先从行业社群、存量关系和区域标杆门店切入，用可量化改善数据支持直销拜访。",
      perspectives: {
        conservative: "先控制投放预算，把资源集中在高意向客户访谈和试点转化。",
        growth: "把试点前后对比沉淀为白皮书、直播分享和销售简报。",
        risk: "过早大规模投放会带来低质量线索，消耗销售和交付资源。"
      },
      actions: ["整理首批目标客户名单", "准备试点案例模板", "启动行业内容选题"]
    }
  ],
  boards: {
    costs: [
      {
        category: "产品研发",
        item: "MVP 功能开发",
        estimate: "30万至45万人民币",
        timing: "第1至12周",
        owner: "技术负责人",
        rationale: "覆盖核心页面、权限、数据导入、异常规则和基础测试。"
      },
      {
        category: "数据建设",
        item: "数据清洗和预测模型初版",
        estimate: "12万至20万人民币",
        timing: "第3至12周",
        owner: "数据分析师",
        rationale: "建立标准字段、质量评分和可解释预测逻辑。"
      },
      {
        category: "试点运营",
        item: "培训、驻场和复盘",
        estimate: "8万至15万人民币",
        timing: "第13至16周",
        owner: "客户成功经理",
        rationale: "确保门店能持续使用并产出可验证案例。"
      }
    ],
    launches: [
      {
        phase: "原型评审",
        timeframe: "第3至4周",
        platform: "Web 原型",
        goal: "验证核心流程和指标口径",
        successMetric: "关键用户确认80%以上核心页面"
      },
      {
        phase: "试点上线",
        timeframe: "第13至16周",
        platform: "Web 管理端和微信小程序",
        goal: "完成3至5家门店真实数据试点",
        successMetric: "试点门店周活跃率超过70%"
      }
    ],
    recruitments: [
      {
        role: "数据分析师",
        priority: "高",
        timing: "第1个月",
        responsibility: "负责指标口径、数据质量规则和预测逻辑验证",
        hiringType: "合同制转长期"
      },
      {
        role: "客户成功经理",
        priority: "中",
        timing: "试点前4周",
        responsibility: "负责培训、反馈收集、案例沉淀和续费线索推进",
        hiringType: "兼职顾问或内部调配"
      }
    ],
    promotions: [
      {
        channel: "行业社群",
        audience: "连锁零售运营负责人",
        message: "用门店数据减少缺货和滞销损耗",
        budget: "3万至5万人民币",
        metric: "获取20个有效线索"
      },
      {
        channel: "直销拜访",
        audience: "区域连锁品牌总部",
        message: "通过试点数据证明门店经营改善",
        budget: "5万至8万人民币",
        metric: "达成3个付费试点"
      }
    ],
    tasks: [
      {
        milestone: "需求确认",
        task: "完成10位目标用户访谈并输出需求优先级",
        owner: "产品经理",
        due: "第2周",
        status: "计划中"
      },
      {
        milestone: "数据接入",
        task: "完成销售、库存、商品和门店模板校验",
        owner: "数据分析师",
        due: "第6周",
        status: "计划中"
      },
      {
        milestone: "试点复盘",
        task: "输出试点前后指标对比和下一阶段路线图",
        owner: "客户成功经理",
        due: "第16周",
        status: "计划中"
      }
    ]
  },
  sourceNotes: [
    "示例内容仅用于产品演示和测试，不包含真实客户资料、账号、密钥或商业秘密。",
    "成本、周期和推广指标为通用规划估算，正式使用前应结合团队能力和客户数据重新校准。"
  ]
});
