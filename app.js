"use strict";
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const PC_ = [
  "#2f7bff",
  "#8b5cf6",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];
const col = (id) =>
    PC_[((parseInt(String(id).replace(/\D/g, "")) || 1) - 1) % 8],
  pill = (id) => `<span class="pid" style="background:${col(id)}">${id}</span>`;
let SPD = 1;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms / SPD)),
  pad = (n) => String(n).padStart(2, "0"),
  now = () => {
    const d = new Date();
    return (
      pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds())
    );
  };
const toast = (m) => {
  const d = document.createElement("div");
  d.textContent = m;
  $("#toast").append(d);
  setTimeout(() => d.remove(), 2800);
};
const raf = (f) => requestAnimationFrame(() => requestAnimationFrame(f));
const spdCtl = () =>
  `<label class="spd">⚡ Speed <input type="range" class="sp" min=".25" max="4" step=".25" value="${SPD}"><b class="sv">${SPD}x</b></label>`;
document.addEventListener("input", (e) => {
  if (e.target.classList && e.target.classList.contains("sp")) {
    SPD = +e.target.value;
    $$(".sp").forEach((x) => (x.value = SPD));
    $$(".sv").forEach((x) => (x.textContent = SPD + "x"));
  }
});
const EDF = {}; // click-to-edit registry: any element with class "ed" becomes an inline input
document.addEventListener("click", (e) => {
  const t = e.target.closest(".ed");
  if (!t || t.querySelector("input")) return;
  const old = t.dataset.v ?? t.textContent.trim(),
    i = document.createElement("input");
  i.type = t.dataset.t || "number";
  i.value = old;
  i.className = "edi";
  i.style.width = Math.max(64, String(old).length * 9 + 34) + "px";
  t.textContent = "";
  t.append(i);
  i.focus();
  i.select();
  let done = 0;
  const fin = (ok) => {
    if (done) return;
    done = 1;
    const txt = t.dataset.d ?? old;
    if (ok) {
      const v = i.type == "number" ? +i.value : i.value.trim();
      if (i.type == "number" && (i.value === "" || isNaN(v))) {
        toast("⚠ Enter a valid number");
        t.textContent = txt;
      } else EDF[t.dataset.f](t.dataset.a, v);
    } else t.textContent = txt;
  };
  i.onblur = () => fin(1);
  i.onkeydown = (ev) => {
    if (ev.key == "Enter") i.blur();
    if (ev.key == "Escape") fin(0);
  };
});
function cu(el, v) {
  if (!el) return;
  const f = +el.dataset.v || 0;
  el.dataset.v = v;
  if (isNaN(v)) {
    el.textContent = v;
    return;
  }
  const t0 = performance.now();
  (function s(t) {
    const k = Math.min(1, (t - t0) / 500);
    el.textContent = Math.round(f + (v - f) * k);
    if (k < 1) requestAnimationFrame(s);
  })(t0);
}
const tabs = (id, o) =>
  `<div class="tabs" id="${id}">${Object.keys(o)
    .map(
      (k, i) => `<button class="${i ? "" : "on"}" data-k="${k}">${k}</button>`,
    )
    .join("")}</div><div class="tc" id="${id}c">${Object.values(o)[0]}</div>`;
function tabInit(id, o) {
  $$("#" + id + " button").forEach(
    (b) =>
      (b.onclick = () => {
        $$("#" + id + " button").forEach((x) =>
          x.classList.toggle("on", x == b),
        );
        const c = $("#" + id + "c");
        c.style.animation = "none";
        c.offsetWidth;
        c.style.animation = "";
        c.innerHTML = o[b.dataset.k];
      }),
  );
}
/* global events feed */
const EV = [];
function ev(m, c = "#22c55e") {
  EV.unshift({ t: now(), m, c });
  if (EV.length > 30) EV.length = 30;
}
let page = "dash";
const hero = (ic, c, t, d, x = "") =>
  `<div class="c hero"><span class="ic" style="--c:${c}">${ic}</span><div><h1>${t}</h1><p>${d}</p></div>${x}</div>`;
const kpi = (ic, c, l, id, v, s) =>
  `<div class="c k" style="border-color:${c}"><span class="ic" style="--c:${c}">${ic}</span><div><small>${l}</small><b ${id ? `id="${id}"` : ""} ${v == null ? "" : `data-v="0"`}>${v ?? ""}</b><em>${s}</em></div></div>`;

/* ================= CPU SCHEDULING ================= */
const TN = [
  "Student Login",
  "Question Delivery",
  "Answer Evaluation",
  "Result Generation",
  "Database Update",
  "Plagiarism Scan",
  "Grade Export",
  "Audit Log",
];
let CP = [
    [0, 6, 2],
    [1, 4, 1],
    [2, 8, 3],
    [3, 5, 2],
    [4, 3, 1],
  ].map((x, i) => ({
    id: "P" + (i + 1),
    name: TN[i],
    at: x[0],
    bt: x[1],
    pr: x[2],
  })),
  CR = null,
  cgk = 0,
  ctok = 0,
  calg = "FCFS";
function sched(alg, procs, q = 2) {
  const Q = procs.map((p) => ({ ...p, rem: p.bt, ct: 0, rt: -1 })),
    tl = [];
  let t = 0,
    done = 0,
    cur = null,
    qn = 0,
    rq = [],
    seen = {};
  const key = {
    FCFS: (p) => p.at,
    SJF: (p) => p.bt,
    SRTF: (p) => p.rem,
    PRI: (p) => p.pr,
    PRIP: (p) => p.pr,
    MLQ: (p) => (p.pr <= 1 ? 0 : 1),
  }[alg];
  while (done < Q.length && t < 3000) {
    Q.forEach((p) => {
      if (p.at <= t && !seen[p.id]) {
        seen[p.id] = 1;
        rq.push(p);
      }
    });
    if (alg == "RR") {
      if (!cur || cur.rem == 0 || qn >= q) {
        if (cur && cur.rem > 0) rq.push(cur);
        cur = rq.shift() || null;
        qn = 0;
      }
    } else {
      const keep = cur && cur.rem > 0 && ["FCFS", "SJF", "PRI"].includes(alg);
      if (!keep)
        cur =
          Q.filter((p) => p.at <= t && p.rem > 0).sort(
            (a, b) => key(a) - key(b) || a.at - b.at,
          )[0] || null;
    }
    if (cur) {
      cur.rem--;
      qn++;
      tl.push(cur.id);
      if (!cur.rem) {
        cur.ct = t + 1;
        done++;
      }
    } else tl.push(null);
    t++;
  }
  Q.forEach((p) => {
    p.tat = p.ct - p.at;
    p.wt = p.tat - p.bt;
  }); // TAT = CT - AT ; WT = TAT - BT
  const av = (k) => Q.reduce((s, p) => s + p[k], 0) / Q.length,
    blocks = [];
  tl.forEach((x, i) => {
    const l = blocks[blocks.length - 1];
    if (l && l.p == x) l.e = i + 1;
    else blocks.push({ p: x, s: i, e: i + 1 });
  });
  return {
    tl,
    Q,
    blocks,
    wt: av("wt"),
    tat: av("tat"),
    util: (100 * tl.filter((x) => x).length) / tl.length,
    thr: Q.length / tl.length,
  };
}
const EXPL = {
  FCFS: [
    "FCFS (First Come First Serve)",
    "Processes run in order of arrival. Non-preemptive: once a process gets the CPU it runs until it completes.",
    "FCFS serves login requests, question deliveries, evaluations and result generation in the order they arrive at the server.",
  ],
  SJF: [
    "SJF (Shortest Job First)",
    "The ready process with the smallest burst time runs next. Non-preemptive; minimises average waiting time.",
    "Short tasks such as login checks are served before long answer evaluations.",
  ],
  SRTF: [
    "SRTF (Shortest Remaining Time First)",
    "Preemptive SJF: a newly arrived process with a shorter remaining time takes the CPU.",
    "Quick submissions interrupt long evaluations, keeping response time low.",
  ],
  PRI: [
    "Priority Scheduling",
    "The CPU goes to the highest-priority process (lower number = higher priority), optionally preemptive.",
    "Result generation can be given priority over background database updates.",
  ],
  RR: [
    "Round Robin",
    "Each process receives a fixed time quantum, then goes to the back of the ready queue.",
    "Gives every student request a fair share of the CPU during peak load.",
  ],
  MLQ: [
    "Multilevel Queue (Simple)",
    "Processes are split into queues by priority class (priority 1 = foreground, others = background). Foreground always runs first.",
    "Interactive exam traffic (login, delivery) outranks batch jobs like database updates.",
  ],
};
const cpuH = () =>
  hero(
    "🖥️",
    "#2f7bff",
    "CPU Scheduling",
    "Simulate process scheduling for examination tasks using multiple algorithms",
    `<div class="flow">${["👤 Student Login (P1)", "📄 Question Delivery (P2)", "⚙️ Answer Evaluation (P3)", "🛡️ Result Generation (P4)"].map((x) => `<span>${x}</span>`).join("<i>⟶</i>")}</div>`,
  ) +
  `<div class="g2"><div class="c bl"><h3>📋 Process Input (Examination Tasks)</h3><div class="row"><label>Process ID<input id="cid" disabled style="width:80px"></label><label>Arrival Time (ms)<input id="cat" type="number" min="0" value="0" style="width:90px"></label><label>Burst Time (ms)<input id="cbt" type="number" min="1" value="5" style="width:90px"></label><label>Priority<input id="cpr" type="number" min="1" value="1" style="width:80px"></label><button class="btn" id="cadd">＋ Add Process</button></div><table style="margin-top:10px"><thead><tr><th>Process ID<th>Process Name (Task)<th>Arrival<th>Burst<th>Priority<th>Action</tr></thead><tbody id="cpt"></tbody></table></div>
<div class="c bl"><h3>🛠 Select Scheduling Algorithm</h3><div class="row" style="align-items:stretch"><div style="flex:1;min-width:230px" id="calgs">${[
    ["FCFS", "FCFS (First Come First Serve)"],
    ["SJF", "SJF (Non-Preemptive)"],
    ["SRTF", "SRTF (Preemptive)"],
    [
      "PRI",
      'Priority Scheduling <select id="cpm"><option value="PRI">Non-Preemptive</option><option value="PRIP">Preemptive</option></select>',
    ],
    [
      "RR",
      'Round Robin <span class="m">Time Quantum: <input id="cq" type="number" min="1" value="2" style="width:56px"></span>',
    ],
    ["MLQ", "Multilevel Queue (Simple)"],
  ]
    .map(
      ([k, l], i) =>
        `<div class="rad ${i ? "" : "on"}" data-a="${k}">${l}</div>`,
    )
    .join(
      "",
    )}</div><div style="display:flex;flex-direction:column;gap:12px;min-width:150px"><button class="btn" id="crun">▶ Run Simulation</button><button class="btn ol" id="crst">↻ Reset</button></div></div></div></div>
<div class="g2" style="grid-template-columns:1.6fr 1fr"><div class="c bl"><h3>📊 Gantt Chart</h3><div class="gantt" id="gantt"></div><p style="text-align:center;color:#c3cff0;font-size:12px">Time (ms)</p><div class="row"><button class="btn ol" id="cprev">⏮ Prev Step</button><button class="btn" id="cnext">⏭ Next Step</button><button class="btn gr" id="cauto">▶ Auto-play</button>${spdCtl()}</div><div class="tip" id="cstep" style="border-color:#2352c8;background:#0a1a4a;color:#cfe0ff"></div></div><div class="c bl"><h3>📈 Scheduling Metrics</h3><div class="g2" style="grid-template-columns:1fr 1fr" id="cmet"></div></div></div>
<div class="g2" style="grid-template-columns:1.6fr 1fr"><div class="c bl"><h3>🧾 Process Table (Calculated Results)</h3><table><thead><tr><th>Process ID<th>Arrival Time<th>Burst Time<th>Completion Time<th>Waiting Time<th>Turnaround Time</tr></thead><tbody id="cres"></tbody></table></div><div class="c bl"><h3>ℹ️ Algorithm Explanation</h3><div id="cexp"></div></div></div>
<div class="c vi"><h3>📊 Comparison of Scheduling Algorithms</h3><div class="g2"><div class="c"><h3>Average Waiting Time (ms)</h3><div id="cbw"></div></div><div class="c"><h3>Average Turnaround Time (ms)</h3><div id="cbta"></div></div></div><div class="c"><h3>🗒 Algorithm Comparison Table</h3><table><thead><tr><th>Algorithm<th>Average Waiting Time (ms)<th>Average Turnaround Time (ms)<th>CPU Utilization (%)<th>Throughput (processes/ms)</tr></thead><tbody id="ccmp"></tbody></table></div></div>`;
function cpuI() {
  const drawT = () => {
    $("#cpt").innerHTML = CP.map(
      (p, i) =>
        `<tr><td>${pill(p.id)}<td class="ed" data-t="text" data-f="cp" data-a="${i}:name">${p.name}<td class="ed" data-f="cp" data-a="${i}:at">${p.at}<td class="ed" data-f="cp" data-a="${i}:bt">${p.bt}<td class="ed" data-f="cp" data-a="${i}:pr">${p.pr}<td><button onclick="CP.splice(${i},1);cpuT()">🗑</button></tr>`,
    ).join("");
    $("#cid").value = "P" + (Math.max(0, ...CP.map((p) => +p.id.slice(1))) + 1);
  };
  window.cpuT = () => {
    drawT();
    cpuClear();
  };
  const alg = () => (calg == "PRI" ? $("#cpm").value : calg);
  const expl = () => {
    const e = EXPL[calg];
    $("#cexp").innerHTML =
      `<div class="c" style="background:#0a1536;margin:0 0 8px"><b>${e[0]}</b><p style="margin-top:6px;font-size:12.5px;color:#c3cff0">${e[1]}</p></div><div class="tip"><b>💡 Connection to Examination System</b><br>${e[2]}</div>`;
  };
  $$("#calgs .rad").forEach(
    (r) =>
      (r.onclick = (e) => {
        if (e.target.tagName == "INPUT" || e.target.tagName == "SELECT") return;
        calg = r.dataset.a;
        $$("#calgs .rad").forEach((x) => x.classList.toggle("on", x == r));
        expl();
        cpuClear();
      }),
  );
  $("#cadd").onclick = () => {
    const at = +$("#cat").value,
      bt = +$("#cbt").value,
      pr = +$("#cpr").value;
    if (CP.length >= 10) return toast("⚠ Maximum 10 processes");
    if (!(bt >= 1) || at < 0 || !(pr >= 1))
      return toast("⚠ Burst ≥ 1, arrival ≥ 0, priority ≥ 1");
    const id = $("#cid").value;
    CP.push({ id, name: TN[CP.length % 8], at, bt, pr });
    ev(id + " added to CPU scheduler", "#2f7bff");
    cpuT();
    toast(id + " added");
  };
  let ck = 0,
    cauto = false;
  const cmet = (R) =>
    [
      [
        "⏱",
        "#2f7bff",
        "Average Waiting Time",
        R ? R.wt.toFixed(2) + " ms" : "—",
      ],
      [
        "🔄",
        "#8b5cf6",
        "Average Turnaround Time",
        R ? R.tat.toFixed(2) + " ms" : "—",
      ],
      ["🖥", "#22c55e", "CPU Utilization", R ? R.util.toFixed(0) + " %" : "—"],
      [
        "📶",
        "#f59e0b",
        "Throughput",
        R ? R.thr.toFixed(2) + " processes/ms" : "—",
      ],
    ]
      .map(
        ([i, c, l, v]) =>
          `<div class="mt" style="--c:${c}"><span style="font-size:26px">${i}</span><div><small>${l}</small><b>${v}</b></div></div>`,
      )
      .join("");
  function cmpR() {
    const q = +$("#cq").value || 2;
    if (!CP.length) {
      $("#cbw").innerHTML = $("#cbta").innerHTML = $("#ccmp").innerHTML = "";
      return;
    }
    const L = [
        ["FCFS", "FCFS", "#2f7bff"],
        ["SJF", "SJF (Non-Preemptive)", "#8b5cf6"],
        ["SRTF", "SRTF (Preemptive)", "#f59e0b"],
        ["PRI", "Priority (Non-Preemptive)", "#22c55e"],
        ["RR", `Round Robin (q = ${q})`, "#ec4899"],
      ],
      R = L.map((l) => ({ l, ...sched(l[0], CP, q) }));
    const bars = (k) => {
      const mx = Math.max(...R.map((r) => r[k]), 1);
      return (
        '<div class="vgrid">' +
        R.map(
          (r) =>
            `<div class="vc"><b>${r[k].toFixed(2)}</b><div class="vb2" data-h="${(r[k] / mx) * 130}" style="background:linear-gradient(180deg,${r.l[2]},${r.l[2]}88)"></div><small>${r.l[0] == "RR" ? "Round Robin<br>(q = " + q + ")" : r.l[0] == "PRI" ? "Priority" : r.l[0]}</small></div>`,
        ).join("") +
        "</div>"
      );
    };
    $("#cbw").innerHTML = bars("wt");
    $("#cbta").innerHTML = bars("tat");
    const best = Math.min(...R.map((r) => r.wt));
    $("#ccmp").innerHTML = R.map(
      (r) =>
        `<tr><td><i class="lamp" style="background:${r.l[2]}"></i>${r.l[1]}${r.wt == best ? " ⭐" : ""}<td>${r.wt.toFixed(2)}<td>${r.tat.toFixed(2)}<td>${r.util.toFixed(0)}<td>${r.thr.toFixed(2)}</tr>`,
    ).join("");
    raf(() => $$(".vb2").forEach((e) => (e.style.height = e.dataset.h + "px")));
  }
  const cpuClear = () => {
    ctok++;
    cauto = false;
    CR = null;
    ck = 0;
    $("#cauto").textContent = "▶ Auto-play";
    $("#gantt").innerHTML =
      '<p style="color:#8fa0c6;padding:20px">Press “Run Simulation” or “Next Step” to build the Gantt chart.</p>';
    $("#cstep").textContent =
      "Ready. Use Next Step to execute one millisecond at a time, or Auto-play (speed adjustable).";
    $("#cmet").innerHTML = cmet(null);
    $("#cres").innerHTML = "";
    cmpR();
  };
  function cpuEnsure() {
    if (CR) return true;
    if (!CP.length) {
      toast("Add at least one process");
      return false;
    }
    CR = sched(alg(), CP, +$("#cq").value || 2);
    ck = 0;
    const T = CR.tl.length;
    ev(`CPU scheduled ${CP[0].id} (${alg()})`, "#2f7bff");
    $("#gantt").innerHTML =
      CR.blocks
        .map(
          (b) =>
            `<div class="gb" id="gb${b.s}" style="left:${(b.s / T) * 100}%;width:0;background:${b.p ? col(b.p) : "#334"}">${b.p || "idle"}</div>`,
        )
        .join("") +
      [...new Set([0, ...CR.blocks.map((b) => b.e)])]
        .map(
          (t) => `<span class="gt" style="left:${(t / T) * 100}%">${t}</span>`,
        )
        .join("");
    return true;
  }
  function cpuDraw() {
    const T = CR.tl.length;
    CR.blocks.forEach((b) => {
      const e = $("#gb" + b.s);
      if (e)
        e.style.width = (Math.max(0, Math.min(ck, b.e) - b.s) / T) * 100 + "%";
    });
    let t = "Ready. Press Next Step to execute 1 ms.";
    if (ck > 0) {
      const r = CR.tl[ck - 1],
        q = CR.Q.filter(
          (p) => p.at <= ck - 1 && p.ct > ck - 1 && p.id != r,
        ).map((p) => p.id),
        dn = CR.Q.find((p) => p.ct == ck),
        rem = r
          ? CR.Q.find((p) => p.id == r).bt -
            CR.tl.slice(0, ck).filter((x) => x == r).length
          : 0;
      t = `Step ${ck}/${T} · t=${ck - 1}→${ck} ms: ${r ? r + " runs 1 ms (remaining " + rem + " ms)" : "CPU idle"}${dn ? " · " + dn.id + " COMPLETED (CT = " + dn.ct + ")" : ""} · Ready queue: ${q.join(", ") || "empty"}`;
    }
    $("#cstep").textContent = t;
    $("#cmet").innerHTML = cmet(ck >= T ? CR : null);
    $("#cres").innerHTML = CR.Q.filter((p) => p.ct <= ck)
      .map(
        (p) =>
          `<tr><td>${pill(p.id)}<td>${p.at}<td>${p.bt}<td>${p.ct}<td>${p.wt}<td>${p.tat}</tr>`,
      )
      .join("");
  }
  const lbl = () =>
    ($("#cauto").textContent = cauto ? "⏸ Pause" : "▶ Auto-play");
  $("#cpm").onchange = $("#cq").onchange = cpuClear;
  $("#crst").onclick = cpuClear;
  $("#cnext").onclick = () => {
    cauto = false;
    ctok++;
    lbl();
    if (!cpuEnsure()) return;
    if (ck < CR.tl.length) ck++;
    cpuDraw();
  };
  $("#cprev").onclick = () => {
    if (!CR) return toast("Nothing to step back");
    cauto = false;
    ctok++;
    lbl();
    ck = Math.max(0, ck - 1);
    cpuDraw();
  };
  $("#cauto").onclick = async () => {
    if (cauto) {
      cauto = false;
      ctok++;
      lbl();
      return;
    }
    if (!cpuEnsure()) return;
    if (ck >= CR.tl.length) ck = 0;
    cauto = true;
    lbl();
    const tok = ++ctok;
    cpuDraw();
    while (cauto && tok == ctok && ck < CR.tl.length) {
      await sleep(380);
      if (!cauto || tok != ctok) return;
      ck++;
      cpuDraw();
    }
    if (tok == ctok) {
      cauto = false;
      lbl();
      toast("Simulation complete");
    }
  };
  $("#crun").onclick = () => {
    cpuClear();
    $("#cauto").click();
  };
  drawT();
  cpuClear();
  expl();
}

