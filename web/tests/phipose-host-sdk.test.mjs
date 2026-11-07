import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PHIPOSE_HOST_SDK_VERSION, PHIPOSE_INTENT_SCHEMA,
  ScopedPhiPoseHost,validatePhiPoseSentence,validPhiPoseOrigin
} from '../../packages/phipose-host-sdk/index.mjs';

const source={};
const now=2_000_000;
const session='ad51330e-010e-4d9d-84c2-91967cc83cd2';
const protocol='domistika.gesture-nav.v0.1';
const intent=(actionId='domistika.view.next',seq=1,input='webxr')=>({
  schema:PHIPOSE_INTENT_SCHEMA,version:1,advisory:true,
  action_authority:false,execution_authority:false,
  action_id:actionId,source:input,program:'L:point > R:swipe-right',
  sequence:seq,timestamp_ms:1000
});
const packet=(i=intent(),sentAt=now)=>({
  protocol,type:'command',session_id:session,sent_at:sentAt,intent:i
});
const message=(data=packet(),win=source,origin='https://example.test')=>({
  data,source:win,origin
});
const open=({demo=false,guard=()=>null}={})=>{
  const host=new ScopedPhiPoseHost({
    appId:'domistika',protocol,actionIds:['domistika.view.next','domistika.view.previous'],
    guard
  });
  host.enable({source,origin:'https://example.test',sessionId:session,
    expiresAt:now+60_000,allowSyntheticDemo:demo},now);
  return host;
};

test('exported SDK is pure and requires explicit app-scoped action IDs',()=>{
  assert.equal(PHIPOSE_HOST_SDK_VERSION,'phipose.host-sdk.v0.1');
  const h=new ScopedPhiPoseHost({appId:'domistika',protocol,actionIds:['domistika.view.next']});
  assert.equal(h.active,false);
  assert.equal(h.accept(message(),now).reason,'disabled');
  assert.throws(()=>new ScopedPhiPoseHost({
    appId:'domistika',protocol,actionIds:['phios.system.execute']
  }),/Invalid scoped/);
  assert.throws(()=>new ScopedPhiPoseHost({
    appId:'domistika',protocol,actionIds:['domistika.view.next','domistika.view.next']
  }),/Invalid scoped/);
  assert.throws(()=>new ScopedPhiPoseHost({
    appId:'domistika',protocol,actionIds:['__proto__']
  }),/Invalid scoped/);
  assert.throws(()=>new ScopedPhiPoseHost({
    appId:'domistika',protocol,actionIds:['domistika.view.next'],cooldownMs:0
  }),/Invalid scoped/);
});

test('canonical language validates bounded gestures and rejects ambiguous chords',()=>{
  for(const phrase of [
    'L:open > R:pinch',
    'L:open+R:pinch > L:point',
    'L:point > R:swipe-right > L:grab'
  ])assert.equal(validatePhiPoseSentence(phrase),true,phrase);
  for(const phrase of [
    'L:open','L:open > R:pinch > L:open > R:grab > L:point > R:open',
    'L:open+L:point > R:grab','R:pinch+L:open > R:point',
    'L:open>R:pinch','L:open > R:pinch;eval(1)', 'L:open > R:unknown',
    'L:open + R:pinch > L:point',{},null
  ])assert.equal(validatePhiPoseSentence(phrase),false,String(phrase));
});

test('host only admits exact HTTPS or loopback development origins',()=>{
  for(const origin of ['https://example.test','http://localhost:5173','http://127.0.0.1:5173'])
    assert.equal(validPhiPoseOrigin(origin),true,origin);
  for(const origin of ['https://example.test/path','http://other.test','https://evil.test@trusted.test',
    'https://example.test/','*','','data:text/plain,hi'])
    assert.equal(validPhiPoseOrigin(origin),false,origin);
});

