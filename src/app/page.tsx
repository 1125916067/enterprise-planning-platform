import { BarChart3, ClipboardCheck, FileText, Goal } from "lucide-react";

const modules = [
  {
    title: "战略规划",
    description: "统一管理年度目标、关键举措与跨部门里程碑。",
    icon: Goal
  },
  {
    title: "经营分析",
    description: "沉淀数据洞察，追踪预算、收入、成本与风险信号。",
    icon: BarChart3
  },
  {
    title: "文档协同",
    description: "支持计划书、报表与会议纪要的结构化归档。",
    icon: FileText
  },
  {
    title: "执行跟踪",
    description: "对齐负责人、截止日期与验收标准，推动闭环。",
    icon: ClipboardCheck
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#172033]">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-[#d8dee8] pb-5">
          <div>
            <p className="text-sm font-medium text-[#516070]">企业经营中台</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#172033]">
              Enterprise Planning Platform
            </h1>
          </div>
          <div className="rounded-md border border-[#c7d0dc] bg-white px-4 py-2 text-sm font-medium text-[#354256] shadow-sm">
            内部预览
          </div>
        </header>

        <div className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section>
            <p className="text-base font-medium text-[#3f6f8f]">
              从战略到执行的一体化计划空间
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-[#172033] md:text-5xl">
              让目标、资源、文档与进度保持在同一个工作流里。
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#516070]">
              面向管理团队、财务团队和业务负责人，构建可追踪、可复盘、可协同的企业计划平台。
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <article
                  className="rounded-lg border border-[#d8dee8] bg-white p-5 shadow-sm"
                  key={module.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e8f1f4] text-[#2d7180]">
                    <Icon aria-hidden="true" size={20} strokeWidth={2} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#172033]">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#516070]">
                    {module.description}
                  </p>
                </article>
              );
            })}
          </section>
        </div>
      </section>
    </main>
  );
}
