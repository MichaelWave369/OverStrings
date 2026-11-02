/**
 * OverStrings Rung 4 browser practice sandbox.
 * No game integration, no networking, no auto arming. MIT License.
 */
import {ActionIntentGate,ACTIONS} from "./action-gateway.mjs";
const el=id=>document.getElementById(id);
export function setupPractice(getTemplateMeta) {
  const gate=new ActionIntentGate();
  let armedMeta=null;
  function status(message) {el("practice-status").textContent=message;}
  function sync() {
    el("practice-arm").disabled=gate.armed;
    el("practice-disarm").disabled=!gate.armed;
  }
  function addLine(message) {
    const li=document.createElement("li");
    li.textContent=message;
    el("practice-events").prepend(li);
    while(el("practice-events").children.length>8)el("practice-events").lastChild.remove();
  }
  function disarm(message="Practice intent preview disarmed.") {
    gate.disarm();armedMeta=null;sync();status(message);
  }
  for(const [actionId,label] of Object.entries(ACTIONS)) {
    const option=document.createElement("option");
    option.value=actionId;option.textContent=label;
    el("practice-target").append(option);
  }
  function settingsChanged() {
    if(gate.armed)disarm("Action or demo setting changed. Re-arm to approve the updated target.");
  }
  el("practice-target").addEventListener("change",settingsChanged);
  el("practice-synthetic").addEventListener("change",settingsChanged);
  el("practice-arm").addEventListener("click",()=>{
    const meta=getTemplateMeta();
    if(!meta) {
      status("Teach or import a reference phrase first. Nothing has been armed.");
      return;
    }
    try {
      gate.configure({
        templateLabel:meta.label,source:meta.source,
        actionId:el("practice-target").value,
        allowSyntheticDemo:el("practice-synthetic").checked
      });
      const result=gate.arm();
      if(!result.armed) {
        status("Not armed: "+result.reason+". Synthetic clips require the separate demo checkbox.");
        return;
      }
      armedMeta={...meta};
      status("One-shot armed for "+meta.source+" phrase '"+meta.label+
        "'. Click Compare with reference to preview an action intent.");
      addLine("ARMED: "+meta.label+" → "+el("practice-target").value);
      sync();
    } catch(e) {
      disarm("Cannot arm: "+String(e.message||e));
    }
  });
  el("practice-disarm").addEventListener("click",()=>disarm());
  window.addEventListener("overstrings:phrase-comparison",event=>{
    if(!gate.armed)return;
    const meta=getTemplateMeta();
    if(!meta||!armedMeta||meta.revision!==armedMeta.revision||
       meta.label!==armedMeta.label||meta.source!==armedMeta.source) {
      disarm("Reference changed or cleared. Re-arm explicitly.");
      return;
    }
    const result=gate.consume(event.detail,performance.now());
    armedMeta=null;
    sync();
    if(!result.accepted) {
      status("NO ACTION: "+result.reason+". Re-arm to try again.");
      addLine("REJECTED: "+result.reason);
      return;
    }
    // Only an untrusted local advisory event. Games must independently
    // authenticate/authorize inputs; never directly mutate gameplay here.
    window.dispatchEvent(new CustomEvent("overstrings:action-intent",{detail:result.intent}));
    status("ADVISORY ONLY: "+ACTIONS[result.intent.action_id]+
      ". This preview does not control Spark, BTM, Domistika or Gen.E.Wrist.");
    addLine("PREVIEW: "+result.intent.action_id+" ("+result.intent.source+
      ", #"+result.intent.sequence+")");
  });
  sync();
  return {disarm};
}
