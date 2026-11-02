import test from "node:test";
import assert from "node:assert/strict";
import {HostPreviewAdapter,HOST_ACTIONS} from "../host-sdk.mjs";
const intent={
  schema:"overstrings.action-intent.v1",version:1,
  advisory:true,mode:"practice",
  action_id:"spark.cast",template_label:"Liquid Sequence 01",
  source:"webxr",sequence:1,timestamp_ms:1000
};
const setup=(options={})=>{
  const previews=[];
  const a=new HostPreviewAdapter({onPreview:p=>previews.push(p),...options});
  a.configure({hostId:"spark",source:"webxr"});
  return {a,previews};
};
test("known hosts map only to their preview action IDs",()=>{
  assert.deepEqual(Object.keys(HOST_ACTIONS).sort(),["btm","domistika","genewrist","spark"]);
  assert.equal(HOST_ACTIONS.spark.includes("spark.cast"),true);
  assert.equal(HOST_ACTIONS.spark.includes("btm.interact"),false);
  assert.equal(Object.isFrozen(HOST_ACTIONS.spark),true);
});
test("preview requires explicit local opt-in and disarms after use",()=>{
  const {a,previews}=setup();
  assert.equal(a.accept(intent,1010).reason,"not_armed");
  assert.equal(a.arm().armed,true);
  assert.equal(a.accept(intent,1010).accepted,true);
  assert.equal(previews.length,1);
  assert.equal(previews[0].host_id,"spark");
  assert.equal(previews[0].action_id,"spark.cast");
  assert.equal(Object.isFrozen(previews[0]),true);
  assert.equal("timestamp_ms" in previews[0],false);
  assert.equal(a.accept(intent,1020).reason,"not_armed");
});
test("wrong host and forged intent are denied without callback",()=>{
  const cases=[
    {...intent,action_id:"btm.interact"},
    {...intent,mode:"control"},
    {...intent,advisory:false},
    {...intent,source:"synthetic"},
    {...intent,action_id:"shell.exec"},
    {...intent,timestamp_ms:NaN},
    {...intent,sequence:0},
    {...intent,template_label:""},
    {...intent,version:2}
  ];
  for(const item of cases){
    const {a,previews}=setup();a.arm();
    assert.equal(a.accept(item,1010).accepted,false);
    assert.equal(a.armed,false);
    assert.equal(previews.length,0);
  }
});
test("old and future events rejected",()=>{
  for(const when of [1000,5000]) {
    const {a,previews}=setup({maxAgeMs:500,maxFutureMs:50});
    a.arm();
    assert.equal(a.accept({...intent,timestamp_ms:when},2000).reason,"stale_or_future_intent");
    assert.equal(previews.length,0);
  }
});
test("replay detection and cooldown apply across armings",()=>{
  const {a,previews}=setup({cooldownMs:1000});
  a.arm();assert.equal(a.accept(intent,1010).accepted,true);
  a.arm();assert.equal(a.accept(intent,2400).reason,"replay_or_reordered");
  a.arm();assert.equal(a.accept({...intent,sequence:2,timestamp_ms:1500},1510).reason,"cooldown");
  a.arm();assert.equal(a.accept({...intent,sequence:3,timestamp_ms:2510},2510).accepted,true);
  assert.equal(previews.length,2);
});
test("synthetic source requires explicit separate opt-in",()=>{
  const {a,previews}=setup();
  a.configure({hostId:"spark",source:"synthetic"});
  assert.equal(a.arm().reason,"synthetic_disabled");
  a.configure({hostId:"spark",source:"synthetic",allowSyntheticDemo:true});
  assert.equal(a.arm().armed,true);
  const result=a.accept({...intent,source:"synthetic"},1010);
  assert.equal(result.accepted,true);
  assert.equal(previews[0].source,"synthetic");
});
test("configuration changes revoke pending arming",()=>{
  const {a}=setup();a.arm();
  a.configure({hostId:"btm",source:"webxr"});
  assert.equal(a.accept({...intent,action_id:"btm.interact"},1010).reason,"not_armed");
  assert.throws(()=>a.configure({hostId:"unknown",source:"webxr"}),/Unknown/);
  assert.equal(a.armed,false);
});
test("callback errors do not cause second execution",()=>{
  let calls=0;
  const a=new HostPreviewAdapter({onPreview:()=>{calls++;throw Error("fail");}});
  a.configure({hostId:"spark",source:"webxr"});a.arm();
  assert.equal(a.accept(intent,1000).reason,"preview_callback_error");
  assert.equal(a.accept(intent,1020).reason,"not_armed");
  assert.equal(calls,1);
});
test("insecure timing/callback configuration is refused",()=>{
  assert.throws(()=>new HostPreviewAdapter(),/required/);
  assert.throws(()=>new HostPreviewAdapter({onPreview:()=>{},maxAgeMs:Infinity}),/limits/);
  assert.throws(()=>new HostPreviewAdapter({onPreview:()=>{},maxFutureMs:999}),/limits/);
});