/* ================= PRODUCER - CONSUMER ================= */
const PC = {
  N: 5,
  np: 2,
  nc: 2,
  pms: 1000,
  cms: 1500,
  run: false,
  g: 0,
  n: 24,
  buf: [],
  prod: 0,
  cons: 0,
  P: [],
  C: [],
  lock: false,
  log: [],
  hist: [],
  si: 0,
  last: "Press Start for auto-run, or Next Step to execute one operation at a time.",
};
function pcReset() {
  PC.g++;
  PC.run = false;
  PC.P = Array.from({ length: PC.np }, (_, i) => ({
    id: "P" + (i + 1),
    gen: 0,
    st: "Idle",
  }));
  PC.C = Array.from({ length: PC.nc }, (_, i) => ({
    id: "C" + (i + 1),
    done: 0,
    st: "Idle",
  }));
  PC.buf = [];
  PC.prod = PC.cons = 0;
  PC.log = [];
  PC.hist = [];
  PC.si = 0;
  PC.last = "Reset. Press Start or Next Step.";
}
function pcStart() {
  if (PC.run) return;
  PC.run = true;
  const g = ++PC.g;
  PC.P.forEach((_, i) => pcLoop(g, i, 1));
  PC.C.forEach((_, i) => pcLoop(g, i, 0));
}
async function pcLoop(g, i, isP) {
  await sleep(300 + i * 400);
  while (PC.run && g == PC.g) {
    isP ? produce(i) : consume(i);
    await sleep(isP ? PC.pms : PC.cms);
  }
}
const plog = (p, a, it) => {
  PC.log.unshift([now(), p, a, it, PC.buf.length]);
  PC.log = PC.log.slice(0, 12);
};
function lockIt() {
  PC.lock = true;
  setTimeout(() => {
    PC.lock = false;
    pcR();
  }, 350);
}
const snap = () => {
  PC.hist.push(
    JSON.stringify({
      buf: PC.buf,
      prod: PC.prod,
      cons: PC.cons,
      P: PC.P,
      C: PC.C,
      log: PC.log,
      n: PC.n,
      si: PC.si,
    }),
  );
  if (PC.hist.length > 60) PC.hist.shift();
};
function produce(i) {
  const p = PC.P[i];
  snap();
  if (PC.buf.length >= PC.N) {
    p.st = "Blocked";
    PC.last = `${p.id}: wait(empty) → queue full (${PC.N}/${PC.N}) → BLOCKED until a consumer frees a slot`;
    pcR();
    return;
  } // wait(empty)
  const it = { id: "Ans-" + ++PC.n, from: i, ready: 0 };
  PC.buf.push(it);
  PC.prod++;
  p.gen++;
  p.st = "Producing";
  lockIt();
  plog(p.id, "Produced", it.id);
  ev(`Student S${PC.n} submitted answer (Job added to queue)`, "#22c55e");
  PC.last = `${p.id}: wait(empty) ✔ → wait(mutex) ✔ → insert_item(${it.id}) → signal(mutex) → signal(full) · queue ${PC.buf.length}/${PC.N}`;
  pcR();
  fly("#pe" + i, "#sl" + (PC.buf.length - 1), () => {
    it.ready = 1;
    pcR();
  });
}
function consume(j) {
  const c = PC.C[j],
    it = PC.buf[0];
  snap();
  if (!it || !it.ready) {
    c.st = "Waiting";
    PC.last = `${c.id}: wait(full) → queue empty → WAITING for a submission`;
    pcR();
    return;
  } // wait(full)
  PC.buf.shift();
  PC.cons++;
  c.done++;
  c.st = "Consuming";
  lockIt();
  plog(c.id, "Consumed", it.id);
  ev(`Worker W${j + 1} started processing (${it.id})`, "#f59e0b");
  PC.last = `${c.id}: wait(full) ✔ → wait(mutex) ✔ → remove_item(${it.id}) → signal(mutex) → signal(empty) · evaluating ${it.id}`;
  pcR();
  fly("#sl0", "#ce" + j, () => {
    const e = $("#ce" + j);
    if (e) {
      e.classList.add("pop");
      setTimeout(() => e.classList.remove("pop"), 500);
    }
  });
}
function fly(a, b, done) {
  const A = $(a),
    B = $(b),
    V = $("#pcv");
  if (!A || !B || !V) return done && done();
  const v = V.getBoundingClientRect(),
    r = A.getBoundingClientRect(),
    p = document.createElement("div");
  p.className = "paper";
  p.textContent = "📄";
  p.style.transitionDuration = 0.7 / SPD + "s";
  p.style.left = r.left - v.left + r.width / 2 - 12 + "px";
  p.style.top = r.top - v.top + r.height / 2 - 14 + "px";
  V.append(p);
  p.offsetWidth;
  const s = B.getBoundingClientRect();
  p.style.left = s.left - v.left + s.width / 2 - 12 + "px";
  p.style.top = s.top - v.top + s.height / 2 - 14 + "px";
  setTimeout(() => {
    p.remove();
    done && done();
  }, 720 / SPD);
}
const pcEx = {
  Concept:
    "In the online examination system, students submit answers (producers) and processing workers evaluate them (consumers). Submissions are stored in a bounded buffer (queue). Synchronization ensures that:<ul><li>Producers wait when the queue is full.</li><li>Consumers wait when the queue is empty.</li><li>Only one process accesses the queue at a time (mutex).</li><li>Semaphores (empty and full) maintain correct synchronization.</li></ul>",
  Synchronization:
    "<b>Producer:</b> wait(empty); wait(mutex); insert_item(); signal(mutex); signal(full);<br><b>Consumer:</b> wait(full); wait(mutex); remove_item(); signal(mutex); signal(empty);<br>empty starts at N, full at 0, mutex at 1.",
  Example:
    "Buffer size 5, 2 producers, 2 consumers. When 5 answers are queued, producers show <b>Blocked</b>. When the queue is empty, consumers show <b>Waiting</b>. Raise the consumer speed and watch the queue drain.",
  "Real-world Mapping":
    "Producers = student submission handlers · Consumers = evaluator workers · Buffer = answer submission queue · Mutex = lock on the queue data structure.",
};
const pcH = () =>
  hero(
    "🗄️",
    "#f59e0b",
    "Producer – Consumer",
    "Simulate student answer submissions and processing using a bounded queue with synchronization",
  ) +
  `<div class="g5">${kpi("📄", "#2f5bd8", "Total Submissions", "pk0", 0, "Produced")}${kpi("✅", "#15803d", "Total Processed", "pk1", 0, "Consumed")}${kpi("📚", "#a8690a", "In Queue", "pk2", null, "Current / Capacity")}${kpi("🙍", "#a32a2a", "Waiting Producers", "pk3", 0, "")}${kpi("🙍", "#a32a2a", "Waiting Consumers", "pk4", 0, "")}</div>
<div class="c or"><h3>⚙️ Simulation Controls</h3><div class="row"><label>Buffer Size (Queue Capacity)<select id="pn">${[3, 4, 5, 6, 8, 10].map((n) => `<option ${n == PC.N ? "selected" : ""}>${n}</option>`).join("")}</select></label><label>Number of Producers<input id="pnp" type="number" min="1" max="6" value="${PC.np}"></label><label>Number of Consumers<input id="pnc" type="number" min="1" max="6" value="${PC.nc}"></label><label>Producer Speed (ms)<input id="ppm" type="number" min="200" step="100" value="${PC.pms}"></label><label>Consumer Speed (ms)<input id="pcm" type="number" min="200" step="100" value="${PC.cms}"></label><span style="flex:1"></span><button class="btn gr" id="pgo">▶ Start Simulation</button><button class="btn or" id="ppz">⏸ Pause</button><button class="btn rd" id="prs">↻ Reset</button></div><div class="row" style="margin:12px 0 0"><button class="btn ol" id="pprev">⏮ Prev Step</button><button class="btn" id="pnext">⏭ Next Step</button>${spdCtl()}<span id="pstep" style="flex:1;color:#cfe0ff;font-size:13px;min-width:260px"></span></div></div>
<div class="g2" style="grid-template-columns:1.8fr 1fr"><div class="c or"><h3>🗄️ Producer – Consumer Visualization</h3><div id="pcv"><div id="pcp"><p style="text-align:center;margin-bottom:8px"><b>Producers</b><br><small class="m">(Student Submissions)</small></p><div id="pprod"></div></div><div class="buf"><b>Bounded Queue</b><br><small class="m">(Answer Submission Queue)</small><div class="arrow"></div><b id="psz"></b><div class="slots" id="pslots"></div><small style="color:var(--bl)">Queue (Shared Buffer)</small><div class="arrow"></div></div><div><p style="text-align:center;margin-bottom:8px"><b>Consumers</b><br><small class="m">(Processing Workers)</small></p><div id="pcons"></div></div></div></div>
<div><div class="c bl"><h3>🔵 System Status</h3><div class="g2" style="grid-template-columns:1fr 1fr" id="pst"></div></div><div class="c bl"><h3>🔒 Synchronization Status</h3><div id="psy" style="line-height:2.2"></div></div></div></div>
<div class="g2" style="grid-template-columns:1.2fr 1fr"><div class="c bl"><h3>📝 Queue Activity Log</h3><table><thead><tr><th>Time<th>Process<th>Action<th>Item<th>Queue Size</tr></thead><tbody id="plog"></tbody></table></div><div class="c bl"><h3>ℹ️ Algorithm Explanation</h3>${tabs("ptabs", pcEx)}</div></div>`;
function pcR() {
  if (!$("#pcv")) return;
  $("#pstep").innerHTML =
    '<b style="color:#38bdf8">Current step:</b> ' + PC.last;
  const set = (id, v) => cu($(id), v);
  set("#pk0", PC.prod);
  set("#pk1", PC.cons);
  $("#pk2").textContent = `${PC.buf.length} / ${PC.N}`;
  set("#pk3", PC.P.filter((p) => p.st == "Blocked").length);
  set("#pk4", PC.C.filter((c) => c.st == "Waiting").length);
  const E = (o, k, i, em, lines) =>
    `<div class="ent ${o.st}" id="${k}e${i}" style="--col:${k == "p" ? PC_[i % 2 ? 1 : 0] : PC_[i % 2 ? 2 : 3]}"><span class="e">${em}</span><div><b>${o.id}</b> <small class="m">${o.st == "Blocked" || o.st == "Waiting" ? o.st : o.st == "Idle" ? "Idle" : "Active"}</small><br>${lines}</div><i class="dot"></i></div>`;
  $("#pprod").innerHTML = PC.P.map((p, i) =>
    E(p, "p", i, "🧑‍🎓", `Generated: ${p.gen}<br>State: ${p.st}`),
  ).join("");
  $("#pcons").innerHTML = PC.C.map((c, i) =>
    E(
      c,
      "c",
      i,
      '<span class="gear">⚙️</span>',
      `Processed: ${c.done}<br>State: ${c.st}`,
    ),
  ).join("");
  $("#psz").textContent = `Size: ${PC.buf.length} / ${PC.N}`;
  $("#pslots").innerHTML = Array.from(
    { length: PC.N },
    (_, i) =>
      `<div class="sl2 ${PC.buf[i] && PC.buf[i].ready ? "f" : ""}" id="sl${i}" style="${PC.buf[i] ? `border-color:${PC_[PC.buf[i].from % 8]}` : ""}">${PC.buf[i] && PC.buf[i].ready ? "📄" : ""}</div>`,
  ).join("");
  $("#pst").innerHTML = [
    ["Produced", PC.prod, "#2f5bd8"],
    ["Consumed", PC.cons, "#15803d"],
    ["In Queue", `${PC.buf.length} / ${PC.N}`, "#a8690a"],
    ["Buffer Capacity", PC.N, "#2f5bd8"],
  ]
    .map(
      ([l, v, c]) =>
        `<div class="mt" style="--c:${c}"><div><small>${l}</small><b>${v}</b></div></div>`,
    )
    .join("");
  $("#psy").innerHTML = [
    [
      "Mutex (Queue Access)",
      PC.lock ? "Locked 🔒" : "Available",
      PC.lock ? "#f59e0b" : "#22c55e",
    ],
    [
      "Empty Semaphore (Free slots)",
      "Count: " + (PC.N - PC.buf.length),
      PC.buf.length == PC.N ? "#ef4444" : "#22c55e",
    ],
    [
      "Full Semaphore (Items available)",
      "Count: " + PC.buf.length,
      PC.buf.length ? "#22c55e" : "#ef4444",
    ],
  ]
    .map(
      ([l, v, c]) =>
        `<div style="display:flex;justify-content:space-between"><span>${l}</span><span><i class="lamp" style="background:${c};box-shadow:0 0 8px ${c}"></i>${v}</span></div>`,
    )
    .join("");
  $("#plog").innerHTML = PC.log
    .map(
      (r) =>
        `<tr><td>${r[0]}<td>${pill(r[1])}<td style="color:${r[2] == "Produced" ? "#22c55e" : "#f59e0b"}">${r[2]}<td>${r[3]}<td>${r[4]}</tr>`,
    )
    .join("");
}
function pcI() {
  tabInit("ptabs", pcEx);
  const rd = () => {
    PC.N = +$("#pn").value;
    PC.np = Math.min(6, Math.max(1, +$("#pnp").value || 1));
    PC.nc = Math.min(6, Math.max(1, +$("#pnc").value || 1));
    PC.pms = Math.max(200, +$("#ppm").value || 1000);
    PC.cms = Math.max(200, +$("#pcm").value || 1500);
  };
  $("#pgo").onclick = () => {
    rd();
    if (!PC.P.length || PC.P.length != PC.np || PC.C.length != PC.nc) {
      const was = PC.run;
      pcReset();
    }
    PC.run = false;
    pcStart();
    toast("Simulation started");
  };
  $("#ppz").onclick = () => {
    PC.run = false;
    PC.g++;
    toast("Paused");
  };
  $("#prs").onclick = () => {
    rd();
    pcReset();
    pcR();
    toast("Reset");
  };
  $("#pnext").onclick = () => {
    PC.run = false;
    PC.g++;
    const k = PC.si % (PC.P.length + PC.C.length);
    if (k < PC.P.length) produce(k);
    else consume(k - PC.P.length);
    PC.si++;
  };
  $("#pprev").onclick = () => {
    PC.run = false;
    PC.g++;
    if (!PC.hist.length) return toast("Nothing to undo");
    Object.assign(PC, JSON.parse(PC.hist.pop()));
    PC.buf.forEach((b) => (b.ready = 1));
    PC.last = "⏮ Reverted to the previous state";
    pcR();
  };
  ["pn", "pnp", "pnc"].forEach(
    (i) =>
      ($("#" + i).onchange = () => {
        rd();
        const r = PC.run;
        pcReset();
        pcR();
        if (r) pcStart();
      }),
  );
  ["ppm", "pcm"].forEach((i) => ($("#" + i).onchange = rd));
  pcR();
}

