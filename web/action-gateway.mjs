/**
 * OverStrings Rung 4: fail-closed, one-shot, advisory action-intent gate.
 *
 * Pure JS / MIT. Does NOT grant host app permissions or execute game actions.
 * A same-page CustomEvent is not authenticated and is not a security boundary.
 */
export const ACTIONS = Object.freeze({
  "spark.cast": "Spark: cast preview",
  "btm.interact": "Break the Matrix: interact preview",
  "domistika.stroke": "Domistika XR: create stroke preview",
  "genewrist.open": "Gen.E.Wrist: open tool preview"
});
const SOURCES = new Set(["webxr","synthetic"]);
const MAX_SCORE = .38;

export class ActionIntentGate {
  constructor({cooldownMs=1200,maxScore=MAX_SCORE}={}) {
    if(!Number.isFinite(cooldownMs)||cooldownMs<250||cooldownMs>10000 ||
       !Number.isFinite(maxScore)||maxScore<.05||maxScore>MAX_SCORE) {
      throw new RangeError("Invalid action-intent gate limits");
    }
    this.cooldownMs=cooldownMs;
    this.maxScore=maxScore;
    this.disarm();
    this.config=null;
    this.lastAccepted=-Infinity;
    this.sequence=0;
  }
  configure({templateLabel,actionId,source,allowSyntheticDemo=false}={}) {
    if(typeof templateLabel!=="string"||!templateLabel.trim()||templateLabel.length>60)
      throw new TypeError("Missing or invalid phrase reference name");
    if(!Object.hasOwn(ACTIONS,actionId))
      throw new TypeError("Action must be explicitly allowlisted");
    if(!SOURCES.has(source)||typeof allowSyntheticDemo!=="boolean")
      throw new TypeError("Unsupported recording source or demo setting");
    this.disarm();
    this.config={
      templateLabel,actionId,source,allowSyntheticDemo
    };
  }
  arm() {
    if(!this.config) return {armed:false,reason:"not_configured"};
    if(this.config.source==="synthetic"&&!this.config.allowSyntheticDemo)
      return {armed:false,reason:"synthetic_demo_disabled"};
    this.armed=true;
    return {armed:true,reason:"armed_one_shot"};
  }
  disarm() { this.armed=false; }
  consume(event,nowMs) {
    if(!this.armed)return {accepted:false,reason:"not_armed"};
    // One event consumes arming even if it is malformed, mismatched or rejected.
    this.disarm();
    if(!Number.isFinite(nowMs)||nowMs<0) return {accepted:false,reason:"invalid_time"};
    if(!event||event.type!=="overstrings.phrase-comparison"||
       event.version!==1||event.manual!==true||
       typeof event.template_label!=="string"||
       !SOURCES.has(event.source)||typeof event.matched!=="boolean"||
       typeof event.reason!=="string"||
       !Number.isFinite(event.score)) return {accepted:false,reason:"invalid_comparison"};
    const c=this.config;
    if(!c || event.source!==c.source) return {accepted:false,reason:"source_mismatch"};
    if(event.template_label!==c.templateLabel) return {accepted:false,reason:"reference_mismatch"};
    if(event.source==="synthetic"&&!c.allowSyntheticDemo)
      return {accepted:false,reason:"synthetic_demo_disabled"};
    if(!event.matched||event.reason!=="similar"||event.score<0||event.score>this.maxScore)
      return {accepted:false,reason:"not_a_valid_match"};
    if(nowMs-this.lastAccepted<this.cooldownMs)
      return {accepted:false,reason:"cooldown"};
    this.lastAccepted=nowMs;
    return {accepted:true,reason:"advisory_intent",intent:{
      schema:"overstrings.action-intent.v1",
      version:1,advisory:true,mode:"practice",
      action_id:c.actionId,template_label:c.templateLabel,
      source:event.source,sequence:++this.sequence,
      // No raw coordinates, pose frames, camera data, user ID or network destination.
      timestamp_ms:Math.round(nowMs)
    }};
  }
}
