import {PhiPoseInterpreter,PHIPOSE_ACTIONS,serializePhiPose} from "./phipose.mjs";
import {WristMotionTokenizer} from "./wrist-motion.mjs";
import {createPhiOSCompanion} from "./phipose-phi-transport.mjs";

/**
 * Rung 7 visible practice studio. Opt-in per phrase, no host integration.
 * Same-origin CustomEvents and source strings are forgeable, not authenticated.
 */
export function setupPhiPoseUI() {
  const host=document.createElement("section");
  host.className="cards lower studio-section phipose-section";
  host.setAttribute("aria-label","Rung 7 gesture language practice studio");
  host.innerHTML=`
    <article>
      <p class="eyebrow">RUNG 7 · ΦPOSE LANGUAGE</p>
      <h3>Compose a gesture sentence</h3>
      <p>Write a gesture phrase using left (<code>L</code>) and right (<code>R</code>) hand poses.
      <code>&gt;</code> means then; <code>+</code> means two hands together.</p>
      <label for="phipose-script">Gesture sentence</label>
      <input type="text" id="phipose-script" maxlength="140" value="L:open > R:pinch" spellcheck="false" autocomplete="off">
      <label for="phipose-action">Advisory destination</label>
      <select id="phipose-action"></select>
      <label for="phipose-source">Expected input source</label>
      <select id="phipose-source">
        <option value="webxr">Actual WebXR joints</option>
        <option value="synthetic">Synthetic buttons (sandbox)</option>
      </select>
      <label class="practice-toggle" for="phipose-demo">
        <input type="checkbox" id="phipose-demo"> Allow synthetic practice input for this session
      </label>
      <div class="actions compact">
        <button type="button" class="primary" id="phipose-arm">Arm one gesture sentence</button>
        <button type="button" id="phipose-disarm">Disarm</button>
      </div>
      <p class="status" id="phipose-status" role="status" aria-live="polite">Not armed. No gesture sentence can trigger a command request.</p>
    </article>
    <article>
      <p class="eyebrow">PREVIEW · NO OS EXECUTION</p>
      <h3>Gesture tokens and safe request</h3>
      <p>Run a synthetic sequence using the buttons, or arm for WebXR before entering VR. Buttons are not physical hand observations.</p>
      <div class="actions compact" id="phipose-demo-buttons">
        <button type="button" data-hand="left" data-gesture="open">L:open</button>
        <button type="button" data-hand="left" data-gesture="point">L:point</button>
        <button type="button" data-hand="right" data-gesture="pinch">R:pinch</button>
        <button type="button" data-hand="right" data-gesture="open">R:open</button>
        <button type="button" data-hand="right" data-gesture="grab">R:grab</button>
        <button type="button" data-hand="left" data-gesture="swipe-left">L:swipe-left</button>
        <button type="button" data-hand="right" data-gesture="swipe-right">R:swipe-right</button>
      </div>
      <p class="status" id="phipose-readout">Language symbols: open, pinch, grab, point, swipe-left, swipe-right.</p>
      <pre id="phipose-output">No intent emitted. A recognized phrase cannot control PhiOS yet.</pre>
      <div class="actions compact">
        <button type="button" id="phipose-open-phios">Open PhiOS companion</button>
        <button type="button" id="phipose-disconnect-phios">Disconnect companion</button>
      </div>
      <p id="phipose-link-status" class="status" role="status" aria-live="polite">No PhiOS connection. Host permission is separate and disabled by default.</p>
      <p class="status">Same-origin messages do not grant security authority. PhiOS only accepts explicitly enabled, time-limited, safe shell navigation. Quest multiwindow/background behavior remains unverified.</p>
    </article>`;
  const footer=document.querySelector("footer");
  footer?.parentNode.insertBefore(host,footer);
  const get=id=>document.getElementById(id);
  const companion=createPhiOSCompanion({
    onStatus:message=>{get("phipose-link-status").textContent=message;},
    onReceipt:receipt=>{
      get("phipose-link-status").textContent=receipt.accepted?
        "PhiOS accepted for UI dispatch: "+String(receipt.action_id):
        "PhiOS denied: "+String(receipt.reason);
    }
  });
  get("phipose-open-phios").addEventListener("click",()=>companion.open());
  get("phipose-disconnect-phios").addEventListener("click",()=>companion.disconnect());
  const engine=new PhiPoseInterpreter();
  const motion=new WristMotionTokenizer();
  const select=get("phipose-action");
  for(const [id,label] of Object.entries(PHIPOSE_ACTIONS)){
    const option=document.createElement("option");option.value=id;option.textContent=label;
    select.append(option);
  }
  select.value="phios.view.research";
  let selectedSource="webxr";
  const status=(text)=>{get("phipose-status").textContent=text;};
  const disarm=()=>{engine.disarm();motion.reset();status("Disarmed. No gestures can emit requests.");};
  get("phipose-disarm").addEventListener("click",disarm);
  for(const id of ["phipose-script","phipose-action","phipose-source","phipose-demo"]){
    get(id).addEventListener("input",disarm);
    get(id).addEventListener("change",disarm);
  }
  get("phipose-arm").addEventListener("click",()=>{
    try {
      selectedSource=get("phipose-source").value;
      const parsed=engine.configure({script:get("phipose-script").value,
        actionId:select.value,source:selectedSource,
        allowSyntheticDemo:get("phipose-demo").checked});
      const armed=engine.arm();
      motion.reset();
      status(armed.armed ?
        "Armed for one sentence: "+serializePhiPose(parsed)+" ("+selectedSource+"). "+
        "Starts only on deliberate, recognized input." :
        "Not armed: "+armed.reason);
      get("phipose-output").textContent="No intent emitted.";
    }catch(error){status("Cannot arm: "+String(error.message||error));}
  });
  function onEvent(evt,nowMs=performance.now()){
    if(!engine.armed)return;
    // Ignore unrelated stream phases; a real tracking loss cancels a partial phrase.
    if(evt?.phase==="lost"){engine.trackingLost();status("Tracking lost: phrase cancelled.");return;}
    if(evt?.phase!=="start")return;
    const result=engine.consume(evt,nowMs);
    const symbol=(evt.handedness==="left"?"L":"R")+":"+evt.gesture;
    get("phipose-readout").textContent=symbol+" · "+result.reason;
    if(result.accepted){
      const intent=result.intent;
      get("phipose-output").textContent=JSON.stringify(intent,null,2);
      status("Sentence recognized. Advisory request only. Host execution has NOT occurred.");
      window.dispatchEvent(new CustomEvent("overstrings:phipose-intent",{detail:intent}));
      // Only a separately consented PhiOS popup can consume this advisory.
      if(companion.isConnected())companion.send(intent);
    }else if(["unexpected_symbol","source_denied","stale_event","phrase_expired","invalid_event","clock_invalid"].includes(result.reason)){
      status("Phrase cancelled: "+result.reason+". Re-arm explicitly.");
    }else if(result.reason==="step_completed"){
      status("Recognized step "+result.progress+". Continue the armed sentence.");
    }else if(result.reason==="awaiting_chord"){
      status("Waiting for other hand to complete chord.");
    }else if(result.reason==="cooldown"){
      status("Cooldown prevented a repeated request. Re-arm later.");
    }
  }
  for(const btn of host.querySelectorAll("[data-gesture]")){
    btn.addEventListener("click",()=>{
      const gesture=btn.dataset.gesture;
      const now=performance.now();
      onEvent({version:1,type:gesture.startsWith("swipe-")?"overstrings.motion":"overstrings.gesture",
        source:"synthetic",phase:"start",gesture,handedness:btn.dataset.hand,
        timestamp_ms:Math.round(now)},now);
    });
  }
  return {
    onEvent,
    onFrame(hands,time,tracker){
      if(!engine.armed || selectedSource!=="webxr")return;
      for(const hand of ["left","right"]){
        const gestures=motion.update(hand,hands[hand],time,tracker.active(hand),"webxr");
        for(const event of gestures)onEvent(event,time);
      }
    },
    onSessionEnd(){disarm();},
    isArmed(){return engine.armed;}
  };
}
