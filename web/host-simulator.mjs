/**
 * Rung 5 same-page host preview studio. No actual games are controlled.
 * All state in memory; explicit opt-in; no network. MIT License.
 */
import {HostPreviewAdapter,HOST_ACTIONS,HOST_LABELS} from "./host-sdk.mjs";
const el=id=>document.getElementById(id);

export function setupHostSimulator() {
  let accepted=0;
  const adapter=new HostPreviewAdapter({onPreview:preview=>{
    accepted++;
    const stage=el("host-stage");
    stage.className="host-stage "+preview.host_id;
    const visuals={
      spark:["✧","Spell spark simulated"],
      btm:["▣","Door interaction simulated"],
      domistika:["✎","Paint stroke simulated"],
      genewrist:["Φ","Tool window simulated"]
    };
    const [symbol,message]=visuals[preview.host_id];
    el("host-symbol").textContent=symbol;
    el("host-result").textContent=message+" · preview #"+accepted;
    addLine("SIMULATED "+preview.action_id+" ("+preview.source+")");
  }});
  function addLine(message) {
    const li=document.createElement("li");
    li.textContent=message;
    el("host-events").prepend(li);
    while(el("host-events").children.length>8)el("host-events").lastChild.remove();
  }
  function status(message) {el("host-status").textContent=message;}
  function refresh() {
    el("host-enable").disabled=adapter.armed;
    el("host-disable").disabled=!adapter.armed;
  }
  function disable(reason="Host preview disarmed.") {
    adapter.disarm();
    status(reason);
    refresh();
  }
  for(const id of Object.keys(HOST_ACTIONS)) {
    const item=document.createElement("option");
    item.value=id;
    item.textContent=HOST_LABELS[id];
    el("host-target").append(item);
  }
  el("host-enable").addEventListener("click",()=>{
    try {
      adapter.configure({
        hostId:el("host-target").value,
        source:el("host-source").value,
        allowSyntheticDemo:el("host-synthetic").checked
      });
      const answer=adapter.arm();
      if(!answer.armed) {
        status("NOT ARMED: "+answer.reason+". Synthetic clips need their own explicit checkbox.");
        refresh();return;
      }
      status("One host preview armed for "+HOST_LABELS[el("host-target").value]+
        ". Complete a matching Rung 4 action-intent to run the harmless simulator.");
      addLine("ARMED: "+el("host-target").value+" / "+el("host-source").value);
      refresh();
    } catch(e) {
      disable("Host settings rejected: "+String(e.message||e));
    }
  });
  el("host-disable").addEventListener("click",()=>disable());
  for(const id of ["host-target","host-source","host-synthetic"]) {
    el(id).addEventListener("change",()=>{
      if(adapter.armed)disable("Host setting changed. Re-enable the one-shot preview.");
    });
  }
  window.addEventListener("overstrings:action-intent",event=>{
    if(!adapter.armed)return;
    const result=adapter.accept(event.detail,performance.now());
    refresh();
    if(!result.accepted) {
      addLine("REJECTED: "+result.reason);
      status("NO HOST PREVIEW: "+result.reason+". Re-enable to try again.");
      return;
    }
    status("LOCAL SIMULATOR ONLY: "+HOST_LABELS[result.preview.host_id]+
      " accepted one advisory action. No real game was contacted.");
  });
  refresh();
}
