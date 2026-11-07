/**
 * Optional browser PhiOS companion transport for purely non-privileged
 * Shell UI navigation. Never a source of PhiOS authorization.
 * Requires exact same origin and user-opened PhiOS window.
 * Same-origin JS, session data, and postMessage are NOT security boundaries.
 */
export const PHIPOSE_NAV_PROTOCOL = "phios.gesture-nav.v0.1";
const formatSession=id=>typeof id==="string"&&/^[a-zA-Z0-9-]{16,80}$/.test(id);
export function createPhiOSCompanion({onStatus=()=>{},onReceipt=()=>{}}={}) {
  let target=null,session=null,expires=0;
  const origin=window.location.origin;
  const isLive=()=>!!target && !target.closed && !!session && Date.now()<expires;
  const clear=()=>{target=null;session=null;expires=0;};
  const receive=(event)=>{
    if(!target||event.source!==target||event.origin!==origin)return;
    const data=event.data;
    if(!data||typeof data!=="object"||data.protocol!==PHIPOSE_NAV_PROTOCOL)return;
    if(data.type==="ready"&&formatSession(data.session_id)&&
      Number.isSafeInteger(data.expires_at)&&
      data.expires_at>Date.now()+1000&&data.expires_at<=Date.now()+300500) {
      session=data.session_id;expires=data.expires_at;
      onStatus("PhiOS companion connected for safe UI navigation only.");
    }else if(data.type==="receipt") {
      onReceipt(data);
      onStatus(data.accepted?"PhiOS accepted navigation for UI dispatch.":
        "PhiOS denied request: "+String(data.reason||"unknown"));
    }
  };
  window.addEventListener("message",receive);
  return {
    open() {
      // Must be called directly from a real user click, not an automatic effect.
      clear();
      const url=new URL("../PhiOS/",window.location.href);
      if(url.origin!==origin)throw new TypeError("PhiOS companion must share origin");
      const popup=window.open(url.href,"phios-gesture-companion");
      if(!popup){onStatus("Popup blocked; allow popups for this site and retry.");return false;}
      target=popup;
      onStatus("In the PhiOS window, click Enable ΦPose companion. This page awaits approval.");
      return true;
    },
    isConnected:isLive,
    disconnect() {clear();onStatus("OverStrings companion disconnected.");},
    send(intent) {
      if(!isLive()){onStatus("No currently enabled PhiOS companion.");return false;}
      if(!intent||intent.schema!=="overstrings.phipose.intent.v0.1"||
        intent.advisory!==true||intent.action_authority!==false||
        intent.execution_authority!==false ||
        !Number.isSafeInteger(intent.sequence)||
        !/^phios\.(view\.(home|research|build|ledger)|command\.open)$/.test(intent.action_id))
        return false;
      // Only a minimal advisory request, not hand motion or arbitrary data.
      target.postMessage({
        protocol:PHIPOSE_NAV_PROTOCOL,type:"command",session_id:session,
        sent_at:Date.now(),intent
      },origin);
      onStatus("Gesture sentence sent. Waiting for host validation, not claiming success.");
      return true;
    }
  };
}
