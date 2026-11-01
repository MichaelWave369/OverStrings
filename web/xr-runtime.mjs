/**
 * Quest Browser WebXR joint viewer. Uses real XRFrame.getJointPose results;
 * never invents joints or reads camera video. MIT License.
 */
import {JOINT_NAMES,BONES} from "./gesture.mjs";
const VERT="attribute vec4 aClip; uniform float uSize; void main(){gl_Position=aClip;gl_PointSize=uSize;}";
const FRAG="precision mediump float; uniform vec4 uColor; void main(){gl_FragColor=uColor;}";
function compile(gl,kind,src) {
  const shader=gl.createShader(kind);
  gl.shaderSource(shader,src);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))
    throw Error(gl.getShaderInfoLog(shader)||"shader compilation failed");
  return shader;
}
function setup(gl) {
  const program=gl.createProgram();
  gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,VERT));
  gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))
    throw Error(gl.getProgramInfoLog(program)||"shader linking failed");
  const buf=gl.createBuffer(),attr=gl.getAttribLocation(program,"aClip"),
    color=gl.getUniformLocation(program,"uColor"),
    size=gl.getUniformLocation(program,"uSize");
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.enableVertexAttribArray(attr);
  return (mode,coords,rgba,pointSize=10)=>{
    if(!coords.length)return;
    gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coords),gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(attr,4,gl.FLOAT,false,0,0);
    gl.uniform4fv(color,rgba);gl.uniform1f(size,pointSize);
    gl.drawArrays(mode,0,coords.length/4);
  };
}
function multiplyPoint(m,p) {
  const {x,y,z}=p;
  return [
    m[0]*x+m[4]*y+m[8]*z+m[12],
    m[1]*x+m[5]*y+m[9]*z+m[13],
    m[2]*x+m[6]*y+m[10]*z+m[14],
    m[3]*x+m[7]*y+m[11]*z+m[15]
  ];
}
function project(view,p) {
  const [x,y,z,w]=multiplyPoint(view.transform.inverse.matrix,p);
  const m=view.projectionMatrix;
  const clip=[
    m[0]*x+m[4]*y+m[8]*z+m[12]*w,
    m[1]*x+m[5]*y+m[9]*z+m[13]*w,
    m[2]*x+m[6]*y+m[10]*z+m[14]*w,
    m[3]*x+m[7]*y+m[11]*z+m[15]*w
  ];
  return clip[3]>0?clip:null;
}
function jointsFor(frame,input,space) {
  if(!input.hand)return null;
  const joints={};
  for(const name of JOINT_NAMES) {
    const jointSpace=input.hand.get(name);
    if(!jointSpace)continue;
    const pose=frame.getJointPose(jointSpace,space);
    if(!pose)continue;
    const {x,y,z}=pose.transform.position;
    if([x,y,z].every(Number.isFinite))joints[name]={x,y,z};
  }
  return Object.keys(joints).length?joints:null;
}
export async function startHandXR({onFrame,onEnd}={}) {
  if(!navigator.xr || typeof XRWebGLLayer==="undefined")
    throw Error("Immersive WebXR unavailable. Open the HTTPS demo in Quest Browser.");
  if(!(await navigator.xr.isSessionSupported("immersive-vr")))
    throw Error("Immersive VR unsupported by this browser.");
  const canvas=document.createElement("canvas");
  const gl=canvas.getContext("webgl",{xrCompatible:true,antialias:true,alpha:false});
  if(!gl)throw Error("WebGL unavailable");
  if(gl.makeXRCompatible)await gl.makeXRCompatible();
  const session=await navigator.xr.requestSession("immersive-vr",{
    optionalFeatures:["hand-tracking","local-floor"]
  });
  try {
    const space=await session.requestReferenceSpace("local-floor")
      .catch(()=>session.requestReferenceSpace("local"));
    const layer=new XRWebGLLayer(session,gl);
    session.updateRenderState({baseLayer:layer});
    const draw=setup(gl);
    let running=true;
    session.addEventListener("end",()=>{
      running=false;onEnd?.();
    },{once:true});
    const floorY=space.type==="local-floor"?0:-1.5;
    function loop(time,frame) {
      if(!running)return;
      session.requestAnimationFrame(loop);
      const pose=frame.getViewerPose(space);
      const hands={left:null,right:null};
      for(const input of session.inputSources) {
        const hand=input.handedness;
        if((hand==="left"||hand==="right")&&input.hand)
          hands[hand]=jointsFor(frame,input,space);
      }
      onFrame?.(hands,time);
      if(!pose)return;
      gl.bindFramebuffer(gl.FRAMEBUFFER,layer.framebuffer);
      gl.enable(gl.SCISSOR_TEST);
      for(const view of pose.views) {
        const vp=layer.getViewport(view);
        gl.viewport(vp.x,vp.y,vp.width,vp.height);
        gl.scissor(vp.x,vp.y,vp.width,vp.height);
        gl.clearColor(.022,.035,.075,1);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        const grid=[];
        for(let i=-5;i<=5;i++) {
          const segments=[
            [{x:i*.3,y:floorY,z:-.5},{x:i*.3,y:floorY,z:-4}],
            [{x:-1.5,y:floorY,z:-2+i*.3},{x:1.5,y:floorY,z:-2+i*.3}]
          ];
          for(const [a,b] of segments) {
            const p=project(view,a),q=project(view,b);
            if(p&&q)grid.push(...p,...q);
          }
        }
        draw(gl.LINES,grid,[.15,.27,.34,1]);
        for(const hand of ["left","right"]) {
          const joints=hands[hand];
          if(!joints)continue;
          const lines=[],dots=[];
          for(const [a,b] of BONES) {
            if(!joints[a]||!joints[b])continue;
            const p=project(view,joints[a]),q=project(view,joints[b]);
            if(p&&q)lines.push(...p,...q);
          }
          for(const name of JOINT_NAMES) {
            if(!joints[name])continue;
            const p=project(view,joints[name]);
            if(p)dots.push(...p);
          }
          const color=hand==="left"?[.35,.83,1,1]:[1,.62,.34,1];
          draw(gl.LINES,lines,color);
          draw(gl.POINTS,dots,color,11);
        }
      }
      gl.disable(gl.SCISSOR_TEST);
    }
    session.requestAnimationFrame(loop);
    return {end:()=>session.end(),session};
  } catch(err) {
    await session.end().catch(()=>{});
    throw err;
  }
}
