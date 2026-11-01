/**
 * OverStrings Rung 3: bounded, local comparison of motion phrase recordings.
 * Deterministic similarity, NOT identity/biometric recognition, ML, or measured confidence.
 * MIT License.
 */
const MAX_BYTES = 250000;
const MAX_FRAMES = 300;
const MIN_FRAMES = 8;
const BINS = 28;
const HANDS = ["left", "right"];
const TIPS = ["thumb-tip","index-finger-tip","middle-finger-tip","ring-finger-tip","pinky-finger-tip"];
const CONVENTION = "wrist delta meters; tips relative to wrist divided by palm width";

function vector(raw, max, field) {
  if (!Array.isArray(raw) || raw.length !== 3 ||
      !raw.every(v=>typeof v==="number" && Number.isFinite(v) && Math.abs(v) <= max)) {
    throw new RangeError("Invalid " + field + " coordinates");
  }
  return [...raw];
}
export function validateMotionRecord(data) {
  if (!data || typeof data!=="object" || Array.isArray(data) ||
      data.schema!=="overstrings.motion.v1" || data.version!==1 ||
      !["webxr","synthetic"].includes(data.source)) {
    throw new TypeError("Unsupported or incomplete motion recording");
  }
  if (data.coordinate_convention !== CONVENTION) {
    throw new TypeError("Unsupported motion coordinate convention");
  }
  if (typeof data.label!=="string" || !data.label.trim() || data.label.length > 60) {
    throw new TypeError("Invalid phrase label");
  }
  if (!Number.isFinite(data.sample_interval_ms) || data.sample_interval_ms < 30 ||
      data.sample_interval_ms > 500 || !Number.isFinite(data.duration_ms) ||
      data.duration_ms < 0 || data.duration_ms > 30000) {
    throw new RangeError("Invalid motion timing");
  }
  if (!Array.isArray(data.frames) || data.frames.length < MIN_FRAMES ||
      data.frames.length > MAX_FRAMES) {
    throw new RangeError("Phrase must contain 8 to 300 frames");
  }
  let previous = -1;
  let validHands = 0;
  const frames = data.frames.map((frame,i)=>{
    if (!frame || typeof frame!=="object" || !Number.isInteger(frame.t_ms) ||
        frame.t_ms < 0 || frame.t_ms > data.duration_ms || frame.t_ms <= previous ||
        !frame.hands || typeof frame.hands!=="object") {
      throw new RangeError("Invalid or unsorted sample at frame " + i);
    }
    previous = frame.t_ms;
    const hands = {};
    for (const hand of HANDS) {
      const item = frame.hands[hand];
      if (item === null) { hands[hand]=null; continue; }
      if (!item || typeof item!=="object" ||
          !item.fingertips_palm_units || typeof item.fingertips_palm_units!=="object") {
        throw new TypeError("Missing or invalid " + hand + " hand sample");
      }
      const tips={};
      for (const name of Object.keys(item.fingertips_palm_units)) {
        if (!TIPS.includes(name)) throw new TypeError("Unknown finger joint in recording");
        tips[name] = vector(item.fingertips_palm_units[name],15,name);
      }
      if (!Object.keys(tips).length) throw new TypeError("Hand sample has no fingertips");
      hands[hand] = {
        wrist_m:vector(item.wrist_m,4,"wrist"),
        fingertips_palm_units:tips
      };
      validHands++;
    }
    return {t_ms:frame.t_ms,hands};
  });
  if (frames[0].t_ms !== 0 || frames.at(-1).t_ms !== data.duration_ms ||
      validHands < MIN_FRAMES) {
    throw new RangeError("Incomplete or invalid phrase samples");
  }
  return {
    schema:"overstrings.motion.v1",version:1,
    label:data.label.slice(0,60),source:data.source,
    coordinate_convention:CONVENTION,
    sample_interval_ms:data.sample_interval_ms,
    duration_ms:data.duration_ms,frames
  };
}
export function parseMotionText(text) {
  if (typeof text !== "string" || text.length > MAX_BYTES) {
    throw new RangeError("Motion file exceeds 250 KB or is not text");
  }
  let parsed;
  try { parsed=JSON.parse(text); }
  catch { throw new TypeError("Invalid motion JSON"); }
  return validateMotionRecord(parsed);
}
function length3(a,b) {
  return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
}
function visibleRatio(motion,hand) {
  return motion.frames.filter(f=>f.hands[hand]!==null).length / motion.frames.length;
}
function activeHands(motion) {
  return HANDS.filter(hand=>visibleRatio(motion,hand)>=0.72);
}
function movement(motion,hand) {
  const frames=motion.frames.filter(f=>f.hands[hand]);
  if(frames.length < MIN_FRAMES) return 0;
  let total=0;
  for(let i=1;i<frames.length;i++) {
    total += length3(frames[i].hands[hand].wrist_m,frames[i-1].hands[hand].wrist_m);
  }
  return total;
}
function resample(motion) {
  return Array.from({length:BINS},(_,i)=>{
    const target = motion.duration_ms * i/(BINS-1);
    let idx=0;
    while(idx+1<motion.frames.length &&
          Math.abs(motion.frames[idx+1].t_ms-target) <= Math.abs(motion.frames[idx].t_ms-target)) {
      idx++;
    }
    return motion.frames[idx].hands;
  });
}
function handDistance(a,b) {
  if (!a || !b) return 1.5;
  const wrist=Math.min(2,length3(a.wrist_m,b.wrist_m)/.28);
  let tipDistance=0,tipCount=0;
  for(const name of TIPS) {
    if(a.fingertips_palm_units[name] && b.fingertips_palm_units[name]) {
      tipDistance+=Math.min(2,length3(a.fingertips_palm_units[name],
        b.fingertips_palm_units[name])/1.5);
      tipCount++;
    }
  }
  if(tipCount<2)return 1.5;
  return .7*wrist + .3*(tipDistance/tipCount);
}
function frameDistance(a,b,hands) {
  return hands.reduce((sum,h)=>sum+handDistance(a[h],b[h]),0)/hands.length;
}
function dynamicTimeWarp(a,b,hands) {
  const length=a.length, band=5;
  const costs=Array.from({length:length+1},()=>Array(b.length+1).fill(Infinity));
  const steps=Array.from({length:length+1},()=>Array(b.length+1).fill(0));
  costs[0][0]=0;
  for(let i=1;i<=length;i++) {
    for(let j=Math.max(1,i-band);j<=Math.min(b.length,i+band);j++) {
      const possibilities=[[i-1,j-1],[i-1,j],[i,j-1]];
      let best=possibilities[0];
      for(const p of possibilities.slice(1)) {
        if(costs[p[0]][p[1]] < costs[best[0]][best[1]]) best=p;
      }
      costs[i][j]=costs[best[0]][best[1]]+frameDistance(a[i-1],b[j-1],hands);
      steps[i][j]=steps[best[0]][best[1]]+1;
    }
  }
  return costs[length][b.length]/Math.max(1,steps[length][b.length]);
}
/**
 * Compares two completed *independent* clips only after explicit user action.
 * score is a unitless distance: LOWER is closer. Not a calibrated probability.
 */
