import test from "node:test";
import assert from "node:assert/strict";
import {recognizeGesture,GestureTracker,toResonancePayload,JOINT_NAMES} from "../gesture.mjs";
function hand({extended=["index-finger","middle-finger","ring-finger","pinky-finger"],pinch=false}={}) {
  const j={wrist:{x:0,y:0,z:0},"thumb-tip":{x:-.10,y:.095,z:0}};
  for(const [i,f] of ["index-finger","middle-finger","ring-finger","pinky-finger"].entries()) {
    const x=-.03+i*.02;
    j[f+"-metacarpal"]={x,y:.02,z:0};
    j[f+"-phalanx-proximal"]={x,y:.052,z:0};
    j[f+"-tip"]={x,y:extended.includes(f)?.11:.033,z:0};
  }
  if(pinch) j["thumb-tip"]={...j["index-finger-tip"]};
  return j;
}
test("all 25 XRHand joints named",()=>{
  assert.equal(JOINT_NAMES.length,25);
  assert.equal(new Set(JOINT_NAMES).size,25);
});
test("heuristic hand shapes",()=>{
  assert.equal(recognizeGesture(hand()),"open");
  assert.equal(recognizeGesture(hand({pinch:true})),"pinch");
  assert.equal(recognizeGesture(hand({extended:["index-finger"]})),"point");
  assert.equal(recognizeGesture(hand({extended:[]})),"grab");
});
test("missing and invalid joints never produce events",()=>{
  assert.equal(recognizeGesture(null),"unknown");
  assert.equal(recognizeGesture({wrist:{x:0,y:0,z:0}}),"unknown");
  const j=hand();j["pinky-finger-metacarpal"]={x:NaN,y:0,z:0};
  assert.equal(recognizeGesture(j),"unknown");
});
test("debounce, tracking loss and recovery",()=>{
  const t=new GestureTracker({dwellMs:90,lostMs:150}),h=hand();
  assert.deepEqual(t.update("left",h,0),[]);
  const start=t.update("left",h,95);
  assert.equal(start.length,1);
  assert.equal(start[0].phase,"start");
  assert.deepEqual(t.update("left",h,100),[]);
  assert.deepEqual(t.update("left",null,190),[]);
  assert.equal(t.update("left",null,260)[0].phase,"lost");
  assert.deepEqual(t.update("left",null,420),[]);
  assert.deepEqual(t.update("left",h,430),[]);
  assert.equal(t.update("left",h,525)[0].phase,"start");
});
test("neutral clears action, end never maps a preset",()=>{
  const t=new GestureTracker({dwellMs:50});
  t.update("right",hand(),0);t.update("right",hand(),51);
  const neutral=hand({extended:["index-finger","middle-finger"]});
  t.update("right",neutral,60);
  const e=t.update("right",neutral,120);
  assert.equal(e[0].phase,"end");
  assert.equal(toResonancePayload(e[0]),null);
});
test("safe mock payload matches Rust bridge fields, no raw vectors",()=>{
  const e={version:1,type:"overstrings.gesture",id:"osg-1",source:"webxr",
    handedness:"right",gesture:"pinch",phase:"start",timestamp_ms:10};
  const p=toResonancePayload(e);
  assert.equal(p.preset_family_hint,"spiral_invoke");
  assert.equal(p.transport_class,"mock");
  assert.equal(p.fallback_state,"none");
  assert.equal("joints" in p,false);
  const lost=toResonancePayload({...e,phase:"lost"});
  assert.equal(lost.preset_family_hint,"recovery_baseline");
  assert.equal(lost.intensity_class,"low");
  assert.equal(lost.degraded_used,true);
  assert.equal(toResonancePayload({...e,phase:"end"}),null);
});