/* ================= BANKER'S ALGORITHM ================= */
const B = {
  n: 5,
  m: 3,
  names: ["R0", "R1", "R2"],
  A: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  X: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
  V: [3, 3, 2],
  log: [],
  res: null,
  tk: 0,
  auto: false,
  si: 0,
  steps: [],
  safeRes: null,
};
function safe(al, mx, av) {
  const n = al.length,
    need = al.map((r, i) => r.map((x, j) => mx[i][j] - x));
  let w = [...av],
    f = [],
    seq = [];
  for (let c = 0; c < n; c++) {
    const k = al.findIndex(
      (_, i) => !f[i] && need[i].every((x, j) => x <= w[j]),
    );
    if (k < 0) break;
    w = w.map((x, j) => x + al[k][j]);
    f[k] = 1;
    seq.push(k);
  } // Need<=Work ; Work+=Alloc
  return { ok: seq.length == n, seq };
}
function safeSteps(al, mx, av) {
  const n = al.length,
    need = al.map((r, i) => r.map((x, j) => mx[i][j] - x));
  let w = [...av],
    f = [],
    st = [];
  for (let c = 0; c < n; c++) {
    const tried = [];
    let k = -1;
    for (let i = 0; i < n; i++) {
      if (f[i]) continue;
      const ok = need[i].every((x, j) => x <= w[j]);
      tried.push([i, ok]);
      if (ok) {
        k = i;
        break;
      }
    }
    if (k < 0) {
      st.push({
        fail: 1,
        w: [...w],
        left: al.map((_, i) => i).filter((i) => !f[i]),
      });
      break;
    }
    st.push({
      k,
      tried,
      from: [...w],
      need: need[k],
      to: w.map((x, j) => x + al[k][j]),
    });
    w = st[st.length - 1].to;
    f[k] = 1;
  }
  return st;
}
function bView() {
  const st = B.steps,
    n = st.length,
    s = B.safeRes,
    i = B.si,
    fin = i >= n,
    shown = st.slice(0, i).filter((x) => !x.fail),
    x = st[i - 1];
  $("#bsafe").innerHTML =
    `<div class="state ${fin && !s.ok ? "shake" : ""}" style="background:${!fin ? "#2a230b" : s.ok ? "#0b2a1a" : "#2a0d0d"}"><b style="color:${!fin ? "#f59e0b" : s.ok ? "#22c55e" : "#ef4444"}">${!fin ? "⏳ Checking… (step " + i + " / " + n + ")" : s.ok ? "✔ System is in a SAFE state." : "✖ System is in an UNSAFE state."}</b><p style="font-size:12px;color:#c3cff0;margin-top:6px">${!fin ? "Safety algorithm in progress." : s.ok ? "A safe sequence exists and all processes can complete." : "No safe sequence: a deadlock may occur if requests are granted."}</p></div>`;
  $("#bseq").innerHTML =
    shown
      .map(
        (q, j) =>
          `${j ? "<i>→</i>" : ""}<span class="chip" style="background:${col("P" + (q.k + 1))}">P${q.k}</span>`,
      )
      .join("") ||
    `<span class="m" style="color:#8fa0c6">${fin ? "No safe sequence" : "Sequence builds as steps run…"}</span>`;
  $("#bstep").innerHTML =
    i == 0
      ? `<b>Initial:</b> Work = Available = [${B.V}], Finish[] = all false. Press Next Step to test each process: <i>Need ≤ Work?</i>`
      : x.fail
        ? `<b>Step ${i}:</b> Work = [${x.w}]. No unfinished process (${x.left.map((p) => "P" + p).join(", ")}) has Need ≤ Work → <b style="color:#ef4444">UNSAFE</b> (possible deadlock).`
        : `<b>Step ${i}:</b> Work = [${x.from}]. Test: ${x.tried.map(([p, ok]) => "P" + p + (ok ? " ✔" : " ✖")).join(", ")} → P${x.k}: Need [${x.need}] ≤ Work ✔. P${x.k} finishes and releases its allocation: Work = [${x.to}], Finish[P${x.k}] = true.`;
  $$("#bmats tr[id^=nr]").forEach((r) => r.classList.remove("pick"));
  if (i > 0 && x && !x.fail) {
    const r = $("#nr" + x.k);
    if (r) r.classList.add("pick");
  }
  $("#bauto").textContent = B.auto ? "⏸ Pause" : "▶ Auto-play";
}
const bEx = {
  Concept:
    "Banker's Algorithm is a deadlock avoidance algorithm that checks whether granting a resource request keeps the system in a safe state. It ensures that all processes can complete their execution without causing a deadlock.<br><b>Key Points:</b><ul><li>Each process declares its maximum resource demand.</li><li>The system checks for a safe state before granting a request.</li><li>A safe sequence ensures all processes can finish.</li><li>If the request leads to an unsafe state, it is denied.</li></ul>",
  Steps:
    "1. Need = Max − Allocation.<br>2. Work = Available, Finish[i] = false.<br>3. Find i with Need[i] ≤ Work; then Work += Allocation[i], Finish[i] = true.<br>4. Repeat. If all finish, the state is safe.",
  "Safe State":
    "A state is safe if there exists an ordering of the processes (a safe sequence) so each can obtain its remaining need from Available plus what earlier processes release.",
  "Real-world Mapping":
    "Processes = exam services (login, delivery, evaluation…); Resources = DB connections, evaluator threads, file locks.",
};
const bH = () =>
  hero(
    "🛡️",
    "#22c55e",
    "Banker's Algorithm",
    "Simulate resource allocation and check for safe/unsafe states",
  ) +
  `<div class="g4" id="bk"></div><div class="g2"><div class="c bl"><h3>⚙️ System Configuration</h3><div class="row"><label>Number of Processes<select id="bn">${[3, 4, 5, 6, 7, 8].map((n) => `<option ${n == B.n ? "selected" : ""}>${n}</option>`).join("")}</select></label><label>Number of Resource Types<select id="bm">${[2, 3, 4, 5].map((n) => `<option ${n == B.m ? "selected" : ""}>${n}</option>`).join("")}</select></label><label>Resource Names<span id="bnames"></span></label><button class="btn" id="bap">Apply</button></div></div>
<div class="c bl"><h3>➕ Process Resource Request</h3><div class="row"><label>Select Process<select id="brp"></select></label><label>Request<span id="breq"></span></label><button class="btn" id="bchk">Check Request</button></div></div></div>
<div class="g3" id="bmats"></div>
<div class="c gr"><h3>🪜 Safety Algorithm — Step-by-Step</h3><div class="row"><button class="btn ol" id="bprev">⏮ Prev Step</button><button class="btn" id="bnext">⏭ Next Step</button><button class="btn gr" id="bauto">▶ Auto-play</button><button class="btn ol" id="brst">↺ Restart</button>${spdCtl()}</div><p id="bstep" style="margin-top:10px;font-size:13px;color:#cfe0ff;line-height:1.6"></p></div><div class="g3" style="grid-template-columns:1fr 1fr 1.4fr"><div class="c bl"><h3>📦 Available Resources</h3><div id="bav"></div></div><div class="c gr"><h3>🛡 System Safety Check</h3><div id="bsafe"></div></div><div class="c vi"><h3>🧭 Safe Sequence</h3><div class="chain" id="bseq"></div></div></div>
<div class="g2" style="grid-template-columns:1.5fr 1fr"><div class="c bl"><h3>🔗 Resource Allocation State (Visualization)</h3><div id="brag"></div></div><div class="c gr"><h3>📋 Request Result</h3><div id="bres"><p class="m" style="color:#8fa0c6">Submit a request to see the result.</p></div></div></div>
<div class="g2" style="grid-template-columns:1.2fr 1fr"><div class="c bl"><h3>📝 Execution Log</h3><table><thead><tr><th>Time<th>Process<th>Action<th>Details<th>Result</tr></thead><tbody id="blog"></tbody></table></div><div class="c bl"><h3>ℹ️ Algorithm Explanation</h3>${tabs("btabs", bEx)}</div></div>`;
function bBuild() {
  const H = (l) =>
      `<tr><th>Process${B.names.map((n) => `<th>${n}`).join("")}</tr>`,
    mat = (k, M) =>
      `<table class="mat">${H()}${M.map((r, i) => `<tr><td>${pill("P" + i)}${r.map((x, j) => `<td><input type="number" min="0" value="${x}" data-k="${k}" data-i="${i}" data-j="${j}">`).join("")}</tr>`).join("")}</table>`;
  $("#bmats").innerHTML =
    `<div class="c bl"><h3>🗂 Allocation Matrix <small class="m">(Current Allocation)</small></h3>${mat("A", B.A)}</div><div class="c vi"><h3>📄 Maximum Matrix <small class="m">(Maximum Demand)</small></h3>${mat("X", B.X)}</div><div class="c gr"><h3>📊 Need Matrix <small class="m">(Remaining Need)</small></h3><table class="mat">${H()}${B.A.map((r, i) => `<tr id="nr${i}"><td>${pill("P" + i)}${r.map((_, j) => `<td id="bn${i}_${j}">`).join("")}</tr>`).join("")}</table></div>`;
  $("#bav").innerHTML =
    `<table class="mat"><tr>${B.names.map((n) => `<th>${n}`).join("")}</tr><tr>${B.V.map((x, j) => `<td><input type="number" min="0" value="${x}" data-k="V" data-j="${j}">`).join("")}</tr></table>`;
  $("#bnames").innerHTML = B.names
    .map(
      (n, j) =>
        `<input class="bnm" value="${n}" style="width:56px;margin-right:4px">`,
    )
    .join("");
  $("#brp").innerHTML = B.A.map(
    (_, i) => `<option value="${i}">P${i}</option>`,
  ).join("");
  $("#breq").innerHTML = B.names
    .map(
      (n, j) =>
        `<input class="brq" type="number" min="0" value="${[1, 0, 2, 0, 0][j]}" style="width:56px;margin-right:4px" title="${n}">`,
    )
    .join("");
  $$("#bmats input,#bav input").forEach(
    (e) =>
      (e.oninput = () => {
        const v = Math.max(0, +e.value || 0);
        if (e.dataset.k == "V") B.V[e.dataset.j] = v;
        else B[e.dataset.k][e.dataset.i][e.dataset.j] = v;
        bCalc();
      }),
  );
  bCalc(true);
  $("#blog").innerHTML = B.log
    .map(
      (r) =>
        `<tr><td>${r[0]}<td>${pill(r[1])}<td>Request<td>[${r[2]}]<td style="color:${r[3] ? "#22c55e" : "#ef4444"}">${r[3] ? "Granted (Safe)" : "Denied"}</tr>`,
    )
    .join("");
}
function bCalc(first) {
  B.A.forEach((r, i) =>
    r.forEach((x, j) => {
      const c = $(`#bn${i}_${j}`),
        v = B.X[i][j] - x;
      if (c.textContent != v) {
        c.textContent = v;
        if (!first) {
          c.classList.remove("chg");
          c.offsetWidth;
          c.classList.add("chg");
        }
      }
      c.classList.toggle("neg", v < 0);
    }),
  );
  const s = safe(B.A, B.X, B.V),
    tot = B.V.map((v, j) => v + B.A.reduce((a, r) => a + r[j], 0));
  $("#bk").innerHTML =
    kpi("👥", "#2352c8", "Total Processes", "", B.n, `P0 – P${B.n - 1}`) +
    kpi("⚙️", "#6d3fd1", "Resource Types", "", B.m, B.names.join(", ")) +
    `<div class="c k" style="border-color:${s.ok ? "#15803d" : "#a32a2a"}"><span class="ic" style="--c:${s.ok ? "#22c55e" : "#ef4444"}">${s.ok ? "🛡️" : "⚠️"}</span><div><small>System State</small><b style="color:${s.ok ? "#22c55e" : "#ef4444"};font-family:Inter">${s.ok ? "SAFE" : "UNSAFE"}</b><em>${s.ok ? "Safe Sequence Exists" : "No Safe Sequence"}</em></div></div>` +
    kpi("📦", "#a8690a", "Available Resources", "", `[${B.V.join(", ")}]`, "");
  B.auto = false;
  B.tk++;
  B.steps = safeSteps(B.A, B.X, B.V);
  B.safeRes = s;
  B.si = B.steps.length;
  bView();
  const W = 520,
    H = Math.max(B.n, B.m) * 54 + 20,
    py = (i) => 20 + i * ((H - 40) / Math.max(1, B.n - 1)),
    ry = (j) => 40 + j * ((H - 80) / Math.max(1, B.m - 1));
  let e = "";
  B.A.forEach((r, i) =>
    r.forEach((a, j) => {
      const nd = B.X[i][j] - a;
      if (a > 0 || nd > 0)
        e += `<path d="M90 ${py(i) + 14} C170 ${py(i) + 14},170 ${ry(j)},230 ${ry(j)}" fill="none" stroke="${col("P" + (i + 1))}" stroke-width="${a > 0 ? 2.5 : 1.5}" ${a > 0 ? "" : 'stroke-dasharray="5 4"'} opacity=".8"><animate attributeName="stroke-dashoffset" from="18" to="0" dur="1.5s" repeatCount="indefinite"/></path>`;
    }),
  );
  B.V.forEach(
    (_, j) =>
      (e += `<path d="M330 ${ry(j)} C370 ${ry(j)},380 ${H / 2},420 ${H / 2}" fill="none" stroke="${PC_[j % 8]}" stroke-width="2" opacity=".8"/>`),
  );
  $("#brag").innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" style="width:100%">${e}${B.A.map((_, i) => `<rect x="20" y="${py(i)}" width="70" height="28" rx="6" fill="${col("P" + (i + 1))}"/><text x="55" y="${py(i) + 19}" fill="#fff" text-anchor="middle" font-weight="700">P${i}</text>`).join("")}${B.V.map((_, j) => `<rect x="230" y="${ry(j) - 22}" width="100" height="44" rx="8" fill="#0a1a4a" stroke="${PC_[j % 8]}" stroke-width="2"/><text x="280" y="${ry(j) - 3}" fill="#fff" text-anchor="middle" font-weight="700">${B.names[j]}</text><text x="280" y="${ry(j) + 13}" fill="#8fa0c6" text-anchor="middle" font-size="11">(${tot[j]} total)</text>`).join("")}<rect x="420" y="${H / 2 - 30}" width="90" height="60" rx="10" fill="#0b2a1a" stroke="#22c55e" stroke-width="2"/><text x="465" y="${H / 2 - 6}" fill="#fff" text-anchor="middle" font-weight="700">Available</text><text x="465" y="${H / 2 + 14}" fill="#fff" text-anchor="middle" font-size="12">[${B.V.join(", ")}]</text></svg>`;
}
function bI() {
  tabInit("btabs", bEx);
  bBuild();
  $("#bnext").onclick = () => {
    B.auto = false;
    B.tk++;
    B.si = B.si >= B.steps.length ? 1 : B.si + 1;
    bView();
  };
  $("#bprev").onclick = () => {
    B.auto = false;
    B.tk++;
    B.si = Math.max(0, B.si - 1);
    bView();
  };
  $("#brst").onclick = () => {
    B.auto = false;
    B.tk++;
    B.si = 0;
    bView();
  };
  $("#bauto").onclick = async () => {
    if (B.auto) {
      B.auto = false;
      B.tk++;
      bView();
      return;
    }
    B.auto = true;
    if (B.si >= B.steps.length) B.si = 0;
    bView();
    const tk = ++B.tk;
    while (B.auto && tk == B.tk && B.si < B.steps.length) {
      await sleep(1100);
      if (!B.auto || tk != B.tk) return;
      B.si++;
      bView();
    }
    if (tk == B.tk) {
      B.auto = false;
      bView();
    }
  };
  $("#bap").onclick = () => {
    const n = +$("#bn").value,
      m = +$("#bm").value,
      nm = $$(".bnm").map((x) => x.value || "R");
    const r = () => Math.floor(Math.random() * 4);
    while (B.A.length < n) {
      B.A.push(Array(B.m).fill(0));
      B.X.push(Array.from({ length: B.m }, () => 1 + r()));
    }
    B.A.length = B.X.length = n;
    B.A = B.A.map((r) => {
      while (r.length < m) r.push(0);
      return r.slice(0, m);
    });
    B.X = B.X.map((q) => {
      while (q.length < m) q.push(1 + r());
      return q.slice(0, m);
    });
    while (B.V.length < m) B.V.push(3);
    B.V.length = m;
    B.n = n;
    B.m = m;
    B.names = Array.from({ length: m }, (_, j) => nm[j] || "R" + j);
    bBuild();
    toast("Configuration applied");
  };
  $("#bchk").onclick = () => {
    const i = +$("#brp").value,
      rq = $$(".brq").map((x) => Math.max(0, +x.value || 0)),
      need = B.X[i].map((x, j) => x - B.A[i][j]);
    let why = null;
    if (rq.some((x, j) => x > need[j]))
      why = "Request exceeds the maximum claim (Request > Need).";
    else if (rq.some((x, j) => x > B.V[j]))
      why =
        "Not enough available resources (Request > Available): process must wait.";
    let s = null,
      nv = null;
    if (!why) {
      const a2 = B.A.map((r) => [...r]);
      a2[i] = a2[i].map((x, j) => x + rq[j]);
      nv = B.V.map((x, j) => x - rq[j]);
      s = safe(a2, B.X, nv);
      if (!s.ok)
        why =
          "Granting leads to an UNSAFE state — request denied (rolled back).";
    } // pretend allocation + safety check
    const ok = !why;
    B.log.unshift([now(), "P" + i, rq, ok]);
    B.log = B.log.slice(0, 8);
    $("#bres").innerHTML =
      `<div class="state" style="background:${ok ? "#0b2a1a" : "#2a0d0d"};border:1px solid ${ok ? "#15803d" : "#a32a2a"}"><b style="color:${ok ? "#22c55e" : "#ef4444"}">${ok ? "✔ Request can be granted." : "✖ Request denied."}</b><br><small>${ok ? "The resulting state is SAFE." : why}</small></div><p style="margin:10px 0;line-height:1.8">Request by: P${i}<br>Request: [${rq}]${ok ? `<br>New Available: [${nv}]<br>New Safe Sequence:` : ""}</p>${ok ? `<div class="chain">${s.seq.map((k, x) => `${x ? "<i>→</i>" : ""}<span class="chip" style="background:${col("P" + (k + 1))};animation-delay:${x * 0.2}s">P${k}</span>`).join("")}</div><button class="btn gr" id="bapp" style="margin-top:10px">Apply Allocation</button>` : ""}`;
    ev(
      `Resource request ${ok ? "granted" : "denied"} for P${i} (${ok ? "Safe state" : "Unsafe"})`,
      ok ? "#22c55e" : "#ef4444",
    );
    if (ok)
      $("#bapp").onclick = () => {
        rq.forEach((x, j) => {
          B.A[i][j] += x;
          B.V[j] -= x;
        });
        bBuild();
        toast("Allocation applied");
        $("#bapp").remove();
      };
    bBuild2();
  };
  const bBuild2 = () => {
    $("#blog").innerHTML = B.log
      .map(
        (r) =>
          `<tr><td>${r[0]}<td>${pill(r[1])}<td>Request<td>[${r[2]}]<td style="color:${r[3] ? "#22c55e" : "#ef4444"}">${r[3] ? "Granted (Safe)" : "Denied"}</tr>`,
      )
      .join("");
  };
}

