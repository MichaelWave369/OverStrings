/**
 * OverStrings Rung 12: exact-origin Domistika XR gesture UI companion.
 * This sender sends only minimal advisory command intents.
 * A recipient app must independently approve a five-minute session.
 * Same-origin postMessage is not authentication.
 */
export const DOMISTIKA_PHIPOSE_PROTOCOL='domistika.gesture-nav.v0.1';
export const DOMISTIKA_PHIPOSE_ACTIONS=Object.freeze([
  'domistika.room.home','domistika.room.canvas','domistika.room.spatial',
  'domistika.room.workshop','domistika.room.gallery',
  'domistika.brush.next','domistika.brush.previous'
]);
const SESSION=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROGRAM=/^([LR]:(open|pinch|grab|point|swipe-left|swipe-right)(\+[LR]:(open|pinch|grab|point|swipe-left|swipe-right))?)( > ([LR]:(open|pinch|grab|point|swipe-left|swipe-right)(\+[LR]:(open|pinch|grab|point|swipe-left|swipe-right))?)){1,4}$/;
export function createDomistikaCompanion({onStatus=()=>{},onReceipt=()=>{}}={}){
  let target=null,session=null,expires=0;
  const origin=window.location.origin;
  const live=()=>!!target&&!target.closed&&!!session&&Date.now()<expires;
  const clear=()=>{target=null;session=null;expires=0;};
  function receive(event){
    if(!target||event.source!==target||event.origin!==origin)return;
    const data=event.data;
    if(!data||typeof data!=='object'||data.protocol!==DOMISTIKA_PHIPOSE_PROTOCOL)return;
    if(data.type==='ready'&&SESSION.test(data.session_id)&&
      Number.isSafeInteger(data.expires_at)&&
      data.expires_at>Date.now()+1000&&data.expires_at<=Date.now()+300500){
      session=data.session_id;expires=data.expires_at;
      onStatus('Domistika approved: rooms and future-stroke brush styles only.');
    }else if(data.type==='receipt'){
      onReceipt(data);
      onStatus(data.accepted?'Domistika accepted UI navigation.':
        'Domistika denied command: '+String(data.reason||'unknown'));
    }
  }
  window.addEventListener('message',receive);
  return Object.freeze({
    open(){
      clear();
      const url=new URL('../Domistika/xr.html',window.location.href);
      if(url.origin!==origin)throw new TypeError('Domistika companion must share origin');
      const popup=window.open(url.href,'phipose-domistika-xr-companion');
      if(!popup){onStatus('Popup blocked; enable popups for this site.');return false;}
      target=popup;
      onStatus('In Domistika XR, click Enable for 5 minutes inside the ΦPose panel.');
      return true;
    },
    isConnected:live,
    disconnect(){clear();onStatus('Domistika companion disconnected.');},
    send(intent){
      if(!live()){onStatus('No approved Domistika session.');return false;}
      if(!intent||intent.schema!=='overstrings.phipose.intent.v0.1'||
        intent.version!==1||intent.advisory!==true||
        intent.action_authority!==false||intent.execution_authority!==false||
        !DOMISTIKA_PHIPOSE_ACTIONS.includes(intent.action_id)||
        !['webxr','synthetic'].includes(intent.source)||
        !Number.isSafeInteger(intent.sequence)||intent.sequence<1||
        !Number.isSafeInteger(intent.timestamp_ms)||intent.timestamp_ms<0||
        typeof intent.program!=='string'||intent.program.length>140||
        !PROGRAM.test(intent.program))return false;
      target.postMessage({
        protocol:DOMISTIKA_PHIPOSE_PROTOCOL,type:'command',session_id:session,
        sent_at:Date.now(),
        intent:{
          schema:'overstrings.phipose.intent.v0.1',version:1,
          advisory:true,action_authority:false,execution_authority:false,
          action_id:intent.action_id,source:intent.source,
          program:intent.program,sequence:intent.sequence,
          timestamp_ms:intent.timestamp_ms
        }
      },origin);
      onStatus('Sent Domistika UI-only request. Waiting for host receipt.');
      return true;
    }
  });
}
