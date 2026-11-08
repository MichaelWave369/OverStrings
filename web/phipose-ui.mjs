import {PhiPoseInterpreter,serializePhiPose} from "./phipose.mjs";
import {BUILTIN_VOCABULARIES,getVocabulary,parseImportedVocabulary,registerPreviewVocabulary} from "./phipose-vocabulary.mjs";
import {WristMotionTokenizer} from "./wrist-motion.mjs";
import {createPhiOSCompanion} from "./phipose-phi-transport.mjs";
import {createPhiOfficeDeckCompanion} from "./phipose-office-transport.mjs";

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
      <label for="phipose-app">Active application vocabulary</label>
      <select id="phipose-app" aria-label="Application gesture vocabulary"></select>
      <label for="phipose-script">Gesture sentence</label>
      <input type="text" id="phipose-script" maxlength="140" value="L:open > R:pinch" spellcheck="false" autocomplete="off">
      <label for="phipose-action">Action in selected application</label>
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
      <label for="phipose-vocabulary-file">Import an app vocabulary (JSON, max 20 KB, preview only)</label>
      <input type="file" id="phipose-vocabulary-file" accept=".json,application/json">
      <p class="status" id="phipose-vocab-status" role="status">Bundled vocabularies are examples. Imported app commands cannot gain host permissions.</p>
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
        <button type="button" data-hand="left" data-gesture="pinch">L:pinch</button>
        <button type="button" data-hand="left" data-gesture="grab">L:grab</button>
        <button type="button" data-hand="right" data-gesture="point">R:point</button>
        <button type="button" data-hand="left" data-gesture="swipe-left">L:swipe-left</button>
        <button type="button" data-hand="left" data-gesture="swipe-right">L:swipe-right</button>
        <button type="button" data-hand="right" data-gesture="swipe-left">R:swipe-left</button>
        <button type="button" data-hand="right" data-gesture="swipe-right">R:swipe-right</button>
      </div>
      <p class="status" id="phipose-readout">Language symbols: open, pinch, grab, point, swipe-left, swipe-right.</p>
      <pre id="phipose-output">No intent emitted. PhiOS navigation requires a separate approved companion; other app commands are previews.</pre>
      <div class="actions compact">
        <button type="button" id="phipose-open-phios">Open PhiOS companion</button>
        <button type="button" id="phipose-disconnect-phios">Disconnect companion</button>
      </div>
      <p id="phipose-link-status" class="status" role="status" aria-live="polite">No PhiOS connection. Host permission is separate and disabled by default.</p>
      <div class="actions compact">
        <button type="button" id="phipose-open-office">Open PhiOffice companion</button>
        <button type="button" id="phipose-disconnect-office">Disconnect PhiOffice</button>
      </div>
      <p id="phipose-office-status" class="status" role="status" aria-live="polite">PhiOffice navigation disabled. Open a PhiDeck, PhiWrite or PhiGrid file and enable its host separately.</p>
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
  const office=createPhiOfficeDeckCompanion({
    onStatus:message=>{get("phipose-office-status").textContent=message;},
    onReceipt:receipt=>{
      get("phipose-office-status").textContent=receipt.accepted?
        "PhiOffice accepted slide navigation for UI dispatch: "+String(receipt.action_id):
        "PhiOffice denied: "+String(receipt.reason);
    }
  });
  get("phipose-open-office").addEventListener("click",()=>office.open());
  get("phipose-disconnect-office").addEventListener("click",()=>office.disconnect());
  let engine=new PhiPoseInterpreter();
  const motion=new WristMotionTokenizer();
  const select=get("phipose-action"),scope=get("phipose-app");
  let catalog=[...BUILTIN_VOCABULARIES],selectedSource="webxr";
  const status=(text)=>{get("phipose-status").textContent=text;};
  const disarm=()=>{engine.disarm();motion.reset();status("Disarmed. No gestures can emit requests.");};
  function fillScopes(){
    scope.replaceChildren();
    for(const vocabulary of catalog){
      const option=document.createElement("option");
      option.value=vocabulary.app_id;
      option.textContent=vocabulary.title+" · "+(vocabulary.app_id==="phios"?"UI navigation":"Preview only");
      scope.append(option);
    }
  }
  function fillCommands(preferredId=null){
    const vocab=getVocabulary(catalog,scope.value);
    select.replaceChildren();
    if(!vocab)return;
    for(const command of vocab.commands){
      const option=document.createElement("option");
      option.value=command.id;
      const officeLive=scope.value==="phioffice"&&
        vocab.provenance==="bundled_reviewed_reference"&&
        ["phioffice.page.next","phioffice.page.previous",
          "phioffice.write.section.next","phioffice.write.section.previous",
          "phioffice.grid.cell.next","phioffice.grid.cell.previous"].includes(command.id);
      option.textContent=command.label+" · "+(command.mode==="shell_ui"?"PhiOS UI":
        officeLive?"PhiOffice UI (separate consent)":"Preview");
      select.append(option);
    }
    if(preferredId && vocab.commands.some(c=>c.id===preferredId))select.value=preferredId;
    loadSelectedCommand();
  }
  function loadSelectedCommand(){
    const vocab=getVocabulary(catalog,scope.value);
    const command=vocab?.commands.find(c=>c.id===select.value);
    if(command){
      get("phipose-script").value=command.script;
      const officeLive=scope.value==="phioffice"&&
        vocab.provenance==="bundled_reviewed_reference"&&
        ["phioffice.page.next","phioffice.page.previous",
          "phioffice.write.section.next","phioffice.write.section.previous",
          "phioffice.grid.cell.next","phioffice.grid.cell.previous"].includes(command.id);
      get("phipose-vocab-status").textContent=vocab.title+" v"+vocab.version+
        " · "+(command.mode==="shell_ui"?"PhiOS UI-only (separate permission required)":
          officeLive?"PhiOffice UI navigation; separate editor approval required":
          "Advisory preview only; not wired to this app");
    }
    disarm();
  }
  fillScopes();
  scope.value="phios";
  fillCommands("phios.view.research");
  scope.addEventListener("change",()=>fillCommands());
  select.addEventListener("change",loadSelectedCommand);
  get("phipose-vocabulary-file").addEventListener("change",async event=>{
    const file=event.currentTarget.files?.[0];
    event.currentTarget.value="";
    if(!file)return;
    disarm();
    try{
      if(file.size>20000)throw new RangeError("Import larger than 20 KB");
      const vocab=parseImportedVocabulary(await file.text());
      catalog=registerPreviewVocabulary(catalog,vocab);
      fillScopes();scope.value=vocab.app_id;fillCommands();
      get("phipose-vocab-status").textContent="Imported "+vocab.title+
        " in memory for previews only. No host action or permission was granted.";
    }catch(err){
      get("phipose-vocab-status").textContent="Import refused: "+String(err.message||err);
    }
  });
  get("phipose-disarm").addEventListener("click",disarm);
  for(const id of ["phipose-script","phipose-source","phipose-demo"]){
    get(id).addEventListener("input",disarm);
    get(id).addEventListener("change",disarm);
  }
  get("phipose-arm").addEventListener("click",()=>{
    try {
      selectedSource=get("phipose-source").value;
      const vocab=getVocabulary(catalog,scope.value);
      if(!vocab || !vocab.commands.some(c=>c.id===select.value))
        throw new TypeError("Select a known app and action");
      // Custom application command IDs are advisory only; the separate
      // PhiOS receiver enforces its own fixed shell navigation allowlist.
      engine=new PhiPoseInterpreter({advisoryActionIds:vocab.commands.map(c=>c.id)});
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
      const vocabulary=getVocabulary(catalog,scope.value);
      const command=vocabulary?.commands.find(c=>c.id===intent.action_id);
      const officeLive=scope.value==="phioffice"&&
        vocabulary?.provenance==="bundled_reviewed_reference"&&
        ["phioffice.page.next","phioffice.page.previous",
          "phioffice.write.section.next","phioffice.write.section.previous",
          "phioffice.grid.cell.next","phioffice.grid.cell.previous"].includes(intent.action_id);
      status(command?.mode==="shell_ui" ?
        "Gesture recognized. PhiOS UI request only; host receipt required." :
        officeLive?"Gesture recognized. PhiOffice action requires its independently enabled host receipt." :
        "Gesture recognized for "+(vocabulary?.title||"app")+". Preview only; app did NOT execute.");
      window.dispatchEvent(new CustomEvent("overstrings:phipose-intent",{detail:intent}));
      // Only separately consented, independently allowlisted hosts may respond.
      if(scope.value==="phios" && command?.mode==="shell_ui" && companion.isConnected())
        companion.send(intent);
      if(officeLive && office.isConnected())office.send(intent);
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
