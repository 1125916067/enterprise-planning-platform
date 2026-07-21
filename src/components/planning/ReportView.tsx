import React from "react";

import type { PlanningReport, ReportSection } from "@/lib/planning/schema";

const sectionClass = "rounded-lg border border-[#d8dee8] bg-white p-5";

export function ReportView({ report }: { report: PlanningReport }) {
  const decision = report.executiveDecision;

  return (
    <div className="space-y-5">
      <section className={sectionClass}>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase text-[#2d7180]">
            Executive Decision
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-[#172033]">
            {report.title}
          </h2>
        </div>

        <p className="text-sm leading-7 text-[#354256]">
          {decision.recommendation}
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          <DecisionMetric label="首发版本" value={decision.firstLaunchVersion} />
          <DecisionMetric label="成本范围" value={decision.estimatedCostRange} />
          <DecisionMetric label="上线周期" value={decision.estimatedTimeline} />
          <DecisionMetric label="核心用户" value={decision.coreUsers.join("、")} />
          <DecisionMetric
            label="优先平台"
            value={decision.priorityPlatforms.join("、")}
          />
          <DecisionMetric
            label="推荐团队"
            value={decision.recommendedTeam.join("、")}
          />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <ListBlock items={decision.mainRisks} title="主要风险" />
          <ListBlock items={decision.recommendedPromotionPath} title="推广路径" />
        </div>
      </section>

      {report.sections.map((section) => (
        <ReportSectionBlock key={section.title} section={section} />
      ))}

      <section className={sectionClass}>
        <h3 className="text-base font-semibold text-[#172033]">来源说明</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#516070]">
          {report.sourceNotes.map((note) => (
            <li key={note}>- {note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReportSectionBlock({ section }: { section: ReportSection }) {
  return (
    <section className={sectionClass}>
      <h3 className="text-base font-semibold text-[#172033]">{section.title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#516070]">{section.summary}</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Perspective title="保守落地型" body={section.perspectives.conservative} />
        <Perspective title="增长扩张型" body={section.perspectives.growth} />
        <Perspective title="风险评估型" body={section.perspectives.risk} />
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-[#243044]">执行动作</div>
        <ul className="mt-2 grid gap-2 text-sm leading-6 text-[#516070] md:grid-cols-2">
          {section.actions.map((action) => (
            <li className="rounded-md bg-[#f4f7f9] px-3 py-2" key={action}>
              {action}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DecisionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-20 rounded-md bg-[#f4f7f9] px-3 py-3">
      <div className="text-xs font-medium text-[#657184]">{label}</div>
      <div className="mt-1 text-sm font-semibold leading-6 text-[#243044]">
        {value}
      </div>
    </div>
  );
}

function ListBlock({ items, title }: { items: readonly string[]; title: string }) {
  return (
    <div className="rounded-md border border-[#e4e9f0] px-3 py-3">
      <div className="text-sm font-semibold text-[#243044]">{title}</div>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-[#516070]">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function Perspective({ body, title }: { body: string; title: string }) {
  return (
    <div className="min-h-[132px] rounded-md border border-[#e4e9f0] px-3 py-3">
      <div className="text-sm font-semibold text-[#2d7180]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[#516070]">{body}</p>
    </div>
  );
}
