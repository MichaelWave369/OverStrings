/**
 * Browser UI for explicit local gesture calibration and motion phrase capture.
 * Only sensitivity sliders can be saved to localStorage (by user click).
 * Motion samples are held in memory and downloaded only on explicit request.
 * MIT License.
 */
import {defaultProfile,validateProfile} from "./calibration.mjs";
import {MotionRecorder} from "./motion.mjs";
import {parseMotionText,compareMotions} from "./phrases.mjs";
const get = id => document.getElementById(id);
const SETTINGS_KEY = "overstrings.gesture.profile.v1";
function loadCalibration() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw || raw.length > 2048) return defaultProfile();
    return validateProfile(JSON.parse(raw));
  } catch {
    return defaultProfile();
  }
}
function syntheticHand(x,y,reverse=1) {
  const wrist={x,y,z:-0.4}, hand={wrist};
  for(const [i,f] of ["index-finger","middle-finger","ring-finger","pinky-finger"].entries()) {
    const fingerX=x+reverse*(i*.02-.03);
    hand[f+"-metacarpal"]={x:fingerX,y:y+.02,z:-.4};
    hand[f+"-tip"]={x:fingerX,y:y+.10,z:-.4};
  }
  hand["thumb-tip"]={x:x-reverse*.045,y:y+.08,z:-.4};
  return hand;
}
function paintPreview(recorder) {
  const canvas=get("motion-preview"),ctx=canvas.getContext("2d");
  const width=canvas.width,height=canvas.height;
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle="#070f20";ctx.fillRect(0,0,width,height);
  ctx.strokeStyle="#1e3853";ctx.lineWidth=1;
  for(let i=0;i<=8;i++) {
    ctx.beginPath();ctx.moveTo(width*i/8,0);ctx.lineTo(width*i/8,height);ctx.stroke();
  }
  for(let i=0;i<=4;i++) {
    ctx.beginPath();ctx.moveTo(0,height*i/4);ctx.lineTo(width,height*i/4);ctx.stroke();
  }
  const pts=recorder.frames.flatMap(f=>["left","right"].flatMap(hand=>{
    const wrist=f.hands[hand]?.wrist_m;
    return wrist ? [{hand,x:wrist[0],y:wrist[1]}] : [];
  }));
  if(!pts.length)return;
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  const midX=(Math.min(...xs)+Math.max(...xs))/2;
  const midY=(Math.min(...ys)+Math.max(...ys))/2;
  const span=Math.max(.12,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  const scale=Math.min((width-50)/span,(height-50)/span);
  for(const hand of ["left","right"]) {
    ctx.strokeStyle=hand==="left"?"#76daff":"#ffad76";
    ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=3;
    let previous=false;
    for(const f of recorder.frames) {
      const wrist=f.hands[hand]?.wrist_m;
      if(!wrist) {previous=false;continue;}
      const x=width/2+(wrist[0]-midX)*scale,y=height/2-(wrist[1]-midY)*scale;
      if(previous) {ctx.lineTo(x,y);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(x,y);previous=true;
      ctx.fillRect(x-2,y-2,4,4);
    }
  }
}
export function setupStudio(tracker) {
  let profile=loadCalibration();
  tracker.setProfile(profile);
  const recorder=new MotionRecorder();
  let previousState="idle",lastPaintTime=-Infinity,template=null,templateSignature=null;
  function syncCalibration() {
    const hand=get("cal-hand").value;
    get("cal-pinch").value=String(profile[hand].pinchRatio);
    get("cal-extension").value=String(profile[hand].extensionRatio);
    get("cal-dwell").value=String(profile.dwellMs);
    get("cal-loss").value=String(profile.lostMs);
    get("cal-pinch-value").textContent=profile[hand].pinchRatio.toFixed(2);
    get("cal-extension-value").textContent=profile[hand].extensionRatio.toFixed(2);
    get("cal-dwell-value").textContent=String(profile.dwellMs)+" ms";
    get("cal-loss-value").textContent=String(profile.lostMs)+" ms";
  }
  get("cal-hand").addEventListener("change",syncCalibration);
  for(const id of ["cal-pinch","cal-extension","cal-dwell","cal-loss"]) {
    get(id).addEventListener("input",()=>{
      const hand=get("cal-hand").value;
      try {
        profile=validateProfile({
          ...profile,
          [hand]: {
            pinchRatio:Number(get("cal-pinch").value),
            extensionRatio:Number(get("cal-extension").value)
          },
          dwellMs:Number(get("cal-dwell").value),
          lostMs:Number(get("cal-loss").value)
        });
        tracker.setProfile(profile);
        get("cal-status").textContent="Unsaved adjustment. Only sensitivity changed, not headset sensor accuracy.";
      } catch(e) {
        get("cal-status").textContent=String(e.message || e);
      }
      syncCalibration();
    });
  }
  get("cal-save").addEventListener("click",()=>{
    try {
      localStorage.setItem(SETTINGS_KEY,JSON.stringify(profile));
      get("cal-status").textContent="Sensitivity profile saved in this browser only.";
    } catch {
      get("cal-status").textContent="Browser blocked local storage. Settings are session-only.";
    }
  });
  get("cal-reset").addEventListener("click",()=>{
    profile=defaultProfile();
    tracker.setProfile(profile);
    try {localStorage.removeItem(SETTINGS_KEY);} catch {}
    syncCalibration();
    get("cal-status").textContent="Factory sensitivity restored; saved profile cleared where allowed.";
  });
  syncCalibration();

  function syncPhrases() {
    const complete=recorder.state==="complete";
    get("learn-phrase").disabled=!complete;
    get("compare-phrase").disabled=!complete||!template;
    get("clear-phrase").disabled=!template;
    get("phrase-template").textContent=template ?
      template.label+" ("+template.source+", "+template.frames.length+" frames)" :
      "No phrase template loaded. Use a completed recording or import JSON.";
  }
  function syncRecorder(forcePaint=false) {
    const state=recorder.state;
    get("arm-motion").disabled=state!=="idle";
    get("synthetic-motion").disabled=state!=="idle";
    get("synthetic-motion-similar").disabled=state!=="idle";
    get("synthetic-motion-reverse").disabled=state!=="idle";
    get("stop-motion").disabled=state!=="armed"&&state!=="recording";
    get("download-motion").disabled=state!=="complete";
    get("clear-motion").disabled=state==="idle";
    const message={
      idle:"Idle. Arm before entering immersive VR; nothing is recorded by default.",
      armed:"Armed. Recording starts only when Quest provides a valid tracked hand.",
      recording:"Recording locally: "+recorder.frames.length+" samples (maximum 20 seconds / 300 frames).",
      complete:"Completed: "+recorder.frames.length+" samples. Export JSON explicitly or clear it."
    }[state];
    get("motion-status").textContent=message;
    if(forcePaint||state!==previousState)paintPreview(recorder);
    previousState=state;
    syncPhrases();
  }
  get("arm-motion").addEventListener("click",()=>{
    recorder.arm("webxr");syncRecorder(true);
  });
  get("stop-motion").addEventListener("click",()=>{
    recorder.stop();syncRecorder(true);
  });
  get("clear-motion").addEventListener("click",()=>{
    recorder.clear();syncRecorder(true);
  });
  function makeSynthetic(variant) {
    recorder.arm("synthetic");
    for(let i=0;i<40;i++) {
      const t=i/39;
      const phase=(variant==="reverse"?-1:1)*t*Math.PI*2;
      const wobble=variant==="similar"?.004*Math.sin(t*6*Math.PI):0;
      recorder.ingest({
        left:syntheticHand(-.16+Math.sin(phase)*.14+wobble,.10+Math.cos(phase)*.08,1),
        right:syntheticHand(.16+Math.sin(phase+1)*.1+wobble,.12+Math.cos(phase+1)*.09,-1)
      },i*70);
    }
    recorder.stop();syncRecorder(true);
  }
  get("synthetic-motion").addEventListener("click",()=>makeSynthetic("original"));
  get("synthetic-motion-similar").addEventListener("click",()=>makeSynthetic("similar"));
  get("synthetic-motion-reverse").addEventListener("click",()=>makeSynthetic("reverse"));
  get("download-motion").addEventListener("click",()=>{
    try {
      const data=recorder.exportJSON(get("motion-label").value);
      const blob=new Blob([data],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");
      link.href=url;
      const name=(get("motion-label").value||"gesture").replace(/[^a-z0-9_-]+/gi,"-").slice(0,40)||"gesture";
      link.download="overstrings-"+name+"-motion.json";
      link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      get("motion-status").textContent="Export initiated locally. Recording remains in memory until cleared.";
    } catch(e) {
      get("motion-status").textContent=String(e.message||e);
    }
  });
  get("learn-phrase").addEventListener("click",()=>{
    try {
      template=parseMotionText(recorder.exportJSON(get("motion-label").value));
      templateSignature=JSON.stringify(template.frames);
      get("phrase-result").textContent="Reference captured in memory. Clear this recording and make another attempt before comparing.";
      syncPhrases();
    } catch(e) {
      get("phrase-result").textContent="Reference not set: "+String(e.message||e);
    }
  });
  get("phrase-file").addEventListener("change",async(event)=>{
    const file=event.target.files?.[0];
    if(!file)return;
    try {
      if(file.size>250000)throw new RangeError("File exceeds 250 KB limit");
      const imported=parseMotionText(await file.text());
      template=imported;templateSignature=JSON.stringify(imported.frames);
      get("phrase-result").textContent="Imported "+imported.source+" reference into memory. No upload or persistent storage.";
    } catch(e) {
      get("phrase-result").textContent="Import rejected: "+String(e.message||e);
    } finally {
      event.target.value="";syncPhrases();
    }
  });
  get("clear-phrase").addEventListener("click",()=>{
    template=null;templateSignature=null;
    get("phrase-result").textContent="Reference discarded from memory.";
    syncPhrases();
  });
  get("compare-phrase").addEventListener("click",()=>{
    if(!template||recorder.state!=="complete")return;
    try {
      const candidate=parseMotionText(recorder.exportJSON(get("motion-label").value));
      if(JSON.stringify(candidate.frames)===templateSignature) {
        get("phrase-result").textContent="Same data as reference. Make a second independent recording; self-comparison proves nothing.";
        return;
      }
      const result=compareMotions(template,candidate);
      const details=result.score===null?result.reason:
        "distance "+result.score.toFixed(4)+" (lower is closer; uncalibrated threshold "+result.threshold+")";
      get("phrase-result").textContent=(result.matched?"SIMILAR MOTION: ":"NO MATCH: ")+details+
        ". This is experimental sequence comparison, not a probability.";
      window.dispatchEvent(new CustomEvent("overstrings:phrase-comparison",{
        detail:{version:1,type:"overstrings.phrase-comparison",manual:true,
          template_label:result.template_label,source:candidate.source,
          matched:result.matched,score:result.score,reason:result.reason}
      }));
    } catch(e) {
      get("phrase-result").textContent="Cannot compare: "+String(e.message||e);
    }
  });
  syncRecorder(true);
  return {
    onFrame(sources,time) {
      if(recorder.source==="webxr" && ["armed","recording"].includes(recorder.state)) {
        recorder.ingest(sources,time);
        if(time-lastPaintTime>180 || recorder.state!==previousState) {
          lastPaintTime=time;syncRecorder(true);
        }
      }
    },
    onSessionEnd() {
      if(recorder.source==="webxr"&&["armed","recording"].includes(recorder.state)) {
        recorder.stop();
      }
      syncRecorder(true);
    }
  };
}
