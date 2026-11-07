import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPhiOfficeDeckCompanion,PHIPOSE_DECK_PROTOCOL
} from '../phipose-office-transport.mjs';

const valid=(action_id='phioffice.page.next')=>({
  schema:'overstrings.phipose.intent.v0.1',version:1,
  advisory:true,action_authority:false,execution_authority:false,
  action_id,source:'synthetic',program:'L:point > R:swipe-right',
  sequence:1,timestamp_ms:1000,private_joint_data:[42]
});
test('PhiOffice companion needs explicit same-origin popup and host-issued session',()=>{
  const prior=globalThis.window;
  const sent=[],receipts=[],statuses=[];
  let onMessage=null;
  const popup={closed:false,postMessage:(value,origin)=>sent.push({value,origin})};
  globalThis.window={
    location:{origin:'https://example.test',href:'https://example.test/OverStrings/'},
    open:(url,name)=>{assert.equal(url,'https://example.test/phioffice369/');assert.equal(name,'phipose-office-deck-companion');return popup;},
    addEventListener:(name,fn)=>{assert.equal(name,'message');onMessage=fn;}
  };
  try{
    const bridge=createPhiOfficeDeckCompanion({
      onStatus:status=>statuses.push(status),
      onReceipt:receipt=>receipts.push(receipt)
    });
    assert.equal(bridge.send(valid()),false);
    assert.equal(bridge.open(),true);
    const ready={protocol:PHIPOSE_DECK_PROTOCOL,type:'ready',
      session_id:'e5117dde-37ad-43fd-aeae-66f001ff35b3',
      expires_at:Date.now()+30000};
    onMessage({source:popup,origin:'https://evil.test',data:ready});
    onMessage({source:{},origin:'https://example.test',data:ready});
    assert.equal(bridge.isConnected(),false);
    onMessage({source:popup,origin:'https://example.test',data:ready});
    assert.equal(bridge.isConnected(),true);
    assert.equal(bridge.send(valid()),true);
    assert.equal(sent.length,1);
    assert.equal(sent[0].origin,'https://example.test');
    assert.equal(sent[0].value.protocol,PHIPOSE_DECK_PROTOCOL);
    assert.equal(sent[0].value.intent.private_joint_data,undefined);
    assert.equal(Object.keys(sent[0].value.intent).length,9);
    assert.equal(sent[0].value.intent.action_id,'phioffice.page.next');
    onMessage({source:popup,origin:'https://example.test',data:{
      protocol:PHIPOSE_DECK_PROTOCOL,type:'receipt',accepted:true,
      status:'accepted_for_ui_dispatch',action_id:'phioffice.page.next'
    }});
    assert.equal(receipts.length,1);
    bridge.disconnect();
    assert.equal(bridge.isConnected(),false);
    assert.equal(bridge.send(valid()),false);
    assert.ok(statuses.length>2);
  }finally{if(prior===undefined)delete globalThis.window;else globalThis.window=prior;}
});

test('PhiOffice sender is independent of PhiOS and denies all non-slide commands',()=>{
  const prior=globalThis.window;
  const sent=[];
  let onMessage=null;
  const popup={closed:false,postMessage:(value)=>sent.push(value)};
  globalThis.window={
    location:{origin:'https://example.test',href:'https://example.test/OverStrings/'},
    open:()=>popup,addEventListener:(_,fn)=>{onMessage=fn;}
  };
  try{
    const bridge=createPhiOfficeDeckCompanion();
    bridge.open();
    onMessage({source:popup,origin:'https://example.test',data:{
      protocol:PHIPOSE_DECK_PROTOCOL,type:'ready',
      session_id:'07cc5e67-6cbf-4f6a-8c22-b4b71994852b',expires_at:Date.now()+30000
    }});
    for(const action_id of [
      'phioffice.file.save','phioffice.palette.open','phioffice.file.delete',
      'phios.view.home','genewrist.tool.next','__proto__'
    ])assert.equal(bridge.send(valid(action_id)),false);
    assert.equal(bridge.send({...valid(),execution_authority:true}),false);
    assert.equal(bridge.send({...valid(),source:'camera'}),false);
    assert.equal(sent.length,0);
    assert.equal(bridge.send(valid('phioffice.page.previous')),true);
    assert.equal(sent.length,1);
  }finally{if(prior===undefined)delete globalThis.window;else globalThis.window=prior;}
});