test('one enabled session accepts only its own source and exact context',()=>{
  const h=open();
  assert.equal(h.accept(message(undefined,{}),now).reason,'untrusted_source');
  assert.equal(h.accept(message(undefined,source,'https://other.test'),now).reason,'untrusted_source');
  const result=h.accept(message(),now);
  assert.equal(result.accepted,true);
  assert.equal(result.actionId,'domistika.view.next');
  assert.equal(result.execution_authority,false);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(h.accept(message(),now+1000).reason,'replay');
});

test('strict schemas prohibit app execution, arbitrary fields and authority escalation',()=>{
  for(const forbidden of [
    'domistika.file.delete','domistika.brush.write','phios.view.home',
    'constructor','domistika.__proto__'
  ])assert.equal(open().accept(message(packet(intent(forbidden))),now).reason,'invalid_intent');
  assert.equal(open().accept(message({...packet(),unknown:'foo'}),now).reason,'invalid_envelope');
  assert.equal(open().accept(message(packet({...intent(),credential:'secret'})),now).reason,'invalid_intent');
  assert.equal(open().accept(message(packet({...intent(),execution_authority:true})),now).reason,'invalid_intent');
  assert.equal(open().accept(message(packet({...intent(),advisory:false})),now).reason,'invalid_intent');
  assert.equal(open().accept(message(packet({...intent(),program:'L:open > R:pinch;rm -rf /'})),now).reason,'invalid_intent');
});

test('synthetic source requires separate host consent, regardless of supplied labels',()=>{
  const request=message(packet(intent('domistika.view.next',1,'synthetic')));
  assert.equal(open().accept(request,now).reason,'invalid_intent');
  assert.equal(open({demo:true}).accept(request,now).accepted,true);
});

test('guard denies from latest local UI state and fails closed on throw',()=>{
  const h=open({guard:(id,context)=>context?.focused&&context?.safe?'': 'not_focused'});
  // Empty guard string is treated as denial, never a permission token.
  assert.equal(h.accept(message(),now,{focused:false,safe:true}).reason,'not_focused');
  assert.equal(h.accept(message(),now,{focused:true,safe:true}).reason,'context_denied');
  const yes=open({guard:(id,context)=>context?.focused?null:'not_focused'});
  assert.equal(yes.accept(message(),now,{focused:false}).reason,'not_focused');
  assert.equal(yes.accept(message(),now,{focused:true}).accepted,true);
  assert.equal(open({guard:()=>{throw Error('no');}}).accept(message(),now).reason,'context_denied');
});

test('replay, cooldown, expiry and revocation never grant execution',()=>{
  const h=open();
  assert.equal(h.accept(message(packet(intent(),now-3000)),now).reason,'invalid_envelope');
  assert.equal(h.accept(message(),now).accepted,true);
  const second=message(packet(intent('domistika.view.previous',2),now+100));
  assert.equal(h.accept(second,now+100).reason,'cooldown');
  const later=message(packet(intent('domistika.view.previous',2),now+1200));
  assert.equal(h.accept(later,now+1200).accepted,true);
  assert.equal(h.accept(later,now+1300).reason,'replay');
  assert.equal(h.accept(later,now+60_001).reason,'expired');
  assert.equal(h.active,false);
  h.revoke();
  assert.equal(h.accept(message(),now).reason,'disabled');
});

test('session constraints are fail-closed and a new enable revokes prior sequence',()=>{
  const h=open();
  assert.throws(()=>h.enable({source,origin:'https://example.test',sessionId:session,
    expiresAt:now+300_001},now),/Invalid bounded/);
  assert.equal(h.active,false);
  h.enable({source,origin:'https://example.test',sessionId:session,
    expiresAt:now+60_000},now);
  assert.equal(h.accept(message(),now).accepted,true);
  h.enable({source,origin:'https://example.test',sessionId:'55e3a4ca-169c-46d1-a7e1-f81e8070a9ab',
    expiresAt:now+60_000},now);
  assert.equal(h.accept(message(),now).reason,'invalid_envelope');
});
