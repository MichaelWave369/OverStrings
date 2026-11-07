import test from "node:test";
import assert from "node:assert/strict";
import {parsePhiPose,serializePhiPose,PhiPoseInterpreter,PHIPOSE_ACTIONS} from "../phipose.mjs";
import {WristMotionTokenizer} from "../wrist-motion.mjs";

const gesture=(hand,symbol,t,source="webxr")=>({
  type:symbol.startsWith("swipe-")?"overstrings.motion":"overstrings.gesture",
  version:1,handedness:hand,gesture:symbol,phase:"start",source,timestamp_ms:t
});
const fresh=(source="webxr",script="L:open > R:pinch")=>{
  const p=new PhiPoseInterpreter();
  p.configure({script,actionId:"phios.view.research",source,
    allowSyntheticDemo:source==="synthetic"});
  return p;
};

test("grammar recognizes left/right, phrases, two-handed chords and motion verbs",()=>{
  const p=parsePhiPose(" R:pinch + L:open > L:swipe-left > R:point ");
  assert.equal(p.steps.length,3);
  assert.equal(serializePhiPose(p),"L:open+R:pinch > L:swipe-left > R:point");
  assert.equal(Object.isFrozen(p),true);
  assert.equal(Object.isFrozen(p.steps[0]),true);
  assert.equal(new Set(Object.keys(PHIPOSE_ACTIONS)).size,5);
});
test("grammar rejects malformed, unbounded, and ambiguous phrases",()=>{
  for(const phrase of ["", "L:open", "L:unknown > R:pinch",
    "L:open + L:point > R:pinch","L:open+R:point+R:grab > L:open",
    "L:open >> R:pinch","L:open > R:pinch > L:open > R:point > L:open > R:pinch",
    "L:open > R:PINCH","left:open > R:pinch","L:open > R:pinch > eval()"]){
      assert.throws(()=>parsePhiPose(phrase),SyntaxError,phrase);
  }
});
test("disarmed and unconfigured interpreters cannot issue commands",()=>{
  const p=new PhiPoseInterpreter();
  assert.equal(p.arm().armed,false);
  assert.equal(p.consume(gesture("left","open",0),0).reason,"not_armed");
  assert.throws(()=>p.configure({script:"L:open > R:pinch",actionId:"shell.exec"}),TypeError);
  assert.throws(()=>p.configure({script:"L:open > R:pinch",actionId:"__proto__"}),TypeError);
});
test("one deliberately armed phrase yields a zero-authority advisory, then disarms",()=>{
  const p=fresh();assert.equal(p.arm().armed,true);
  assert.equal(p.consume(gesture("left","open",1000),1000).reason,"step_completed");
  const result=p.consume(gesture("right","pinch",1500),1500);
  assert.equal(result.accepted,true);
  assert.equal(result.intent.action_id,"phios.view.research");
  assert.equal(result.intent.action_authority,false);
  assert.equal(result.intent.execution_authority,false);
  assert.equal(result.intent.advisory,true);
  assert.equal(result.intent.program,"L:open > R:pinch");
  assert.equal("joints" in result.intent,false);
  assert.equal("sessionId" in result.intent,false);
  assert.equal(Object.isFrozen(result.intent),true);
  assert.equal(p.consume(gesture("right","pinch",1600),1600).reason,"not_armed");
});
test("chords work in either order but do not accept duplicate or late hands",()=>{
  const p=fresh("webxr","L:open+R:pinch > L:point");p.arm();
  assert.equal(p.consume(gesture("right","pinch",100),100).reason,"awaiting_chord");
  assert.equal(p.consume(gesture("right","pinch",101),101).reason,"duplicate_symbol");
  assert.equal(p.consume(gesture("left","open",300),300).reason,"step_completed");
  assert.equal(p.consume(gesture("left","point",450),450).accepted,true);
  p.arm();
  p.consume(gesture("left","open",1500),1500);
  assert.equal(p.consume(gesture("right","pinch",2000),2000).reason,"chord_expired");
});
test("synthetic input is separately opt-in and source-bound",()=>{
  const p=new PhiPoseInterpreter();
  p.configure({script:"L:open > R:pinch",actionId:"phios.view.home",source:"synthetic"});
  assert.equal(p.arm().reason,"synthetic_disabled");
  p.configure({script:"L:open > R:pinch",actionId:"phios.view.home",source:"synthetic",allowSyntheticDemo:true});
  p.arm();
  assert.equal(p.consume(gesture("left","open",100,"webxr"),100).reason,"source_denied");
  assert.equal(p.armed,false);
  p.arm();
  assert.equal(p.consume(gesture("left","open",300,"synthetic"),300).reason,"step_completed");
  assert.equal(p.consume(gesture("right","pinch",400,"synthetic"),400).accepted,true);
});
test("stale, unexpected, malformed, expired, and tracking-loss states fail closed",()=>{
  for(const [evt,now,expected] of [
    [gesture("left","open",1),1000,"stale_event"],
    [gesture("right","grab",1000),1000,"unexpected_symbol"],
    [{...gesture("left","open",1000),version:2},1000,"invalid_event"],
    [{...gesture("left","open",1000),gesture:"swipe-left"},1000,"invalid_event"]
  ]){
    const p=fresh();p.arm();
    assert.equal(p.consume(evt,now).reason,expected);
    assert.equal(p.armed,false);
  }
  const p=fresh();p.arm();p.consume(gesture("left","open",1000),1000);
  assert.equal(p.consume(gesture("right","pinch",4000),4000).reason,"phrase_expired");
  p.arm();p.consume(gesture("left","open",5000),5000);
  p.trackingLost();assert.equal(p.armed,false);
});
test("one-shot, cooldown and reconfiguration do not replay a prior consent",()=>{
  const p=fresh();
  p.arm();p.consume(gesture("left","open",100),100);
  assert.equal(p.consume(gesture("right","pinch",250),250).accepted,true);
  p.arm();p.consume(gesture("left","open",500),500);
  assert.equal(p.consume(gesture("right","pinch",600),600).reason,"cooldown");
  assert.equal(p.armed,false);
  p.arm();p.consume(gesture("left","open",1700),1700);
  assert.equal(p.consume(gesture("right","pinch",1800),1800).accepted,true);
  p.configure({script:"R:open > L:grab",actionId:"phios.command.open",source:"webxr"});
  assert.equal(p.armed,false);
});
test("wrist tokenizer ignores missing, wrong pose, small or off-axis movement",()=>{
  const t=new WristMotionTokenizer();
  const pos=(x,y=0,z=0)=>({wrist:{x,y,z}});
  assert.deepEqual(t.update("right",pos(0),0,"neutral"),[]);
  assert.deepEqual(t.update("right",pos(0),100,"open"),[]);
  assert.deepEqual(t.update("right",pos(.05),300,"open"),[]);
  assert.deepEqual(t.update("right",pos(.20,.20),400,"open"),[]);
  assert.deepEqual(t.update("right",null,500,"open"),[]);
});
test("wrist tokenizer emits bounded right and left swipe tokens once",()=>{
  const t=new WristMotionTokenizer();
  const pos=x=>({wrist:{x,y:0,z:-.2}});
  assert.deepEqual(t.update("left",pos(0),0,"open"),[]);
  assert.deepEqual(t.update("left",pos(.05),100,"open"),[]);
  const right=t.update("left",pos(.18),200,"open");
  assert.equal(right.length,1);
  assert.equal(right[0].gesture,"swipe-right");
  assert.equal(right[0].handedness,"left");
  assert.equal(right[0].source,"webxr");
  assert.equal(t.update("left",pos(.24),300,"open").length,0);
  t.reset();
  t.update("right",pos(.4),1000,"point");
  assert.equal(t.update("right",pos(.18),1200,"point")[0].gesture,"swipe-left");
});
test("wrist tokenizer does not accept invalid calibration",()=>{
  assert.throws(()=>new WristMotionTokenizer({minTravelM:-1}),RangeError);
  assert.throws(()=>new WristMotionTokenizer({axisRatio:1}),RangeError);
  assert.throws(()=>new WristMotionTokenizer({maxDurationMs:40}),RangeError);
});
