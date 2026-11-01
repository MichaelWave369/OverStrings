import test from "node:test";
import assert from "node:assert/strict";
import {parseMotionText,validateMotionRecord,compareMotions} from "../phrases.mjs";
const convention="wrist delta meters; tips relative to wrist divided by palm width";
function clip({label="Liquid arc",source="synthetic",direction=1,speed=1,mode="arc",hand="left"}={}) {
  const frames=[];
  const count=42;
  for(let i=0;i<count;i++) {
    const t=i/(count-1),angle=direction*t*Math.PI*2;
    const wrist=mode==="arc"?
      [0.13*Math.cos(angle)-.13,0.13*Math.sin(angle),0]:
      [t*.36,t*.025,0];
    const fingertips={
      "index-finger-tip":[.2+0.15*Math.cos(angle),1.6,0],
      "middle-finger-tip":[.4,1.6,0]
    };
    frames.push({t_ms:Math.round(i*70*speed),
      hands:{left:hand==="left"?{wrist_m:wrist,fingertips_palm_units:fingertips}:null,
        right:hand==="right"?{wrist_m:wrist,fingertips_palm_units:fingertips}:null}});
  }
  return {schema:"overstrings.motion.v1",version:1,label,source,
    coordinate_convention:convention,sample_interval_ms:70,duration_ms:frames.at(-1).t_ms,
    frames};
}
test("valid local recordings import and normalize allowed fields",()=>{
  const result=parseMotionText(JSON.stringify(clip()));
  assert.equal(result.frames.length,42);
  assert.equal(result.source,"synthetic");
  assert.equal(result.frames[1].hands.right,null);
  assert.equal(result.frames[0].hands.left.wrist_m.length,3);
});
test("rejects oversized, malformed, NaN/infinite, invalid source and timing",()=>{
  assert.throws(()=>parseMotionText("x".repeat(250001)),/250 KB/);
  assert.throws(()=>parseMotionText("{oops"),/JSON/);
  assert.throws(()=>validateMotionRecord({...clip(),source:"remote"}),/Unsupported/);
  const a=clip();a.frames[3].hands.left.wrist_m[1]=Infinity;
  assert.throws(()=>validateMotionRecord(a),/coordinates/);
  const b=clip();b.frames[1].t_ms=0;
  assert.throws(()=>validateMotionRecord(b),/unsorted/);
  const c=clip();c.frames[5].hands.left.fingertips_palm_units.evil=[0,0,0];
  assert.throws(()=>validateMotionRecord(c),/Unknown/);
});
test("similar independently sampled paths match, reversed path does not",()=>{
  const a=clip(),b=clip({label:"Liquid take 2",speed:1.18}),c=clip({direction:-1,label:"Opposite direction"});
  const similar=compareMotions(a,b);
  assert.equal(similar.matched,true);
  assert.equal(similar.reason,"similar");
  const opposite=compareMotions(a,c);
  assert.equal(opposite.matched,false);
  assert.equal(opposite.reason,"different");
});
test("hand identity, source and duration safeguards",()=>{
  const a=clip(),right=clip({hand:"right"}),live=clip({source:"webxr"});
  assert.equal(compareMotions(a,right).reason,"hand_coverage_mismatch");
  assert.equal(compareMotions(a,live).reason,"source_mismatch");
  assert.equal(compareMotions(a,clip({speed:2.5})).reason,"duration_mismatch");
});
test("no silent static pose matching or invalid threshold",()=>{
  const a=clip({mode:"static"});
  for(const f of a.frames)f.hands.left.wrist_m=[0,0,0];
  const result=compareMotions(a,a);
  assert.equal(result.matched,false);
  assert.equal(result.reason,"too_little_motion");
  assert.throws(()=>compareMotions(clip(),clip(),{threshold:2}),/threshold/);
});
