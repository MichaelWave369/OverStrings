/**
 * OverStrings Rung 5: local, explicitly enabled, one-shot host preview adapter.
 *
 * The adapter validates an UNTRUSTED action-intent shape before passing a bounded
 * preview command to the caller. There is no real game integration or permission
 * system. CustomEvent and client timestamp/sequence are forgeable by same-origin JS.
 * MIT License.
 */
import {ACTIONS} from "./action-gateway.mjs";

export const HOST_ACTIONS = Object.freeze({
  spark: Object.freeze(["spark.cast"]),
  btm: Object.freeze(["btm.interact"]),
  domistika: Object.freeze(["domistika.stroke"]),
  genewrist: Object.freeze(["genewrist.open"])
});
export const HOST_LABELS = Object.freeze({
  spark: "Spark",btm: "Break the Matrix",
  domistika: "Domistika XR",genewrist: "Gen.E.Wrist"
});

const ALLOWED_SOURCES = new Set(["webxr","synthetic"]);
function validIntent(intent) {
  return !!intent && typeof intent==="object" && !Array.isArray(intent) &&
    intent.schema==="overstrings.action-intent.v1" && intent.version===1 &&
    intent.advisory===true && intent.mode==="practice" &&
    typeof intent.action_id==="string" && Object.hasOwn(ACTIONS,intent.action_id) &&
    typeof intent.template_label==="string" &&
    intent.template_label.trim().length > 0 && intent.template_label.length <= 60 &&
    ALLOWED_SOURCES.has(intent.source) &&
    Number.isSafeInteger(intent.sequence) && intent.sequence>0 &&
    Number.isSafeInteger(intent.timestamp_ms) && intent.timestamp_ms>=0;
}

export class HostPreviewAdapter {
  constructor({onPreview,maxAgeMs=2000,maxFutureMs=100,cooldownMs=1200}={}) {
    if(typeof onPreview!=="function") throw new TypeError("A preview callback is required");
    if(!Number.isFinite(maxAgeMs)||maxAgeMs<200||maxAgeMs>10000 ||
      !Number.isFinite(maxFutureMs)||maxFutureMs<0||maxFutureMs>250 ||
      !Number.isFinite(cooldownMs)||cooldownMs<250||cooldownMs>10000) {
      throw new RangeError("Invalid host preview limits");
    }
    this.onPreview=onPreview;
    this.maxAgeMs=maxAgeMs;
    this.maxFutureMs=maxFutureMs;
    this.cooldownMs=cooldownMs;
    this.disarm();
    this.config=null;
    this.lastAcceptedAt=-Infinity;
    this.lastSequence=0;
  }
  configure({hostId,source,allowSyntheticDemo=false}={}) {
    this.disarm();
    this.config=null;
    if(!Object.hasOwn(HOST_ACTIONS,hostId))
      throw new TypeError("Unknown host");
    if(!ALLOWED_SOURCES.has(source)||typeof allowSyntheticDemo!=="boolean")
      throw new TypeError("Invalid host source or demo setting");
    this.config=Object.freeze({hostId,source,allowSyntheticDemo});
  }
  arm() {
    if(!this.config) return {armed:false,reason:"not_configured"};
    if(this.config.source==="synthetic" && !this.config.allowSyntheticDemo)
      return {armed:false,reason:"synthetic_disabled"};
    this.armed=true;
    return {armed:true,reason:"one_shot_enabled"};
  }
  disarm() {this.armed=false;}
  /**
   * Returns {accepted,reason}. At most one onPreview invocation per arming.
   * No privileged commands, cross-window delivery, postMessage or network.
   */
  accept(intent,nowMs) {
    if(!this.armed)return {accepted:false,reason:"not_armed"};
    this.disarm();
    if(!Number.isFinite(nowMs) || nowMs<0)
      return {accepted:false,reason:"invalid_clock"};
    if(!validIntent(intent))return {accepted:false,reason:"invalid_intent"};
    const c=this.config;
    if(!c||intent.source!==c.source)
      return {accepted:false,reason:"source_mismatch"};
    if(intent.source==="synthetic"&&!c.allowSyntheticDemo)
      return {accepted:false,reason:"synthetic_disabled"};
    if(!HOST_ACTIONS[c.hostId].includes(intent.action_id))
      return {accepted:false,reason:"action_not_allowed_for_host"};
    if(intent.timestamp_ms<nowMs-this.maxAgeMs ||
       intent.timestamp_ms>nowMs+this.maxFutureMs)
      return {accepted:false,reason:"stale_or_future_intent"};
    if(intent.sequence<=this.lastSequence)
      return {accepted:false,reason:"replay_or_reordered"};
    if(nowMs-this.lastAcceptedAt<this.cooldownMs)
      return {accepted:false,reason:"cooldown"};

    // Only a value object with approved fields reaches the host callback.
    // Callbacks must be preview-only. Never treat event data as authorization.
    const preview=Object.freeze({
      schema:"overstrings.host-preview.v1",
      host_id:c.hostId,
      action_id:intent.action_id,
      label:HOST_LABELS[c.hostId],
      source:intent.source,
      template_label:intent.template_label,
      sequence:intent.sequence
    });
    this.lastSequence=intent.sequence;
    this.lastAcceptedAt=nowMs;
    try {
      this.onPreview(preview);
    } catch {
      return {accepted:false,reason:"preview_callback_error"};
    }
    return {accepted:true,reason:"preview_only",preview};
  }
}