/* ================= MEMORY MANAGEMENT ================= */
const MN = [
  "Student Login",
  "Question Paper",
  "Answer Submission",
  "Evaluation",
  "Result Generation",
  "Database Update",
];
const MEM = {
  tot: 1024,
  os: 128,
  pol: "var",
  alg: "first",
  fp: [128, 128, 256, 384],
  procs: [],
  ch: [],
  log: [],
  nf: 128,
  sel: null,
  hist: [],
  skip: new Set(),
  auto: false,
  busy: false,
  scan: -1,
  fresh: null,
  ni: 0,
  pidc: 1,
  step: "Add a process with “Add to Queue”, then press Next Step to watch the algorithm scan memory.",
};
const AINFO = {
  first: [
    "First Fit",
    "Allocate the first free block that is large enough to hold the process.",
  ],
  best: [
    "Best Fit",
    "Allocate the smallest free block that is large enough, leaving the least wasted space.",
  ],
  worst: [
    "Worst Fit",
    "Allocate the largest free block, leaving the biggest possible remainder.",
  ],
  next: [
    "Next Fit",
    "Like First Fit, but the search resumes from the last allocation point.",
  ],
};
const mlog = (m) => {
    MEM.log.push([now(), m]);
    if (MEM.log.length > 80) MEM.log = MEM.log.slice(-80);
  },
  mEnd = (c) => c.st + c.sz - 1;
