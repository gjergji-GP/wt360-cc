export function SCHome({ d, setPage, deps }) {
  const { scAmt, SCKpi, SCPipeline, SCQuarPressure, SCAllocOverview, SCRecvFollowUp, SCMasterData, SCWastePanel } = deps;
  const { kpis, pipe, quarantines, procTasks, recvTasks, waste, vpm } = d;

  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "var(--sc-muted)",
          marginBottom: 14,
        }}
      >
        Live Control Signals
      </div>
      <div className="sc-kpi-grid">
        <SCKpi
          label="Open Allocation Tasks"
          val={kpis.openAlloc}
          sub="Awaiting verification or allocation"
          icon="layers"
          numCls={kpis.openAlloc > 3 ? "c-warn" : kpis.openAlloc > 0 ? "c-acc" : "c-pos"}
          alertCls={kpis.openAlloc > 3 ? "alert-o" : ""}
          onClick={() => setPage("sc-tasks")}
          className="sc-fu sc-d1"
        />
        <SCKpi
          label="Open Quarantines"
          val={kpis.openQuar}
          sub={kpis.openQuar > 0 ? `${kpis.highSev} HIGH · ${kpis.medSev} MEDIUM` : "Pipeline clean"}
          icon="alert"
          numCls={kpis.openQuar > 0 ? "c-neg" : "c-pos"}
          alertCls={kpis.openQuar > 0 ? "alert-r" : ""}
          onClick={() => setPage("sc-quar")}
        />
        <SCKpi
          label="Blocked Invoices"
          val={kpis.blocked}
          sub="Cannot proceed to allocation"
          icon="lock"
          numCls={kpis.blocked > 0 ? "c-neg" : "c-pos"}
          alertCls={kpis.blocked > 0 ? "alert-r" : ""}
          onClick={() => setPage("sc-quar")}
        />
        <SCKpi
          label="Awaiting Receiving"
          val={kpis.awaitRecv}
          sub="Physical truth pending at locations"
          icon="truck"
          numCls={kpis.awaitRecv > 0 ? "c-acc" : "c-pos"}
          onClick={() => setPage("sc-recv")}
        />
        <SCKpi
          label="Overdue Quarantine SLA"
          val={kpis.overdueSLA}
          sub="Needs immediate SC action"
          icon="clock"
          numCls={kpis.overdueSLA > 0 ? "c-neg" : "c-pos"}
          alertCls={kpis.overdueSLA > 0 ? "alert-r" : ""}
          onClick={() => setPage("sc-quar")}
        />
        <SCKpi
          label="Waste Value"
          val={kpis.wasteAmt > 0 ? scAmt(kpis.wasteAmt) : "0 ALL"}
          sub="Selected period - by location"
          icon="zap"
          numCls={kpis.wasteAmt > 0 ? "c-warn" : "c-pos"}
          onClick={() => setPage("sc-reports")}
        />
      </div>
      <div className="sc-g2" style={{ marginBottom: 20 }}>
        <SCPipeline d={pipe} />
        <SCQuarPressure quarantines={quarantines} onOpen={() => setPage("sc-quar")} />
      </div>
      <div className="sc-g2" style={{ marginBottom: 20 }}>
        <SCAllocOverview procTasks={procTasks} onOpen={() => setPage("sc-alloc")} />
        <SCRecvFollowUp receiveTasks={recvTasks} onOpen={() => setPage("sc-recv")} />
      </div>
      <div className="sc-g2">
        <SCMasterData vpm={vpm} />
        <SCWastePanel waste={waste} />
      </div>
    </div>
  );
}
