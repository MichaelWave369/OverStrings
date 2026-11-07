import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPhiOfficeDeckCompanion,PHIPOSE_DECK_PROTOCOL,PHIPOSE_EDITOR_PROTOCOL
} from '../phipose-office-transport.mjs';
import {BUILTIN_VOCABULARIES} from '../phipose-vocabulary.mjs';

const intent=(id,sequence=1)=>({
  schema:'overstrings.phipose.intent.v0.1',version:1,advisory:true,
  action_authority:false,execution_authority:false,action_id:id,source:'synthetic',
  program:'L:open > R:point',sequence,timestamp_ms:1000
});
const uuid='e5117dde-37ad-43fd-aeae-66f001ff35b3';
test('one PhiOffice popup binds to host-approved deck OR editor protocol, never both',()=>{
  const previous=globalThis.window;
  const sent=[],statuses=[];
  let receive;
  const popup={closed:false,postMessage:(message,origin)=>sent.push({message,origin})};
  globalThis.window={
    location:{origin:'https://example.test',href:'https://example.test/OverStrings/'},
    open:()=>popup,
    addEventListener:(type,fn)=>{assert.equal(type,'message');receive=fn;}
  };
  try{
    const bridge=createPhiOfficeDeckCompanion({onStatus:s=>statuses.push(s)});
    bridge.open();
    receive({source:popup,origin:'https://example.test',data:{
      protocol:PHIPOSE_EDITOR_PROTOCOL,type:'ready',
      session_id:uuid,expires_at:Date.now()+60000
    }});
    assert.equal(bridge.isConnected(),true);
    assert.equal(bridge.send(intent('phioffice.write.section.next')),true);
    assert.equal(bridge.send(intent('phioffice.grid.cell.previous',2)),true);
    assert.equal(bridge.send(intent('phioffice.page.next',3)),false);
    assert.equal(bridge.send(intent('phioffice.file.delete',4)),false);
    assert.equal(sent.length,2);
    assert.equal(sent[0].message.protocol,PHIPOSE_EDITOR_PROTOCOL);
    assert.equal(Object.hasOwn(sent[0].message.intent,'joints'),false);

    // Changing editors creates a newly approved session and protocol.
    receive({source:popup,origin:'https://example.test',data:{
      protocol:PHIPOSE_DECK_PROTOCOL,type:'ready',
      session_id:uuid,expires_at:Date.now()+60000
    }});
    assert.equal(bridge.send(intent('phioffice.write.section.next',5)),false);
    assert.equal(bridge.send(intent('phioffice.page.next',6)),true);
    assert.equal(sent.at(-1).message.protocol,PHIPOSE_DECK_PROTOCOL);
    bridge.disconnect();
    assert.equal(bridge.isConnected(),false);
  }finally{
    if(previous===undefined)delete globalThis.window;
    else globalThis.window=previous;
  }
});
test('only reviewed built-in PhiOffice commands are mapped to active editor hosts',()=>{
  const vocab=BUILTIN_VOCABULARIES.find(v=>v.app_id==='phioffice');
  for(const id of [
    'phioffice.write.section.next','phioffice.write.section.previous',
    'phioffice.grid.cell.next','phioffice.grid.cell.previous'
  ]){
    const cmd=vocab.commands.find(x=>x.id===id);
    assert.ok(cmd,id);
    assert.equal(cmd.mode,'preview_only'); // manifest alone still grants nothing
  }
  assert.equal(vocab.commands.length,7);
  assert.equal(vocab.commands.find(x=>x.id==='phioffice.palette.open').mode,'preview_only');
});