const defParts = (av) => {
  let st = 0;
  return [1, 1, 2, 3].map((x, i) => {
    const z = i == 3 ? av - st : Math.round((av * x) / 7);
    st += z;
    return z;
  });
}; // 128,128,256,384 for 896 MB
function fixedParts() {
  let st = MEM.os;
  return MEM.fp.map((sz) => {
    const o = { st, sz };
    st += sz;
    return o;
  });
}
// Free blocks: fixed -> unoccupied partitions; variable -> gaps between allocated chunks (adjacent gaps are automatically coalesced)
function holes() {
  if (MEM.pol == "fix")
    return fixedParts().filter((p) => !MEM.ch.some((c) => c.st == p.st));
  const c = [...MEM.ch].sort((a, b) => a.st - b.st),
    h = [];
  let p = MEM.os;
  c.forEach((x) => {
    if (x.st > p) h.push({ st: p, sz: x.st - p });
    p = Math.max(p, x.st + x.sz);
  });
  if (p < MEM.tot) h.push({ st: p, sz: MEM.tot - p });
  return h;
}
function plan(p) {
  const H = holes(),
    alg = MEM.alg;
  let ord = H;
  if (alg == "next")
    ord = [
      ...H.filter((h) => h.st + h.sz > MEM.nf),
      ...H.filter((h) => h.st + h.sz <= MEM.nf),
    ];
  const sc = ord.map((h) => ({ h, fit: h.sz >= p.s }));
  if (alg == "first" || alg == "next") {
    const i = sc.findIndex((x) => x.fit);
    return i >= 0 ? { h: sc[i].h, sc: sc.slice(0, i + 1) } : { h: null, sc };
  }
  const f = sc.filter((x) => x.fit);
  if (!f.length) return { h: null, sc };
  return {
    h: f.sort((a, b) => (alg == "best" ? a.h.sz - b.h.sz : b.h.sz - a.h.sz))[0]
      .h,
    sc,
  };
}
function commit(p, pl, quiet) {
  const h = pl.h,
    fix = MEM.pol == "fix",
    c = { pid: p.id, st: h.st, sz: fix ? h.sz : p.s, u: p.s };
  MEM.ch.push(c);
  p.ok = 1;
  MEM.nf = c.st + c.sz;
  mlog(
    `${p.id} allocated ${c.u} MB (${c.st} – ${mEnd(c)})${fix && c.sz > c.u ? " in a " + c.sz + " MB partition" : ""}`,
  );
  if (!quiet) ev(`Memory allocated ${p.s} MB to ${p.id}`, "#2f7bff");
  MEM.fresh = p.id;
  return c;
}
async function allocNow(p, fast) {
  const pl = plan(p),
    fix = MEM.pol == "fix";
  if (!fast) {
    MEM.busy = true;
    for (const x of pl.sc) {
      MEM.scan = x.h.st;
      memR();
      await sleep(320);
    }
    MEM.scan = -1;
    MEM.busy = false;
  }
  if (pl.h) {
    commit(p, pl, fast);
    memR();
    return true;
  }
  mlog(
    `${p.id} request ${p.s} MB (Waiting – No suitable ${fix ? "partition" : "block"})`,
  );
  if (!fast)
    toast(
      `⚠ ${p.id} (${p.s} MB) is waiting: no suitable ${fix ? "partition" : "hole"}`,
    );
  memR();
  return false;
}
function retry() {
  MEM.procs
    .filter((p) => !p.ok)
    .forEach((p) => {
      const pl = plan(p);
      if (pl.h) {
        const c = commit(p, pl);
        mlog(`${p.id} left the waiting queue and was placed at ${c.st}`);
      }
    });
}
function release(id) {
  const p = MEM.procs.find((x) => x.id == id);
  if (!p) return false;
  const c = MEM.ch.find((x) => x.pid == id);
  if (c) {
    MEM.ch = MEM.ch.filter((x) => x.pid != id);
    mlog(`${id} released (${c.sz} MB)`);
    ev(`Memory released from ${id}`, "#2f7bff");
    if (MEM.pol == "var") {
      const h = holes().find((h) => h.st <= c.st && h.st + h.sz > c.st);
      if (h)
        mlog(`Free hole created (${h.st} – ${h.st + h.sz - 1}): ${h.sz} MB`);
    } else mlog(`Partition (${c.st} – ${mEnd(c)}) is free again`);
  } else mlog(`${id} removed from the waiting queue`);
  MEM.procs = MEM.procs.filter((x) => x != p);
  if (MEM.sel == id) MEM.sel = null;
  MEM.skip.clear();
  retry();
  return true;
}
function addProc(id, name, s) {
  const p = { id, name: name || MN[MEM.ni++ % MN.length], s, ok: 0 },
    m = /^P(\d+)$/.exec(id);
  if (m) MEM.pidc = Math.max(MEM.pidc, +m[1] + 1);
  MEM.procs.push(p);
  return p;
}
window.memSel = (k) => {
  MEM.sel = MEM.sel == k ? null : k;
  memR();
};
window.memRel = (id) => {
  if (MEM.busy) return;
  release(id);
  memR();
};
function memCfg(tot, os, pol, alg, fp) {
  Object.assign(MEM, { tot, os, pol, alg, fp, ch: [], nf: os, sel: null });
  MEM.skip.clear();
  MEM.procs.forEach((p) => (p.ok = 0));
}
function memDemo() {
  memCfg(1024, 128, "var", "first", defParts(896));
  MEM.procs = [];
  MEM.log = [];
  MEM.hist = [];
  MEM.ni = 0;
  MEM.pidc = 1;
  MEM.step =
    "Demo loaded: P6 (120 MB) cannot fit in either hole although 178 MB is free → external fragmentation.";
  mlog("Configuration set (Variable, First Fit)");
  mlog("OS reserved 128 MB (0 – 127)");
  [
    ["P1", 100],
    ["P2", 180],
    ["P3", 90],
    ["T1", 80],
    ["P4", 220],
    ["T2", 98],
    ["P5", 128],
  ].forEach(([id, s]) => {
    const p = addProc(id, id[0] == "T" ? "Temporary" : null, s);
    if (id[0] == "T") MEM.ni--;
    const pl = plan(p);
    commit(p, pl, true);
  });
  release("T1");
  release("T2");
  const p6 = addProc("P6", null, 120);
  const pl = plan(p6);
  if (pl.h) commit(p6, pl, true);
  else mlog("P6 request 120 MB (Waiting – No suitable block)");
}
function memInit() {
  memDemo();
}
const nm = (n, t) => `<b class="nm">${n}.</b> ${t}`;
const memH = () =>
  hero(
    "🗃️",
    "#8b5cf6",
    "Memory Management",
    "Simulate memory allocation using different allocation algorithms and visualize memory usage, free space and fragmentation.",
  ) +
  `<div class="mrow" style="grid-template-columns:2fr 1fr"><div class="c bl"><h3>${nm(1, "Configuration & Algorithm Selection")}</h3><div class="mcfg"><div><label>Total Memory (MB)<input id="mtot" type="number" min="128"></label><label>OS Reserved (MB)<input id="mos" type="number" min="0"></label><label>Fixed Partition Sizes (MB) <small class="m">(comma separated)</small><input id="mfp" placeholder="e.g. 128, 128, 256, 384"></label></div>
<div><b style="font-size:13px">Partitioning Type</b><div id="mpolr" style="margin:6px 0"><div class="rad" data-v="fix">Fixed Partitioning</div><div class="rad on" data-v="var">Variable Partitioning</div></div><div id="mmsg" class="msg">Press “Apply Configuration” to commit changes.</div></div>
<div><label>Allocation Algorithm (<span id="malbl">Variable</span>)<select id="malg"><option value="first">First Fit</option><option value="best">Best Fit</option><option value="worst">Worst Fit</option><option value="next">Next Fit</option></select></label><div class="info"><b>ⓘ Algorithm Info</b><p id="malinfo"></p></div></div></div>
<div class="row"><button class="btn" id="mapp">Apply Configuration</button><button class="btn ol" id="mrst">Reset</button><button class="btn" id="mdemo" style="background:linear-gradient(180deg,#8b5cf6,#6d3fd1)">Load Demo</button></div></div>
<div class="c bl"><h3>${nm(2, "Add / Release Process")}</h3><div class="row"><label>Process ID<input id="mpid" style="width:90px"></label><label>Memory Required (MB)<input id="mreq" type="number" min="1" value="120" style="width:110px"></label><label>Action<select id="mact"><option value="alloc">Allocate</option><option value="queue">Add to Queue (step mode)</option><option value="rel">Release</option></select></label></div><div class="row" style="margin-top:12px"><button class="btn gr" id="mex">Execute</button><button class="btn rd" id="mrsel">Release Selected</button><button class="btn ol" id="mclr">Clear All</button></div></div></div>
<div class="c bl"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3 style="margin:0">${nm(3, "Memory Visualization")}</h3><div class="legend"><span><i style="background:#8b95ad"></i>OS Reserved</span><span><i style="background:#8b5cf6"></i>Allocated Process</span><span><i style="background:#22c55e"></i>Free Hole</span><span><i style="border:2px solid #facc15"></i>Selected Block</span></div></div>
<div class="mbar" id="mbar"></div><div class="axis" id="maxis"></div><p style="text-align:center;color:#c3cff0;font-size:12px;margin-bottom:8px">Memory Address (MB)</p>
<div class="row" style="align-items:center"><button class="btn ol" id="mprev">⏮ Prev Step</button><button class="btn" id="mnext">⏭ Next Step</button><button class="btn gr" id="mauto">▶ Auto-run</button>${spdCtl()}<span id="mstep" style="flex:1;min-width:260px;font-size:13px;color:#cfe0ff"></span></div></div>
<div class="mrow"><div class="c bl"><h3>▦ Process Table</h3><table><thead><tr><th>PID<th>Process Name<th>Requested (MB)<th>Allocated (MB)<th>Start Addr<th>End Addr<th>Status<th>Action</tr></thead><tbody id="mtb"></tbody></table></div>
<div class="c bl"><h3>${nm(5, '<span id="mhh">Free Holes (Variable Partitioning)</span>')}</h3><table><thead><tr><th id="mh0">Hole No.<th>Start Addr (MB)<th>End Addr (MB)<th>Size (MB)</tr></thead><tbody id="mh"></tbody></table></div>
<div class="c bl"><h3>${nm(6, "Memory Statistics")}</h3><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap" id="mdn"></div></div></div>
<div class="mrow"><div class="c bl"><h3>${nm(7, "Fragmentation Analysis")}</h3><div class="g2" style="margin:0;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))"><div class="fb" style="border-color:#2352c8"><b style="color:#38bdf8">⏱ Internal Fragmentation</b><small>Occurs when the allocated partition is larger than the process size.</small><table><thead><tr><th>PID<th>Partition/Block Size (MB)<th>Process Size (MB)<th>Internal Frag (MB)</tr></thead><tbody id="mif"></tbody></table><div class="tot" style="background:#10307a">Total Internal Fragmentation <b id="mift"></b></div></div>
<div class="fb" style="border-color:#6d3fd1"><b style="color:#c4a1ff">✖ External Fragmentation</b><small>Occurs when free memory is split into multiple non-contiguous holes.</small><table><thead><tr><th>Hole No.<th>Start Addr (MB)<th>End Addr (MB)<th>Size (MB)</tr></thead><tbody id="mef"></tbody></table><p id="mefn" style="font-size:12px;margin:6px 0"></p><div class="tot" style="background:#3b1a7a">Total External Fragmentation <b id="meft"></b></div></div></div></div>
<div class="c bl"><h3>${nm(8, "Memory Utilization")}</h3><div id="mut"></div></div><div class="c bl"><h3>${nm(9, "Activity Log")}</h3><div style="max-height:250px;overflow:auto" id="mlw"><table><thead><tr><th style="width:70px">Time<th>Event</tr></thead><tbody id="ml"></tbody></table></div></div></div>`;
function memR() {
  if (!$("#mbar")) return;
  const H = holes(),
    fix = MEM.pol == "fix",
    ch = [...MEM.ch].sort((a, b) => a.st - b.st),
    tot = MEM.tot,
    used = ch.reduce((a, c) => a + c.sz, 0),
    free = H.reduce((a, h) => a + h.sz, 0),
    allocT = MEM.os + used,
    pct = (allocT / tot) * 100,
    big = Math.max(0, ...H.map((h) => h.sz));
  const segs = [
    ...(MEM.os ? [{ k: "OS", t: "o", st: 0, sz: MEM.os }] : []),
    ...ch.map((c) => ({ k: c.pid, t: "p", ...c })),
    ...H.map((h) => ({ k: "H" + h.st, t: "h", ...h })),
  ].sort((a, b) => a.st - b.st);
  $("#mbar").innerHTML = segs
    .map((s) => {
      const f = s.t == "p" ? (s.u / s.sz) * 100 : 100,
        bg =
          s.t == "o"
            ? "#8b95ad"
            : s.t == "h"
              ? "#22c55e"
              : f < 100
                ? `linear-gradient(90deg,${col(s.pid)} ${f}%,transparent ${f}%),repeating-linear-gradient(45deg,#f87171aa 0 5px,#f8717144 5px 10px)`
                : col(s.pid),
        nameT = s.t == "o" ? "OS" : s.t == "h" ? "Free" : s.pid,
        mb = s.t == "p" ? s.u : s.sz,
        wide = s.sz / tot > 0.06;
      return `<div class="ms ${s.t == "h" ? "fr" : ""} ${MEM.sel == s.k ? "sel" : ""} ${s.t == "h" && MEM.scan == s.st ? "scan" : ""} ${s.t == "p" && MEM.fresh == s.pid ? "new" : ""}" data-k="${s.k}" onclick="memSel('${s.k}')" title="${nameT}: ${s.st} – ${s.st + s.sz - 1} (${s.sz} MB)" style="flex:${s.sz};background:${bg};${s.t == "h" ? "color:#052e16;text-shadow:none" : ""}${s.t == "o" ? "color:#0b1020;text-shadow:none" : ""}"><b>${nameT}</b>${wide ? `<span>${mb} MB${s.t == "p" && s.sz > s.u ? " +" + (s.sz - s.u) + " frag" : ""}</span><span>(${s.st} – ${s.st + s.sz - 1})</span>` : ""}</div>`;
    })
    .join("");
  if (MEM.fresh)
    setTimeout(() => {
      MEM.fresh = null;
    }, 700);
  let last = -99;
  const ticks = [...new Set([...segs.map((s) => s.st), tot])];
  $("#maxis").innerHTML = ticks
    .map((v) => {
      const x = (v / tot) * 100;
      if (x - last < 3.2 && v != tot) return "";
      last = x;
      return `<span style="left:${x}%">${v}</span>`;
    })
    .join("");
  $("#mtb").innerHTML =
    MEM.procs
      .map((p, i) => {
        const c = MEM.ch.find((x) => x.pid == p.id);
        return `<tr class="clk ${MEM.sel == p.id ? "sel" : ""}" onclick="memSel('${p.id}')"><td>${pill(p.id)}<td class="ed" data-t="text" data-f="mp" data-a="${i}:name">${p.name}<td class="ed" data-f="mp" data-a="${i}:s">${p.s}<td>${c ? c.sz : "-"}<td>${c ? c.st : "-"}<td>${c ? mEnd(c) : "-"}<td><span class="st ${c ? "A" : "W"}">${c ? "Allocated" : "Waiting"}</span><td>${c ? `<button class="btn rd" style="padding:3px 10px" onclick="event.stopPropagation();memRel('${p.id}')">Release</button>` : "-"}</tr>`;
      })
      .join("") ||
    '<tr><td colspan=8 class="m" style="color:#8fa0c6">No processes yet. Use “Add / Release Process”.</tr>';
  $("#mhh").textContent = fix
    ? "Free Partitions (Fixed Partitioning)"
    : "Free Holes (Variable Partitioning)";
  $("#mh0").textContent = fix ? "Part. No." : "Hole No.";
  const hr =
    H.map(
      (h, i) =>
        `<tr class="clk ${MEM.sel == "H" + h.st ? "sel" : ""}" onclick="memSel('H${h.st}')"><td>H${i + 1}<td>${h.st}<td>${h.st + h.sz - 1}<td>${h.sz}</tr>`,
    ).join("") ||
    '<tr><td colspan=4 class="m" style="color:#8fa0c6">No free memory</tr>';
  $("#mh").innerHTML = hr;
  $("#mdn").innerHTML =
    `<div class="dnw"><svg class="dn" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" stroke="#4a5a82"/><circle cx="50" cy="50" r="30" stroke="#22c55e" stroke-dasharray="${pct * 1.885} 188.5"/></svg><div class="ct"><div>${pct.toFixed(1)}%<br><small style="font:12px Inter;color:#c3cff0">Allocated</small></div></div></div><div style="line-height:1.9;font-size:13px"><span class="lamp" style="background:#22c55e"></span>Allocated<br><b>${allocT} MB (${pct.toFixed(1)}%)</b><br><span class="lamp" style="background:#8fa0c6"></span>Free<br><b>${free} MB (${(100 - pct).toFixed(1)}%)</b><br><span class="m" style="color:#8fa0c6">Total</span> <b>${tot} MB</b></div>`;
  $("#mif").innerHTML =
    ch
      .map(
        (c) =>
          `<tr><td>${pill(c.pid)}<td>${c.sz}<td>${c.u}<td>${c.sz - c.u}</tr>`,
      )
      .join("") ||
    '<tr><td colspan=4 class="m" style="color:#8fa0c6">No allocated processes</tr>';
  $("#mift").textContent = ch.reduce((a, c) => a + c.sz - c.u, 0) + " MB";
  $("#mef").innerHTML =
    H.map(
      (h, i) =>
        `<tr><td>H${i + 1}<td>${h.st}<td>${h.st + h.sz - 1}<td>${h.sz}</tr>`,
    ).join("") ||
    '<tr><td colspan=4 class="m" style="color:#8fa0c6">No free holes</tr>';
  const blk = MEM.procs.filter((p) => !p.ok && p.s <= free && p.s > big);
  $("#mefn").innerHTML = blk.length
    ? `<span style="color:#fca5a5">⚠ ${blk.map((p) => p.id + " (" + p.s + " MB)").join(", ")} blocked: ${free} MB free in total, but the largest hole is only ${big} MB.</span>`
    : `<span style="color:#86efac">No process is blocked by fragmentation. Largest hole: ${big} MB.</span>`;
  $("#meft").textContent = (H.length > 1 ? free : 0) + " MB";
  const ub = (l, v, c, mb) =>
    `<div class="ub"><div style="display:flex;justify-content:space-between"><span>${l}</span><b>${mb} MB</b></div><div style="display:flex;align-items:center;gap:10px"><div class="gauge2" style="flex:1;height:12px;margin:0"><i style="width:${v}%;background:${c}"></i></div><b style="min-width:52px;text-align:right">${v.toFixed(1)}%</b></div></div>`;
  $("#mut").innerHTML =
    ub("Total Memory", 100, "#2f7bff", tot) +
    ub("OS Reserved", (MEM.os / tot) * 100, "#22d3ee", MEM.os) +
    ub("Allocated (processes)", (used / tot) * 100, "#22c55e", used) +
    ub("Free Memory", (free / tot) * 100, "#f59e0b", free);
  $("#ml").innerHTML = MEM.log
    .map((r) => `<tr><td>${r[0]}<td>${r[1]}</tr>`)
    .join("");
  const lw = $("#mlw");
  lw.scrollTop = lw.scrollHeight;
  $("#mpid").value = $("#mpid").dataset.touched
    ? $("#mpid").value
    : "P" + MEM.pidc;
  $("#mstep").textContent = MEM.step;
}
EDF.mp = (a, v) => {
  const [i, k] = a.split(":"),
    p = MEM.procs[+i];
  if (!p || MEM.busy) return memR();
  if (k == "name") p.name = v || p.name;
  else if (v >= 1 && v <= MEM.tot - MEM.os) {
    const was = p.ok;
    MEM.ch = MEM.ch.filter((c) => c.pid != p.id);
    p.s = Math.round(v);
    p.ok = 0;
    MEM.skip.clear();
    mlog(`${p.id} request changed to ${p.s} MB`);
    if (was) {
      const pl = plan(p);
      if (pl.h) commit(p, pl, true);
      else mlog(`${p.id} (${p.s} MB) is now Waiting`);
    }
    retry();
  } else toast("⚠ Size must be between 1 and " + (MEM.tot - MEM.os) + " MB");
  memR();
};
function memI() {
  const msg = (t, bad) => {
    const e = $("#mmsg");
    e.textContent = t;
    e.style.color = bad ? "#fca5a5" : "#86efac";
    e.style.borderColor = bad ? "#a32a2a" : "#15803d";
  };
  const setPol = (v) => {
    $$("#mpolr .rad").forEach((r) =>
      r.classList.toggle("on", r.dataset.v == v),
    );
    $("#malbl").textContent = v == "fix" ? "Fixed" : "Variable";
    $("#mfp").disabled = v != "fix";
    $("#mfp").style.opacity = v == "fix" ? 1 : 0.45;
  };
  const info = () => {
    const a = AINFO[$("#malg").value];
    $("#malinfo").innerHTML = `<b style="color:#fff">${a[0]}:</b> ${a[1]}`;
  };
  $("#mtot").value = MEM.tot;
  $("#mos").value = MEM.os;
  $("#mfp").value = MEM.pol == "fix" ? MEM.fp.join(", ") : "";
  $("#malg").value = MEM.alg;
  setPol(MEM.pol);
  info();
  $$("#mpolr .rad").forEach((r) => (r.onclick = () => setPol(r.dataset.v)));
  $("#malg").onchange = () => {
    info();
    MEM.alg = $("#malg").value;
    mlog("Allocation algorithm set to " + AINFO[MEM.alg][0]);
    memR();
  };
  $("#mpid").oninput = () => ($("#mpid").dataset.touched = 1);
  $("#mapp").onclick = () => {
    if (MEM.busy) return;
    const tot = +$("#mtot").value,
      os = +$("#mos").value,
      pol = $("#mpolr .on").dataset.v,
      alg = $("#malg").value,
      bad = (t) => {
        msg("✖ " + t, 1);
        toast("⚠ " + t);
      };
    if (!Number.isInteger(tot) || tot < 128 || tot > 65536)
      return bad("Total memory must be a whole number from 128 to 65536 MB");
    if (!Number.isInteger(os) || os < 0 || os >= tot)
      return bad(
        "OS reserved must be a whole number from 0 to less than total memory",
      );
    const av = tot - os;
    let fp = [];
    if (pol == "fix") {
      const t = $("#mfp").value.trim();
      if (!t) fp = defParts(av);
      else {
        fp = t
          .split(/[,\s]+/)
          .filter(Boolean)
          .map(Number);
        if (fp.some((x) => !Number.isInteger(x) || x < 1))
          return bad("Partition sizes must be positive whole numbers");
        const sum = fp.reduce((a, b) => a + b, 0);
        if (sum > av)
          return bad(
            `Partitions add up to ${sum} MB but only ${av} MB is available`,
          );
        if (sum < av) fp.push(av - sum);
      }
      $("#mfp").value = fp.join(", ");
    }
    memCfg(tot, os, pol, alg, fp);
    mlog(
      `Configuration set (${pol == "fix" ? "Fixed" : "Variable"}, ${AINFO[alg][0]})`,
    );
    if (os) mlog(`OS reserved ${os} MB (0 – ${os - 1})`);
    if (pol == "fix") mlog("Partitions: " + fp.join(" | ") + " MB");
    MEM.procs.forEach((p) => {
      const pl = plan(p);
      if (pl.h) commit(p, pl, true);
      else mlog(`${p.id} request ${p.s} MB (Waiting)`);
    });
    MEM.step = "Configuration applied; existing processes were re-placed.";
    msg(
      `✔ Configuration applied · ${av} MB available${pol == "fix" ? " in " + fp.length + " partitions" : ""}`,
    );
    memR();
    toast("Configuration applied");
  };
  $("#mrst").onclick = () => {
    if (MEM.busy) return;
    memCfg(1024, 128, "var", "first", defParts(896));
    MEM.procs = [];
    MEM.log = [];
    MEM.hist = [];
    MEM.pidc = 1;
    MEM.ni = 0;
    mlog("Configuration reset (Variable, First Fit)");
    mlog("OS reserved 128 MB (0 – 127)");
    MEM.step = "Reset. Add a process to begin.";
    delete $("#mpid").dataset.touched;
    memI();
    toast("Reset to defaults");
  };
  $("#mdemo").onclick = () => {
    if (MEM.busy) return;
    memDemo();
    delete $("#mpid").dataset.touched;
    memI();
    toast("Demo loaded");
  };
  $("#mex").onclick = async () => {
    if (MEM.busy) return toast("Please wait for the current animation");
    const act = $("#mact").value,
      id = $("#mpid").value.trim().toUpperCase(),
      req = +$("#mreq").value;
    if (act == "rel") {
      if (!MEM.procs.some((p) => p.id == id))
        return toast("⚠ No process with ID " + id);
      release(id);
      memR();
      return toast(id + " released");
    }
    if (!id) return toast("⚠ Enter a process ID");
    if (MEM.procs.some((p) => p.id == id))
      return toast("⚠ Process ID " + id + " already exists");
    if (!Number.isInteger(req) || req < 1 || req > MEM.tot - MEM.os)
      return toast("⚠ Memory required must be 1–" + (MEM.tot - MEM.os) + " MB");
    const p = addProc(id, null, req);
    delete $("#mpid").dataset.touched;
    if (act == "alloc") await allocNow(p);
    else {
      mlog(`${id} queued (${req} MB) – use Next Step to allocate`);
      MEM.step = `${id} added to the waiting queue. Press Next Step.`;
      memR();
    }
    memR();
  };
  $("#mrsel").onclick = () => {
    if (MEM.busy) return;
    const s = MEM.sel;
    if (!s || s == "OS" || (s[0] == "H" && !MEM.procs.some((p) => p.id == s)))
      return toast(
        "⚠ Select an allocated process (click a block or a table row)",
      );
    release(s);
    memR();
    toast(s + " released");
  };
  $("#mclr").onclick = () => {
    if (MEM.busy) return;
    MEM.procs = [];
    MEM.ch = [];
    MEM.nf = MEM.os;
    MEM.sel = null;
    MEM.skip.clear();
    mlog("All processes cleared");
    MEM.step = "All processes cleared.";
    memR();
    toast("Memory cleared");
  };
  $("#mnext").onclick = () => {
    MEM.auto = false;
    memStepGo();
  };
  $("#mprev").onclick = () => {
    MEM.auto = false;
    if (MEM.busy) return;
    if (!MEM.hist.length) return toast("Nothing to undo");
    Object.assign(MEM, JSON.parse(MEM.hist.pop()));
    MEM.skip.clear();
    MEM.step = "⏮ Reverted to the previous state.";
    memR();
  };
  $("#mauto").onclick = async () => {
    if (MEM.auto) {
      MEM.auto = false;
      return;
    }
    MEM.auto = true;
    $("#mauto").textContent = "⏸ Pause";
    while (MEM.auto && (await memStepGo())) await sleep(900);
    MEM.auto = false;
    const b = $("#mauto");
    if (b) b.textContent = "▶ Auto-run";
  };
  memR();
}
async function memStepGo() {
  if (MEM.busy) return false;
  const p = MEM.procs.find((p) => !p.ok && !MEM.skip.has(p.id));
  if (!p) {
    MEM.step =
      "✔ No waiting process can be placed right now. Use “Add to Queue” to add one.";
    memR();
    return false;
  }
  MEM.hist.push(
    JSON.stringify({
      procs: MEM.procs,
      ch: MEM.ch,
      log: MEM.log,
      nf: MEM.nf,
      pidc: MEM.pidc,
    }),
  );
  if (MEM.hist.length > 60) MEM.hist.shift();
  const pl = plan(p),
    fix = MEM.pol == "fix",
    scan =
      pl.sc
        .map(
          (x) =>
            `[${x.h.st}–${x.h.st + x.h.sz - 1}] ${x.h.sz} MB ${x.fit ? "✔" : "✖"}`,
        )
        .join(" · ") || "no free space",
    head = `${p.id} needs ${p.s} MB · ${AINFO[MEM.alg][0]} on ${fix ? "fixed partitions" : "variable holes"}`;
  MEM.busy = true;
  for (const x of pl.sc) {
    MEM.scan = x.h.st;
    MEM.step = `${head}. Checking [${x.h.st}–${x.h.st + x.h.sz - 1}] (${x.h.sz} MB): ${x.fit ? "fits ✔" : p.s + " > " + x.h.sz + " → skip ✖"}`;
    memR();
    await sleep(550);
  }
  MEM.scan = -1;
  MEM.busy = false;
  if (pl.h) {
    const c = commit(p, pl);
    MEM.step = `${head}. Scan: ${scan} → ALLOCATED at ${c.st}–${mEnd(c)}.${fix ? " Internal fragmentation = " + (c.sz - c.u) + " MB." : ""}`;
  } else {
    MEM.skip.add(p.id);
    mlog(
      `${p.id} request ${p.s} MB (Waiting – No suitable ${fix ? "partition" : "block"})`,
    );
    MEM.step = `${head}. Scan: ${scan} → no suitable ${fix ? "partition" : "hole"}; ${p.id} keeps WAITING.`;
    toast(`⚠ ${p.id} could not be allocated`);
  }
  memR();
  return true;
}

