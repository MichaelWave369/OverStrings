import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDomistikaCompanion,DOMISTIKA_PHIPOSE_ACTIONS,
  DOMISTIKA_PHIPOSE_PROTOCOL
} from '../phipose-domistika-transport.mjs';
import {BUILTIN_VOCABULARIES} from '../phipose-vocabulary.mjs';
const uuid='c89d0bc1-81c1-49dc-b3c6-bfaed39cb5ef';
const intent=(id='domistika.room.canvas',sequence=1)=>({
  schema:'overstrings.phipose.intent.v0.1',version:1,advisory:true,
  action_authority:false,execution_authority:false,action_id:id,
  source:'synthetic',program:'L:point > R:open',
  sequence,timestamp_ms:450,rawJoints:['private']
});
test('Domistika only sends reviewed UI names and minimal pose intent fields',()=>{
  const prior=globalThis.window;
  let receive;
  const sent=[],statuses=[],receipts=[];
  const popup={closed:false,postMessage:(data,origin)=>sent.push({data,origin})};
  globalThis.window={
    location:{origin:'https://example.test',href:'https://example.test/OverStrings/'},
    open:(url,name)=>{
      assert.equal(url,'https://example.test/Domistika/xr.html');
      assert.equal(name,'phipose-domistika-xr-companion');
      return popup;
    },
    addEventListener:(name,fn)=>{assert.equal(name,'message');receive=fn;}
  };
  try{
    const bridge=createDomistikaCompanion({
      onStatus:text=>statuses.push(text),
      onReceipt:value=>receipts.push(value)
    });
    assert.equal(bridge.send(intent()),false);
    assert.equal(bridge.open(),true);
    const ready={protocol:DOMISTIKA_PHIPOSE_PROTOCOL,type:'ready',
      session_id:uuid,expires_at:Date.now()+60000};
    receive({source:{},origin:'https://example.test',data:ready});
    receive({source:popup,origin:'https://evil.test',data:ready});
    assert.equal(bridge.isConnected(),false);
    receive({source:popup,origin:'https://example.test',data:ready});
    assert.equal(bridge.isConnected(),true);
    assert.equal(bridge.send(intent()),true);
    assert.equal(sent.length,1);
    assert.equal(sent[0].origin,'https://example.test');
    assert.equal(sent[0].data.protocol,DOMISTIKA_PHIPOSE_PROTOCOL);
    assert.equal(sent[0].data.intent.rawJoints,undefined);
    assert.equal(Object.keys(sent[0].data.intent).length,10);
    assert.equal(sent[0].data.intent.action_id,'domistika.room.canvas');
    receive({source:popup,origin:'https://example.test',data:{
      protocol:DOMISTIKA_PHIPOSE_PROTOCOL,type:'receipt',
      accepted:true,reason:'accepted_for_ui_dispatch',action_id:'domistika.room.canvas'
    }});
    assert.equal(receipts.length,1);
    bridge.disconnect();assert.equal(bridge.isConnected(),false);
    assert.equal(bridge.send(intent()),false);
    assert.ok(statuses.length>2);
  }finally{if(prior===undefined)delete globalThis.window;else globalThis.window=prior;}
});
test('Domistika sender denies destructive/foreign actions and altered authority',()=>{
  const prior=globalThis.window;
  let receive;const sent=[];
  const popup={closed:false,postMessage:value=>sent.push(value)};
  globalThis.window={
    location:{origin:'https://example.test',href:'https://example.test/OverStrings/'},
    addEventListener:(_,fn)=>{receive=fn;},open:()=>popup
  };
  try{
    const bridge=createDomistikaCompanion();bridge.open();
    receive({source:popup,origin:'https://example.test',data:{
      protocol:DOMISTIKA_PHIPOSE_PROTOCOL,type:'ready',
      session_id:uuid,expires_at:Date.now()+60000
    }});
    for(const id of ['domistika.scene.save','domistika.canvas.erase',
      'domistika.palette.open','domistika.stroke.paint','domistika.object.delete',
      'phios.command.open','phioffice.file.save','constructor'])
      assert.equal(bridge.send(intent(id)),false,id);
    assert.equal(bridge.send({...intent(),execution_authority:true}),false);
    assert.equal(bridge.send({...intent(),source:'camera'}),false);
    assert.equal(sent.length,0);
    assert.equal(bridge.send(intent('domistika.brush.next')),true);
    assert.equal(sent.length,1);
  }finally{if(prior===undefined)delete globalThis.window;else globalThis.window=prior;}
});
test('Domistika built-in vocabulary remains preview-only until independently enabled by host',()=>{
  const vocab=BUILTIN_VOCABULARIES.find(x=>x.app_id==='domistika');
  assert.ok(vocab);
  assert.equal(vocab.provenance,'bundled_reviewed_reference');
  for(const id of DOMISTIKA_PHIPOSE_ACTIONS){
    const command=vocab.commands.find(x=>x.id===id);
    assert.ok(command,id);
    assert.equal(command.mode,'preview_only');
  }
  assert.equal(vocab.commands.find(c=>c.id==='domistika.palette.open').mode,'preview_only');
  assert.equal(vocab.commands.length,8);
});
