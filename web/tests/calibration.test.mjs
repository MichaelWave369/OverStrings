import test from "node:test";
import assert from "node:assert/strict";
import {defaultProfile,validateProfile} from "../calibration.mjs";
import {GestureTracker,recognizeGesture} from "../gesture.mjs";

function hand({tipX=-0.03}={}) {
  const fingers=["index-finger","middle-finger","ring-finger","pinky-finger"];
  const joints={wrist:{x:0,y:0,z:0},"thumb-tip":{x:tipX+0.025,y:.11,z:0}};
  for(const [i,f] of fingers.entries()) {
    const x=-.03+i*.02;
    joints[f+"-metacarpal"]={x,y:.02,z:0};
    joints[f+"-phalanx-proximal"]={x,y:.05,z:0};
    joints[f+"-tip"]={x,y:.11,z:0};
  }
  return joints;
}
test("default profile safe and separately adjustable for each hand",()=>{
  const p=defaultProfile();
  p.left.pinchRatio=0.6;
  assert.equal(p.right.pinchRatio,0.35);
  const valid=validateProfile(p);
  assert.equal(valid.left.pinchRatio,0.6);
});
test("profile schema rejects corrupted, old and unsafe ranges",()=>{
  assert.throws(()=>validateProfile({}),/Unsupported/);
  const p=defaultProfile();p.left.pinchRatio=100;
  assert.throws(()=>validateProfile(p),/pinchRatio/);
  const q=defaultProfile();q.dwellMs=NaN;
  assert.throws(()=>validateProfile(q),/dwellMs/);
  assert.throws(()=>validateProfile({...defaultProfile(),version:2}),/Unsupported/);
});
test("pinch threshold is adjustable per hand without changing defaults",()=>{
  const shape=hand({tipX:-.03});
  shape["thumb-tip"]={x:.004,y:.11,z:0}; // index x -0.03, distance .034, palm .06
  assert.equal(recognizeGesture(shape),"open");
  assert.equal(recognizeGesture(shape,{pinchRatio:.6,extensionRatio:1.17}),"pinch");
  const t=new GestureTracker({profile:{...defaultProfile(),
    left:{pinchRatio:.6,extensionRatio:1.17}}});
  t.update("left",shape,0);
  assert.equal(t.update("left",shape,95)[0].gesture,"pinch");
  t.update("right",shape,0);
  assert.equal(t.update("right",shape,95)[0].gesture,"open");
});
test("updating profile disarms stale gesture state",()=>{
  const t=new GestureTracker();
  const j=hand();
  t.update("left",j,0);t.update("left",j,100);
  assert.equal(t.active("left"),"pinch");
  t.setProfile(defaultProfile());
  assert.equal(t.active("left"),"neutral");
});