/* ================= RESULTS & ANALYTICS ================= */
const RS = { exam: "Mid Sem Exam (CS301)", d: null };
function rng(s) {
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const FN = [
    "Aditi",
    "Rohan",
    "Neha",
    "Aryan",
    "Karan",
    "Rahul",
    "Pooja",
    "Kunal",
    "Simran",
    "Mohit",
    "Isha",
    "Vikram",
    "Ananya",
    "Dev",
    "Meera",
    "Arjun",
  ],
  LN = [
    "Sharma",
    "Patil",
    "Singh",
    "Mehta",
    "Joshi",
    "Verma",
    "Deshmukh",
    "Thakur",
    "Kaur",
    "Jain",
    "Rao",
    "Nair",
  ];
const GR = [
    ["A+", 90, "#8b5cf6"],
    ["A", 80, "#2f7bff"],
    ["B", 70, "#2f7bff"],
    ["C", 60, "#22c55e"],
    ["D", 50, "#f59e0b"],
    ["E", 40, "#ef4444"],
    ["F", 0, "#ef4444"],
  ],
  gr = (m) => GR.find((g) => m >= g[1]);
function resGen(seed) {
  const r = rng(seed),
    S = [];
  for (let i = 0; i < 100; i++) {
    const m = Math.max(
      5,
      Math.min(100, Math.round(70 + (r() + r() + r() - 1.5) * 50)),
    );
    S.push({
      roll: "CS301-" + pad(i + 1).padStart(3, "0"),
      name: FN[Math.floor(r() * 16)] + " " + LN[Math.floor(r() * 12)],
      m,
      att: i < 98,
      sub: Math.round(8 + r() * 52),
    });
  }
  const A = S.filter((s) => s.att),
    pass = A.filter((s) => s.m >= 40).length,
    sc = Array(10).fill(0);
  A.forEach((s) => sc[Math.min(9, Math.floor(s.m / 10))]++);
  const sb = [
    "Operating Systems",
    "DBMS",
    "Computer Networks",
    "Software Engineering",
    "Data Structures",
  ].map((n) => {
    const ms = A.map((s) =>
      Math.max(5, Math.min(100, Math.round(s.m + (r() - 0.5) * 20))),
    );
    return {
      n,
      avg: ms.reduce((a, b) => a + b) / ms.length,
      hi: Math.max(...ms),
      lo: Math.min(...ms),
      p: (ms.filter((x) => x >= 40).length / ms.length) * 100,
    };
  });
  const tb = Array(7).fill(0);
  A.forEach((s) => tb[Math.min(6, Math.floor(s.sub / 10))]++);
  const w = (a, b) =>
    Array.from({ length: 13 }, (_, i) =>
      Math.round(a + b * Math.exp(-((i - 6) ** 2) / 14) + r() * 6),
    );
  return {
    A,
    S,
    pass,
    sc,
    sb,
    tb,
    avg: A.reduce((a, s) => a + s.m, 0) / A.length,
    sub: A.reduce((a, s) => a + s.sub, 0) / A.length,
    cpu: w(18, 65),
    mem: w(25, 50),
    q: w(5, 40),
    sorted: [...A].sort((a, b) => b.m - a.m),
  };
}
const rsH = () =>
  hero(
    "📊",
    "#8b5cf6",
    "Results & Analytics",
    "Analyze examination results, system performance and resource utilization",
    `<div style="margin-left:auto" class="row"><label>Select Examination<select id="rex"><option>Mid Sem Exam (CS301)</option><option>End Sem Exam (CS301)</option><option>Unit Test 1 (CS301)</option></select></label><button class="btn" id="rrep" style="background:linear-gradient(180deg,#8b5cf6,#6d3fd1)">📄 Generate Report</button></div>`,
  ) +
  `<div class="g5" id="rk"></div><div class="g3"><div class="c bl"><h3>📊 Score Distribution</h3><div id="rsc"></div></div><div class="c gr"><h3>📄 Pass/Fail Ratio</h3><div id="rpf"></div></div><div class="c vi"><h3>📊 Grade Distribution</h3><div id="rgd"></div></div></div>
<div class="g2" style="grid-template-columns:1.2fr 1fr"><div class="c bl"><h3>📖 Subject-wise Performance</h3><table><thead><tr><th>Subject<th>Total Students<th>Average Marks<th>Highest<th>Lowest<th>Pass %</tr></thead><tbody id="rsb"></tbody></table></div><div class="c vi"><h3>⏱ Submission Time Analysis</h3><div id="rtm"></div></div></div>
<div class="g3" style="grid-template-columns:1fr 1fr 1.2fr"><div class="c or"><h3>🏆 Top Performers</h3><table><thead><tr><th>Rank<th>Roll No.<th>Name<th>Marks<th>Grade</tr></thead><tbody id="rtp"></tbody></table></div><div class="c rd"><h3>❗ Low Performers (Need Attention)</h3><table><thead><tr><th>Roll No.<th>Name<th>Marks<th>Grade</tr></thead><tbody id="rlp"></tbody></table></div><div class="c bl"><h3>⚙️ System Performance During Exam</h3><div id="rsp"></div></div></div>`;
const line = (arr, mx, c, W = 300, H = 130, fill = 1) => {
  const pts = arr.map((v, i) => [
      10 + (i * (W - 20)) / (arr.length - 1),
      H - 10 - (v / mx) * (H - 30),
    ]),
    d = pts
      .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1))
      .join(" ");
  return `${fill ? `<path d="${d} L${W - 10} ${H - 10} L10 ${H - 10}Z" fill="${c}" opacity=".18"/>` : ""}<path d="${d}" fill="none" stroke="${c}" stroke-width="2.5" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.5s" fill="freeze"/></path>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${c}"/>`).join("")}`;
};
function rsI() {
  const render = () => {
    const D = RS.d,
      A = D.A,
      n = A.length,
      sorted = D.sorted;
    $("#rk").innerHTML = [
      ["👥", "#2352c8", "Total Students", "rk0", 100, "Attempted: 98 (98%)"],
      [
        "✅",
        "#15803d",
        "Passed",
        "rk1",
        D.pass,
        `Pass Percentage ${((D.pass / n) * 100).toFixed(1)}%`,
      ],
      [
        "❌",
        "#a32a2a",
        "Failed",
        "rk2",
        n - D.pass,
        `Fail Percentage ${(((n - D.pass) / n) * 100).toFixed(1)}%`,
      ],
      ["📝", "#a8690a", "Average Marks", "rk3", null, ""],
      ["⏰", "#6d3fd1", "Average Submission Time", "rk4", null, ""],
    ]
      .map(([i, c, l, id, v, s]) => kpi(i, c, l, id, v == null ? "" : 0, s))
      .join("");
    cu($("#rk0"), 100);
    cu($("#rk1"), D.pass);
    cu($("#rk2"), n - D.pass);
    $("#rk3").innerHTML = `${D.avg.toFixed(1)} / 100`;
    $("#rk4").innerHTML = `${D.sub.toFixed(1)} min`;
    const mx = Math.max(...D.sc);
    $("#rsc").innerHTML =
      `<div style="display:flex;gap:6px;align-items:flex-end;height:170px">${D.sc.map((v, i) => `<div style="flex:1;text-align:center;font-size:11px"><small>${v}</small><div class="vb" data-h="${(v / mx) * 130}" style="background:linear-gradient(180deg,#38bdf8,#6d3fd1)"></div></div>`).join("")}</div><div style="display:flex;gap:6px;font-size:10px;color:#c3cff0;text-align:center">${D.sc.map((_, i) => `<span style="flex:1">${i * 10}-${i * 10 + 9}</span>`).join("")}</div>`;
    const pp = (D.pass / n) * 188.5;
    $("#rpf").innerHTML =
      `<div style="display:flex;align-items:center;gap:14px;justify-content:center"><svg class="dn" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" stroke="#ef4444"/><circle cx="50" cy="50" r="30" stroke="#22c55e" stroke-dasharray="0 188.5" id="rpd"/></svg><div style="margin-left:-100px;width:150px;text-align:center"><b style="font-size:22px">${n}</b><br><small>Students</small></div><div style="line-height:2"><span class="lamp" style="background:#22c55e"></span>Passed ${D.pass}<br><span class="lamp" style="background:#ef4444"></span>Failed ${n - D.pass}</div></div>`;
    const gc = GR.map((g) => A.filter((s) => gr(s.m) == g).length),
      gm = Math.max(...gc);
    $("#rgd").innerHTML = GR.map(
      (g, i) =>
        `<div style="display:flex;gap:8px;align-items:center;font-size:12px;margin:6px 0"><span style="width:90px">${g[0]} (${g[1]}${i ? "-" + (GR[i - 1][1] - 1) : "+"})</span><div class="bar2" data-w="${(gc[i] / gm) * 100}" style="background:${g[2]}"></div><b>${gc[i]}</b></div>`,
    ).join("");
    $("#rsb").innerHTML = D.sb
      .map(
        (s) =>
          `<tr><td>${s.n}<td>100<td>${s.avg.toFixed(1)}<td>${s.hi}<td>${s.lo}<td style="color:${s.p >= 85 ? "#22c55e" : "#ef4444"}">${s.p.toFixed(1)}%</tr>`,
      )
      .join("");
    const tmx = Math.max(...D.tb);
    $("#rtm").innerHTML =
      `<svg viewBox="0 0 300 150" style="width:100%">${line(D.tb, tmx, "#8b5cf6", 300, 130)}</svg><div style="display:flex;justify-content:space-between;font-size:10px;color:#c3cff0">${["0-10", "10-20", "20-30", "30-40", "40-50", "50-60", "60+"].map((x) => `<span>${x}</span>`).join("")}</div>`;
    const tag = (m) => {
      const g = gr(m);
      return `<span class="tag" style="background:${g[2]}">${g[0]}</span>`;
    };
    $("#rtp").innerHTML = sorted
      .slice(0, 5)
      .map(
        (s, i) =>
          `<tr><td>${["🏆", "🥈", "🥉"][i] || i + 1}<td>${s.roll}<td>${s.name}<td class="ed" data-f="rm" data-a="${s.roll}">${s.m}<td>${tag(s.m)}</tr>`,
      )
      .join("");
    $("#rlp").innerHTML = sorted
      .slice(-5)
      .reverse()
      .map(
        (s) =>
          `<tr><td>${s.roll}<td>${s.name}<td class="ed" data-f="rm" data-a="${s.roll}">${s.m}<td>${tag(s.m)}</tr>`,
      )
      .join("");
    $("#rsp").innerHTML =
      `<svg viewBox="0 0 300 140" style="width:100%">${line(D.cpu, 100, "#2f7bff", 300, 130)}${line(D.mem, 100, "#8b5cf6", 300, 130)}${line(D.q, 100, "#f59e0b", 300, 130, 0)}</svg><small style="color:#c3cff0"><span class="lamp" style="background:#2f7bff"></span>CPU % <span class="lamp" style="background:#8b5cf6"></span>Memory % <span class="lamp" style="background:#f59e0b"></span>Queue</small>`;
    raf(() => {
      $$(".vb").forEach((e) => (e.style.height = e.dataset.h + "px"));
      $$(".bar2").forEach((e) => (e.style.width = e.dataset.w * 0.75 + "%"));
      $("#rpd").setAttribute("stroke-dasharray", `${pp} 188.5`);
    });
  };
  RS.d = resGen(301);
  RS.render = render;
  render();
  $("#rex").onchange = (e) => {
    RS.d = resGen(300 + e.target.selectedIndex * 37 + 1);
    render();
    toast("Loaded " + e.target.value);
  };
  $("#rrep").onclick = () => {
    const D = RS.d,
      csv =
        "Roll,Name,Marks,Grade\n" +
        D.sorted
          .map((s) => `${s.roll},${s.name},${s.m},${gr(s.m)[0]}`)
          .join("\n"),
      a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv]));
    a.download = "examos-report.csv";
    a.click();
    toast("Report downloaded (CSV)");
  };
}

