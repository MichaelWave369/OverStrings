import test from "node:test";
import assert from "node:assert/strict";
import {ActionIntentGate,ACTIONS} from "../action-gateway.mjs";
const good={version:1,type:"overstrings.phrase-comparison",manual:true,
  template_label:"Liquid Sequence 01",source:"webxr",matched:true,score:.14,reason:"similar"};
function configured(options={}) {
  const gate=new ActionIntentGate(options);
  gate.configure({templateLabel:"Liquid Sequence 01",actionId:"spark.cast",source:"webxr"});
  return gate;
}
test("known preview targets are explicitly enumerable and immutable",()=>{
  assert.deepEqual(Object.keys(ACTIONS).sort(),[
    "btm.interact","domistika.stroke","genewrist.open","spark.cast"
  ]);
  assert.equal(Object.isFrozen(ACTIONS),true);
});
test("no intent without configuration and explicit arming",()=>{
  const g=new ActionIntentGate();
  assert.equal(g.arm().armed,false);
  assert.equal(g.consume(good,1000).reason,"not_armed");
  assert.throws(()=>g.configure({templateLabel:"x",actionId:"exec",source:"webxr"}),/allowlisted/);
});
test("valid manual comparison yields a one-shot advisory-only intent",()=>{
  const g=configured();
  assert.equal(g.consume(good,1000).reason,"not_armed");
  assert.equal(g.arm().armed,true);
  const r=g.consume(good,1000);
  assert.equal(r.accepted,true);
  assert.equal(r.intent.action_id,"spark.cast");
  assert.equal(r.intent.mode,"practice");
  assert.equal(r.intent.advisory,true);
  assert.equal(r.intent.source,"webxr");
  assert.equal("frames" in r.intent,false);
  assert.equal(g.consume(good,1200).reason,"not_armed");
});
test("rearming immediately does not defeat cooldown",()=>{
  const g=configured({cooldownMs:1200});
  g.arm();assert.equal(g.consume(good,1000).accepted,true);
  g.arm();assert.equal(g.consume(good,1500).reason,"cooldown");
  g.arm();assert.equal(g.consume(good,2300).accepted,true);
});
test("tampered, mismatched, malformed and non-matches fail closed",()=>{
  const cases=[
    {...good,manual:false},{...good,source:"synthetic"},
    {...good,template_label:"Somebody else's phrase"},
    {...good,matched:false},
    {...good,score:.4},{...good,score:Infinity},
    {...good,reason:"different"}, {...good,score:-.1},
    {...good,type:"fake.phrase"}
  ];
  for(const candidate of cases) {
    const g=configured();g.arm();
    assert.equal(g.consume(candidate,1000).accepted,false);
    assert.equal(g.armed,false);
  }
});
test("synthetic examples require separate explicit sandbox opt-in",()=>{
  const g=new ActionIntentGate();
  g.configure({templateLabel:"Liquid Sequence 01",actionId:"domistika.stroke",
    source:"synthetic",allowSyntheticDemo:false});
  assert.equal(g.arm().reason,"synthetic_demo_disabled");
  g.configure({templateLabel:"Liquid Sequence 01",actionId:"domistika.stroke",
    source:"synthetic",allowSyntheticDemo:true});
  g.arm();
  const r=g.consume({...good,source:"synthetic"},1000);
  assert.equal(r.accepted,true);
  assert.equal(r.intent.action_id,"domistika.stroke");
  assert.equal(r.intent.mode,"practice");
});
test("changing the action configuration invalidates arming",()=>{
  const g=configured();g.arm();
  g.configure({templateLabel:"Liquid Sequence 01",
    actionId:"btm.interact",source:"webxr"});
  assert.equal(g.consume(good,1000).reason,"not_armed");
});
test("invalid gate limits and absent timing reject actions",()=>{
  assert.throws(()=>new ActionIntentGate({cooldownMs:0}),/limits/);
  assert.throws(()=>new ActionIntentGate({maxScore:1}),/limits/);
  const g=configured();g.arm();
  assert.equal(g.consume(good,NaN).reason,"invalid_time");
});
