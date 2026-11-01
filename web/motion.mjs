/**
 * OverStrings motion-phrase recorder v1.
 * Explicit in-memory capture. No networking, camera data or automatic storage.
 * Positions are headset-reported data, not extra-sensor tracking.
 * MIT License.
 */
import {distance} from "./gesture.mjs";
const FINGERTIPS = Object.freeze([
  "thumb-tip","index-finger-tip","middle-finger-tip","ring-finger-tip","pinky-finger-tip"
]);
const MAX_SAMPLES = 300;
const round = n => Math.round(n * 1000) / 1000;
const isPoint = p => !!p && [p.x,p.y,p.z].every(Number.isFinite);
function extract(joints, origin) {
  if (!joints || !isPoint(joints.wrist)) return null;
  const w = distance(joints["index-finger-metacarpal"],joints["pinky-finger-metacarpal"]);
  if (w < 0.015 || w > 0.22 || !Number.isFinite(w)) return null;
  const tips = {};
  for (const name of FINGERTIPS) {
    const p = joints[name];
    if (!isPoint(p)) continue;
    const coords = [p.x,p.y,p.z].map((v,i) => (v - [joints.wrist.x,joints.wrist.y,joints.wrist.z][i]) / w);
    if (coords.some(v => !Number.isFinite(v) || Math.abs(v) > 15)) continue;
    tips[name] = coords.map(round);
  }
  if (!Object.keys(tips).length) return null;
  if (!origin.value) origin.value = {...joints.wrist};
  return {
    wrist_m: ["x","y","z"].map(axis => round(joints.wrist[axis] - origin.value[axis])),
    fingertips_palm_units: tips
  };
}
export class MotionRecorder {
  constructor({durationMs=20000,sampleIntervalMs=70}={}) {
    if (!Number.isFinite(durationMs) || durationMs < 1000 || durationMs > 30000 ||
        !Number.isFinite(sampleIntervalMs) || sampleIntervalMs < 30 || sampleIntervalMs > 500) {
      throw new RangeError("Invalid recording timing limits");
    }
    this.durationMs = durationMs;
    this.sampleIntervalMs = sampleIntervalMs;
    this.clear();
  }
  clear() {
    this.state = "idle";
    this.frames = [];
    this.source = null;
    this.startedAt = null;
    this.lastSampleAt = null;
    this.origins = {left: {value:null}, right: {value:null}};
  }
  arm(source="webxr") {
    if (this.state !== "idle") throw new Error("Clear the previous recording before arming another");
    if (source !== "webxr" && source !== "synthetic") throw new TypeError("Invalid recording source");
    this.source = source;
    this.state = "armed";
  }
  ingest(hands, timeMs) {
    if (!["armed","recording"].includes(this.state) || !Number.isFinite(timeMs)) return false;
    if (this.startedAt !== null && timeMs < this.startedAt) return false;
    if (this.startedAt !== null && timeMs - this.startedAt >= this.durationMs) {
      this.stop(); return false;
    }
    if (this.lastSampleAt !== null && timeMs < this.lastSampleAt + this.sampleIntervalMs) return false;
    const sample = {
      left: extract(hands?.left, this.origins.left),
      right: extract(hands?.right, this.origins.right)
    };
    if (this.state === "armed") {
      if (!sample.left && !sample.right) return false;
      this.startedAt = timeMs;
      this.state = "recording";
    }
    this.frames.push({
      t_ms: Math.round(timeMs - this.startedAt),
      hands: sample
    });
    this.lastSampleAt = timeMs;
    if (this.frames.length >= MAX_SAMPLES) this.stop();
    return true;
  }
  stop() {
    if (this.state === "recording") this.state = "complete";
    else if (this.state === "armed") this.state = "idle";
    return this.state;
  }
  exportJSON(label="Untitled motion") {
    if (this.state !== "complete" || this.frames.length === 0) {
      throw new Error("No completed recording to export");
    }
    const safeName = String(label).trim().slice(0,60) || "Untitled motion";
    const result = {
      schema:"overstrings.motion.v1",version:1,label:safeName,
      source:this.source,coordinate_convention:"wrist delta meters; tips relative to wrist divided by palm width",
      sample_interval_ms:this.sampleIntervalMs,
      duration_ms:this.frames[this.frames.length - 1].t_ms,
      frames:this.frames
    };
    return JSON.stringify(result,null,2);
  }
}