/* ================= DASHBOARD & ABOUT ================= */
const dashH =
  () => `<div class="g6" id="dk"></div><div class="g2" style="grid-template-columns:2.3fr 1fr;align-items:start"><div><div class="c banner"><div style="padding:24px 18px"><h1>Exam<b>OS</b></h1><h2 style="margin-top:14px;font-size:24px">Online Examination &amp; Result Processing System</h2><p style="color:#b8c6ee;margin-top:6px">Interactive Operating Systems Resource Management Laboratory</p><span class="q">“Every Process. Every Resource. Every Second.”</span></div><div class="scene"><span class="lap">💻</span><div class="f" style="right:4%;top:6%;animation-delay:.2s">CPU Scheduling</div><div class="f" style="right:2%;top:36%;animation-delay:1s;border-color:#f59e0b">Producer Consumer</div><div class="f" style="left:10%;top:62%;animation-delay:1.8s;border-color:#8b5cf6">Memory Management</div><div class="f" style="right:30%;top:2%;animation-delay:2.4s;border-color:#22c55e">Algorithm</div></div></div>
<div class="g4"><div class="c bl mod"><h3>🖥 <span style="color:#38bdf8">1. CPU Scheduling</span></h3><p>Simulate process scheduling for examination tasks using multiple algorithms.</p><div class="pv"><div class="mg">${[
    [0, 40],
    [10, 55],
    [28, 45],
    [50, 40],
    [60, 35],
  ]
    .map(
      (x, i) =>
        `<span>P${i + 1}</span><div style="position:relative;height:14px"><i style="position:absolute;left:${x[0]}%;width:${x[1]}%;background:${PC_[i]};animation-delay:${i * 0.2}s"></i></div>`,
    )
    .join(
      "",
    )}</div></div><button class="btn" data-go="cpu">Open Simulator →</button></div>
<div class="c or mod"><h3>🗄 <span style="color:#f59e0b">2. Producer–Consumer</span></h3><p>Simulate student answer submissions and processing using a bounded queue.</p><div class="pv"><div class="sl">→${["#22c55e", "#2f7bff", "#1b2a5a", "#22c55e", "#f59e0b"].map((c, i) => `<i style="background:${c};animation-delay:${i * 0.2}s"></i>`).join("")}→</div></div><button class="btn or" data-go="pc">Open Simulator →</button></div>
<div class="c gr mod"><h3>🛡 <span style="color:#22c55e">3. Banker's Algorithm</span></h3><p>Simulate resource allocation and check for safe/unsafe states.</p><div class="pv"><table style="font-size:10px">${[
    ["P1", "010", "743"],
    ["P2", "200", "122"],
    ["P3", "302", "600"],
    ["P4", "211", "011"],
  ]
    .map((r) => `<tr><td>${r[0]}<td>${r[1]}<td>${r[2]}</tr>`)
    .join(
      "",
    )}</table></div><button class="btn gr" data-go="bank">Open Simulator →</button></div>
<div class="c vi mod"><h3>🗃 <span style="color:#8b5cf6">4. Memory Management</span></h3><p>Simulate memory allocation using contiguous and non-contiguous techniques.</p><div class="pv"><div class="mbar" style="height:36px"><div class="mseg" style="flex:20;background:#2f7bff"></div><div class="mseg" style="flex:10;background:#22c55e"></div><div class="mseg" style="flex:30;background:#f59e0b"></div><div class="mseg free" style="flex:68"></div></div></div><button class="btn" style="background:linear-gradient(180deg,#8b5cf6,#6d3fd1)" data-go="mem">Open Simulator →</button></div></div></div>
<div class="c"><h3>🕒 System Events</h3><div id="dev"></div></div></div><div class="c bl hero"><span style="font-size:34px">📖</span><div style="flex:1"><h3 style="font-size:16px">About This Project</h3><p style="font-size:12.5px;color:#c3cff0;line-height:1.5">ExamOS is an educational simulation of an online examination platform that demonstrates how an operating system manages CPU scheduling, process synchronization, deadlock avoidance and memory.</p></div><button class="btn ol" data-go="about">Learn More →</button></div>`;
function dashR() {
  if (!$("#dk")) return;
  if (!$("#dk0")) {
    $("#dk").innerHTML = [
      ["👥", "#2352c8", "Total Students", "dk0", "Active in Examination"],
      ["📄", "#6d3fd1", "Submissions", "dk1", "Answers Submitted"],
      ["📚", "#a8690a", "Processing Queue", "dk2", "In Queue"],
      ["⚙️", "#0e7490", "Processing Workers", "dk3", "Active"],
      ["📊", "#15803d", "Results Generated", "dk4", "Completed"],
      ["🛡", "#15803d", "System Status", "dk5", "All Systems Operational"],
    ]
      .map(([i, c, l, id, s]) => kpi(i, c, l, id, "", s))
      .join("");
  }
  cu($("#dk0"), 100);
  cu($("#dk1"), PC.prod + 52);
  $("#dk2").textContent = `${PC.buf.length} / ${PC.N}`;
  cu(
    $("#dk3"),
    PC.C.filter((c) => c.st == "Consuming").length || (PC.run ? 1 : 0),
  );
  cu($("#dk4"), PC.cons + 50);
  $("#dk5").textContent = PC.run ? "Running" : "Idle";
  $("#dk5").style.color = PC.run ? "#22c55e" : "#f59e0b";
  $("#dev").innerHTML = EV.slice(0, 9)
    .map(
      (e) =>
        `<div class="ev"><i style="background:${e.c}"></i><span>${e.t}</span>${e.m}</div>`,
    )
    .join("");
}
const aboutH = () =>
  hero(
    "ℹ️",
    "#2f7bff",
    "About ExamOS",
    "An educational operating-systems laboratory",
  ) +
  `<div class="c bl" style="line-height:1.7"><p>ExamOS models an online examination platform. Many students perform actions at once, creating processes, shared resources and memory requests. The simulator shows how the OS handles them:</p><ul><li><b>CPU Scheduling</b> – FCFS, SJF, SRTF, Priority, Round Robin, Multilevel Queue.</li><li><b>Producer–Consumer</b> – a bounded buffer with empty / full / mutex semaphores.</li><li><b>Banker's Algorithm</b> – safety check and resource-request algorithm.</li><li><b>Memory Management</b> – First/Best/Worst Fit, Paging and Segmentation.</li></ul></div>`;
