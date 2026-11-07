/**
 * OverStrings Rung 9: optional reviewed PhiOffice PhiDeck companion.
 * Cross-window gesture requests carry only allowlisted navigation intents.
 * Both pages must be same-origin and human-approved. Not authentication.
 */
export const PHIPOSE_DECK_PROTOCOL='phioffice.phipose-deck.v0.1';
const SESSION=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS=Object.freeze(['phioffice.page.next','phioffice.page.previous']);
const PROGRAM=/^([LR]:(open|pinch|grab|point|swipe-left|swipe-right)(\+[LR]:(open|pinch|grab|point|swipe-left|swipe-right))?)( > ([LR]:(open|pinch|grab|point|swipe-left|swipe-right)(\+[LR]:(open|pinch|grab|point|swipe-left|swipe-right))?)){1,4}$/;
export function createPhiOfficeDeckCompanion({onStatus=()=>{},onReceipt=()=>{}}={}){
  let popup=null,session=null,expires=0;
  const origin=window.location.origin;
  const live=()=>!!popup&&!popup.closed&&!!session&&Date.now()<expires;
  const clear=()=>{popup=null;session=null;expires=0;};
  function onMessage(event){
    if(!popup||event.source!==popup||event.origin!==origin)return;
    const data=event.data;
    if(!data||typeof data!=='object'||data.protocol!==PHIPOSE_DECK_PROTOCOL)return;
    if(data.type==='ready'&&SESSION.test(data.session_id)&&
       Number.isSafeInteger(data.expires_at)&&
       data.expires_at>Date.now()+1000&&data.expires_at<=Date.now()+300500){
      session=data.session_id;expires=data.expires_at;
      onStatus('PhiOffice deck companion connected. Only slide navigation allowed.');
    }else if(data.type==='receipt'){
      // A receipt means host acceptance for UI dispatch, not a persisted edit.
      onReceipt(data);
      onStatus(data.accepted?'PhiOffice accepted UI navigation request.':
        'PhiOffice denied navigation: '+String(data.reason||'unknown'));
    }
  }
  window.addEventListener('message',onMessage);
  return Object.freeze({
    open(){
      // User click required. This opens the normal PhiOffice suite.
      clear();
      const url=new URL('../phioffice369/',window.location.href);
      if(url.origin!==origin)throw new TypeError('PhiOffice must share an origin');
      const opened=window.open(url.href,'phipose-office-deck-companion');
      if(!opened){onStatus('Popup blocked. Enable popups, then try again.');return false;}
      popup=opened;
      onStatus('In PhiOffice: open a PhiDeck workspace, then click Enable ΦPose deck navigation.');
      return true;
    },
    isConnected:live,
    disconnect(){clear();onStatus('PhiOffice companion disconnected.');},
    send(intent){
      if(!live()){onStatus('No enabled PhiOffice deck session.');return false;}
      if(!intent||intent.schema!=='overstrings.phipose.intent.v0.1'||
         intent.advisory!==true||intent.action_authority!==false||
         intent.execution_authority!==false||!ACTIONS.includes(intent.action_id)||
         !['webxr','synthetic'].includes(intent.source)||
         !Number.isSafeInteger(intent.sequence)||intent.sequence<1||
         !Number.isSafeInteger(intent.timestamp_ms)||intent.timestamp_ms<0||
         typeof intent.program!=='string'||intent.program.length>140||
         !PROGRAM.test(intent.program))return false;
      popup.postMessage({
        protocol:PHIPOSE_DECK_PROTOCOL,type:'command',
        session_id:session,sent_at:Date.now(),
        intent:{
          schema:'overstrings.phipose.intent.v0.1',version:1,
          advisory:true,action_authority:false,execution_authority:false,
          action_id:intent.action_id,source:intent.source,
          program:intent.program,sequence:intent.sequence,
          timestamp_ms:intent.timestamp_ms
        }
      },origin);
      onStatus('Gesture sent to PhiOffice; awaiting explicit host receipt.');
      return true;
    }
  });
}
