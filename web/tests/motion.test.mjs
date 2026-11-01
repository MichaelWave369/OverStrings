import test from "node:test";
import assert from "node:assert/strict";
import {MotionRecorder} from "../motion.mjs";
function hand(dx=0) {
  const j={wrist:{x:dx,y:0,z:0}};
  for(const [i,f] of ["index-finger","middle-finger","ring-finger","pinky-finger"].entries()) {
    const x=dx + i*.02-.03;
    j[f+"-metacarpal"]={x,y:.02,z:0};
    j[f+"-tip"]={x,y:.11,z:0};
  }
  j["thumb-tip"]={x:dx-.03,y:.1,z:0};
  return j;
}
test("recording requires explicit arming and actual samples",()=>{
  const m=new MotionRecorder({durationMs:1000});
  assert.equal(m.ingest({left:hand()},0),false);
  m.arm();
  assert.equal(m.ingest({left:null,right:null},0),false);
  assert.equal(m.state,"armed");
  assert.equal(m.ingest({left:hand()},20),true);
  assert.equal(m.state,"recording");
  assert.equal(m.frames[0].t_ms,0);
  assert.equal(m.ingest({left:hand()},30),false);
});
test("bounded relative motion, dropout and explicit export",()=>{
  const m=new MotionRecorder({durationMs:1000,sampleIntervalMs:70});
  m.arm("webxr");
  m.ingest({left:hand()},0);
  m.ingest({left:hand(.1)},80);
  m.ingest({left:null,right:null},160);
  m.ingest({left:hand(.2)},240);
  m.stop();
  const data=JSON.parse(m.exportJSON("Liquid phrase"));
  assert.equal(data.frames.length,4);
  assert.equal(data.frames[1].hands.left.wrist_m[0],.1);
  assert.equal(data.frames[2].hands.left,null);
  assert.equal(data.frames[3].hands.left.wrist_m[0],.2);
  assert.equal(data.label,"Liquid phrase");
  assert.equal(JSON.stringify(data).includes("origin"),false);
  assert.equal(data.source,"webxr");
});
test("duration cap, no silent reset, clear and rearm",()=>{
  const m=new MotionRecorder({durationMs:1000});
  m.arm("synthetic");
  m.ingest({right:hand()},0);
  assert.equal(m.ingest({right:hand()},1050),false);
  assert.equal(m.state,"complete");
  assert.throws(()=>m.arm(),/Clear/);
  m.clear();
  assert.throws(()=>m.exportJSON(),/No completed/);
  m.arm();
  assert.equal(m.state,"armed");
});
test("invalid sources and timestamps cannot create samples",()=>{
  const m=new MotionRecorder({durationMs:1000});
  assert.throws(()=>m.arm("network"),/source/);
  m.arm();
  assert.equal(m.ingest({left:hand()},Infinity),false);
  assert.equal(m.frames.length,0);
  m.ingest({left:hand()},40);
  assert.equal(m.ingest({left:hand()},-1),false);
  assert.equal(m.frames.length,1);
});