/* ================= click-to-edit handlers ================= */
EDF.cp = (a, v) => {
  const [i, k] = a.split(":"),
    p = CP[+i];
  if (k == "name") p.name = v || p.name;
  else if (k == "at" && v >= 0) p.at = Math.round(v);
  else if (k == "bt" && v >= 1) p.bt = Math.round(v);
  else if (k == "pr" && v >= 1) p.pr = Math.round(v);
  else toast("⚠ Invalid value (arrival ≥ 0, burst ≥ 1, priority ≥ 1)");
  cpuT();
};
EDF.rm = (a, v) => {
  const D = RS.d,
    s = D.S.find((x) => x.roll == a);
  if (v >= 0 && v <= 100) {
    s.m = Math.round(v);
    D.pass = D.A.filter((x) => x.m >= 40).length;
    D.sc = Array(10).fill(0);
    D.A.forEach((x) => D.sc[Math.min(9, Math.floor(x.m / 10))]++);
    D.avg = D.A.reduce((t, x) => t + x.m, 0) / D.A.length;
    D.sorted = [...D.A].sort((x, y) => y.m - x.m);
  } else toast("⚠ Marks must be 0–100");
  RS.render();
};
/* ================= ROUTER ================= */
const PAGES = {
  dash: [
    "🏠",
    "Dashboard",
    dashH,
    () => {
      dashR();
      $$("[data-go]").forEach((b) => (b.onclick = () => go(b.dataset.go)));
    },
  ],
  cpu: ["🖥️", "CPU Scheduling", cpuH, cpuI],
  pc: ["🗄️", "Producer–Consumer", pcH, pcI],
  bank: ["🛡️", "Banker's Algorithm", bH, bI],
  mem: ["🗃️", "Memory Management", memH, memI],
  res: ["📊", "Results & Analytics", rsH, rsI],
  about: ["ℹ️", "About", aboutH, () => {}],
};
Object.entries(PAGES).forEach(([k, v]) => {
  const b = document.createElement("button");
  b.innerHTML = `<span>${v[0]}</span>${v[1]}`;
  b.dataset.p = k;
  b.onclick = () => go(k);
  $("#nav").append(b);
});
function go(p) {
  page = p;
  $$("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.p == p));
  const v = $("#view");
  v.style.animation = "none";
  v.offsetWidth;
  v.style.animation = "";
  v.innerHTML = PAGES[p][2]();
  v.scrollTop = 0;
  PAGES[p][3]();
}
$("#burger").onclick = () => document.body.classList.toggle("hide");
setInterval(() => {
  const d = new Date();
  $("#clock").innerHTML =
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    "<br>" +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (page == "dash") dashR();
}, 1000);
pcReset();
pcStart();
memInit();
ev("ExamOS started", "#22c55e");
go("dash");
