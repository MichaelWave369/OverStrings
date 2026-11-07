import test from "node:test";
import assert from "node:assert/strict";
import {createPhiOSCompanion,PHIPOSE_NAV_PROTOCOL} from "../phipose-phi-transport.mjs";

test("PhiOS transport needs explicit popup, exact source/origin and host-issued session",()=>{
  const original=globalThis.window;
  let onMessage=null;const requests=[],messages=[],statuses=[];
  const popup={closed:false,postMessage(value,origin){requests.push({value,origin});}};
  const fake={
    location:{origin:"https://example.test",href:"https://example.test/OverStrings/"},
    open(url,name){assert.equal(url,"https://example.test/PhiOS/");assert.equal(name,"phios-gesture-companion");return popup;},
    addEventListener(event,fn){assert.equal(event,"message");onMessage=fn;}
  };
  globalThis.window=fake;
  try {
    const bridge=createPhiOSCompanion({onStatus:x=>statuses.push(x),onReceipt:x=>messages.push(x)});
    const intent={
      schema:"overstrings.phipose.intent.v0.1",version:1,
      advisory:true,action_authority:false,execution_authority:false,
      action_id:"phios.view.home",source:"synthetic",program:"L:open > R:pinch",
      sequence:1,timestamp_ms:1234,private_joint_data:["never_send"]
    };
    assert.equal(bridge.send(intent),false);
    assert.equal(bridge.open(),true);
    const ready={protocol:PHIPOSE_NAV_PROTOCOL,type:"ready",session_id:"test-session-01234567890123",
      expires_at:Date.now()+60000};
    onMessage({source:{},origin:"https://example.test",data:ready});
    assert.equal(bridge.isConnected(),false);
    onMessage({source:popup,origin:"https://malicious.test",data:ready});
    assert.equal(bridge.isConnected(),false);
    onMessage({source:popup,origin:"https://example.test",data:ready});
    assert.equal(bridge.isConnected(),true);
    assert.equal(bridge.send(intent),true);
    assert.equal(requests.length,1);
    assert.equal(requests[0].origin,"https://example.test");
    assert.equal(requests[0].value.protocol,PHIPOSE_NAV_PROTOCOL);
    assert.equal(requests[0].value.intent.private_joint_data,undefined);
    assert.equal(requests[0].value.intent.action_id,"phios.view.home");
    onMessage({source:popup,origin:"https://example.test",data:{
      protocol:PHIPOSE_NAV_PROTOCOL,type:"receipt",accepted:true,
      status:"accepted_for_ui_dispatch",action_id:"phios.view.home"
    }});
    assert.equal(messages.length,1);
    bridge.disconnect();assert.equal(bridge.isConnected(),false);
    assert.equal(bridge.send(intent),false);
    assert.ok(statuses.length>=3);
  } finally {
    if(original===undefined)delete globalThis.window;
    else globalThis.window=original;
  }
});
test("PhiOS transport never sends unapproved external actions",()=>{
  const original=globalThis.window;
  let onMessage=null;const sent=[],popup={closed:false,postMessage:v=>sent.push(v)};
  globalThis.window={
    location:{origin:"https://example.test",href:"https://example.test/OverStrings/"},
    addEventListener:(_,fn)=>{onMessage=fn;},open:()=>popup
  };
  try{
    const bridge=createPhiOSCompanion();
    bridge.open();
    onMessage({source:popup,origin:"https://example.test",data:{
      protocol:PHIPOSE_NAV_PROTOCOL,type:"ready",session_id:"session-012345678901234567",
      expires_at:Date.now()+60000
    }});
    assert.equal(bridge.send({schema:"overstrings.phipose.intent.v0.1",
      advisory:true,action_authority:false,execution_authority:false,
      source:"webxr",program:"L:open > R:pinch",sequence:1,timestamp_ms:1,
      action_id:"phios.system.power"}),false);
    assert.equal(sent.length,0);
  }finally{
    if(original===undefined)delete globalThis.window;
    else globalThis.window=original;
  }
});