export function compareMotions(templateInput,candidateInput,{threshold=.38}={}) {
  if (!Number.isFinite(threshold)||threshold<.05||threshold>1.2)
    throw new RangeError("Invalid matching threshold");
  const template=validateMotionRecord(templateInput);
  const candidate=validateMotionRecord(candidateInput);
  const base={template_label:template.label,candidate_label:candidate.label,
    threshold,score:null,matched:false};
  if(template.source!==candidate.source) {
    return {...base,reason:"source_mismatch"};
  }
  const hands=activeHands(template);
  const candidateHands=activeHands(candidate);
  if(!hands.length || hands.join()!==candidateHands.join()) {
    return {...base,reason:"hand_coverage_mismatch"};
  }
  if(hands.some(hand=>movement(template,hand)<.06) ||
     hands.some(hand=>movement(candidate,hand)<.06)) {
    return {...base,reason:"too_little_motion"};
  }
  const ratio=candidate.duration_ms/template.duration_ms;
  if(!Number.isFinite(ratio)||ratio<.5||ratio>2) {
    return {...base,reason:"duration_mismatch"};
  }
  const score=dynamicTimeWarp(resample(template),resample(candidate),hands);
  return {...base,matched:score<=threshold,
    score:Math.round(score*10000)/10000,
    reason:score<=threshold?"similar":"different",
    hands:[...hands]};
}
