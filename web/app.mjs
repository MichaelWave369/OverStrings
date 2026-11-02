import {GestureTracker,toResonancePayload} from "./gesture.mjs";
import {startHandXR} from "./xr-runtime.mjs";
import {setupStudio} from "./studio.mjs";
import {setupPractice} from "./practice.mjs";
import {setupHostSimulator} from "./host-simulator.mjs";
const el=id=>document.getElementById(id);
const tracker=new GestureTracker();
const studio=setupStudio(tracker);
setupPractice(()=>studio.getTemplateMeta());
setupHostSimulator();
let xr=null, lastDisplay=0, sequence=0;
function log(message) {
  const line=document.createElement("li");
  line.textContent=message;
  el("events").prepend(line);
  while(el("events").children.length>12)el("events").lastChild.remove();
}
function emit(evt) {
  window.dispatchEvent(new CustomEvent("overstrings:gesture",{detail:evt}));
  const payload=toResonancePayload(evt);
  if(payload) {
    window.dispatchEvent(new CustomEvent("overstrings:resonance-payload",{detail:payload}));
    el("payload").textContent=JSON.stringify(payload,null,2);
    el("family").textContent=payload.preset_family_hint;
  }
  log(evt.source.toUpperCase()+" | "+evt.handedness+" | "+evt.gesture+
    " / "+evt.phase+(payload?" → "+payload.preset_family_hint:""));
}
function updateFrame(sources,time) {
  studio.onFrame(sources,time);
  for(const hand of ["left","right"]) {
    for(const evt of tracker.update(hand,sources[hand],time))emit(evt);
  }
  if(time-lastDisplay<90)return;
  lastDisplay=time;
  for(const hand of ["left","right"]) {
    el(hand+"-status").textContent=sources[hand]?
      tracker.active(hand)+" · live joints":"not tracked";
  }
}
async function start() {
  if(xr)return;
  el("start").disabled=true;
  try {
    xr=await startHandXR({
      onFrame:updateFrame,
      onEnd:()=>{
        studio.onSessionEnd();
        xr=null;tracker.reset();el("start").disabled=false;
        el("stop").disabled=true;el("mode").textContent="Headset session ended";
        el("left-status").textContent="inactive";
        el("right-status").textContent="inactive";
      }
    });
    el("stop").disabled=false;
    el("mode").textContent="Live WebXR; only actual tracked joints count.";
    log("WebXR session started. Move both hands into headset view.");
  } catch(e) {
    el("start").disabled=false;
    el("mode").textContent=String(e.message||e);
    log("XR error: "+String(e.message||e));
  }
}
el("start").addEventListener("click",start);
el("stop").addEventListener("click",()=>xr?.end());
for(const button of document.querySelectorAll("[data-sim]")) {
  button.addEventListener("click",()=>{
    emit({version:1,type:"overstrings.gesture",id:"osg-demo-"+(++sequence),
      source:"synthetic",handedness:"right",gesture:button.dataset.sim,
      phase:"start",timestamp_ms:Math.round(performance.now())});
    el("mode").textContent="SYNTHETIC TEST ONLY. No headset tracking claimed.";
  });
}
el("mode").textContent=window.isSecureContext?
  "Ready. Quest Browser and headset hand tracking required for real joints.":
  "This demo requires a secure HTTPS context.";
window.addEventListener("overstrings:resonance-payload",e=>{
  // A local JSON preview. No live Rust process or network transport is present.
  el("bridge").textContent="Local mock preview · "+e.detail.transport_class;
});
