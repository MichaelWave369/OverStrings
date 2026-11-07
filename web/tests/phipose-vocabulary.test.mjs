import test from "node:test";
import assert from "node:assert/strict";
import {PhiPoseInterpreter} from "../phipose.mjs";
import {
  VOCABULARY_SCHEMA,BUILTIN_VOCABULARIES,
  compileVocabulary,parseImportedVocabulary,
  registerPreviewVocabulary,getVocabulary
} from "../phipose-vocabulary.mjs";

const sample=(app_id="research-tools",script="L:point > R:pinch")=>({
  schema:VOCABULARY_SCHEMA,app_id,title:"Research tools preview",version:"1.0.0",
  commands:[{id:app_id+".topic.next",label:"Next topic",
    description:"A local, advisory-only suggestion to view the next topic.",
    script,mode:"preview_only"}]
});
const event=(hand,gesture,time)=>({version:1,type:"overstrings.gesture",
  phase:"start",source:"synthetic",handedness:hand,gesture,timestamp_ms:time});

test("bundled vocabularies are unique, source-distinguished, immutable and authority-free",()=>{
  assert.ok(BUILTIN_VOCABULARIES.length>=4);
  assert.equal(new Set(BUILTIN_VOCABULARIES.map(x=>x.app_id)).size,BUILTIN_VOCABULARIES.length);
  for(const vocab of BUILTIN_VOCABULARIES){
    assert.equal(vocab.authority,false);
    assert.equal(vocab.execution_authority,false);
    assert.equal(vocab.provenance,"bundled_reviewed_reference");
    assert.equal(Object.isFrozen(vocab),true);
    assert.equal(Object.isFrozen(vocab.commands),true);
    for(const c of vocab.commands){
      assert.equal(Object.isFrozen(c),true);
      assert.ok(c.id.startsWith(vocab.app_id+"."));
      assert.ok(c.script.includes(" > "));
      if(vocab.app_id!=="phios")assert.equal(c.mode,"preview_only");
    }
  }
  assert.ok(getVocabulary(BUILTIN_VOCABULARIES,"phios"));
  assert.equal(getVocabulary(BUILTIN_VOCABULARIES,"not-here"),null);
});

test("imported vocabulary is data-only, normalized and has no UI/OS host authority",()=>{
  const c=parseImportedVocabulary(JSON.stringify(sample()));
  assert.equal(c.app_id,"research-tools");
  assert.equal(c.provenance,"user_import_preview");
  assert.equal(c.commands[0].mode,"preview_only");
  const expanded=registerPreviewVocabulary([...BUILTIN_VOCABULARIES],c);
  assert.equal(expanded.length,BUILTIN_VOCABULARIES.length+1);
  assert.equal(expanded.at(-1).app_id,c.app_id);
  assert.equal(Object.isFrozen(expanded),true);
  assert.equal(expanded.at(-1).authority,false);
  assert.equal(getVocabulary(BUILTIN_VOCABULARIES,c.app_id),null);
  assert.throws(()=>registerPreviewVocabulary(expanded,c),/already registered/);
});

test("imports cannot redefine PhiOS, claim shell routing or smuggle capabilities",()=>{
  for(const reserved of ["phios","system","operator"]){
    assert.throws(()=>parseImportedVocabulary(JSON.stringify(sample(reserved))),/reserved/);
  }
  for(const altered of [
    {...sample(),commands:[{...sample().commands[0],mode:"shell_ui"}]},
    {...sample(),commands:[{...sample().commands[0],mode:"execute"}]},
    {...sample(),extra:"drop all files"},
    {...sample(),commands:[{...sample().commands[0],executor:"shell"}]},
    {...sample(),commands:[{...sample().commands[0],id:"phios.view.home"}]},
    {...sample(),commands:[{...sample().commands[0],script:"L:open > eval('danger')"}]},
    {...sample(),title:"Bad\nname"}
  ]) assert.throws(()=>parseImportedVocabulary(JSON.stringify(altered)),/Invalid gesture vocabulary/);
});

test("reject ambiguous prefixes, identical canonical chords, and duplicate IDs",()=>{
  const a=sample();
  a.commands.push({...a.commands[0],id:"research-tools.topic.previous",
    script:"L:point > R:pinch > L:open"});
  assert.throws(()=>compileVocabulary(a),/colliding or prefix-ambiguous/);
  const b=sample("research-tools","R:pinch+L:open > R:point");
  b.commands.push({...b.commands[0],id:"research-tools.topic.previous",
    script:"L:open+R:pinch > R:point"});
  assert.throws(()=>compileVocabulary(b),/colliding or prefix-ambiguous/);
  const d=sample();d.commands.push({...d.commands[0]});
  assert.throws(()=>compileVocabulary(d),/duplicate command ID/);
});

test("reject oversized, malformed, and prototype-like commands",()=>{
  assert.throws(()=>parseImportedVocabulary("{bad"),/invalid JSON/);
  assert.throws(()=>parseImportedVocabulary("x".repeat(20001)),/20 KB/);
  const invalid=sample();
  invalid.commands[0].id="research-tools.__proto__";
  assert.throws(()=>compileVocabulary(invalid),/invalid command namespace/);
  const huge=sample();
  huge.commands=Array.from({length:13},(_,i)=>({
    id:"research-tools.action."+String(i)+"a",label:"Action",description:"Preview action",
    script:"L:point > R:pinch",mode:"preview_only"
  }));
  assert.throws(()=>compileVocabulary(huge),/1-12/);
});

test("multi-app vocabulary can reuse phrases only across different app scopes",()=>{
  const shared="L:open > R:pinch";
  const a=compileVocabulary(sample("alpha",shared));
  const b=compileVocabulary(sample("bravo",shared));
  assert.equal(a.commands[0].script,b.commands[0].script);
  assert.notEqual(a.app_id,b.app_id);
});

test("imported app action may produce advisory but remains isolated from PhiOS live allowlist",()=>{
  const custom=compileVocabulary(sample("research-tools","L:open > R:pinch"));
  const actionId=custom.commands[0].id;
  const engine=new PhiPoseInterpreter({advisoryActionIds:[actionId]});
  engine.configure({script:custom.commands[0].script,actionId,
    source:"synthetic",allowSyntheticDemo:true});
  assert.equal(engine.arm().armed,true);
  assert.equal(engine.consume(event("left","open",1000),1000).reason,"step_completed");
  const done=engine.consume(event("right","pinch",1400),1400);
  assert.equal(done.accepted,true);
  assert.equal(done.intent.action_id,actionId);
  assert.equal(done.intent.action_authority,false);
  assert.equal(done.intent.execution_authority,false);
  // An independent instance with default allowlist still refuses this action.
  assert.throws(()=>new PhiPoseInterpreter().configure({
    script:custom.commands[0].script,actionId,source:"webxr"
  }),/Unapproved/);
  assert.throws(()=>new PhiPoseInterpreter({advisoryActionIds:["__proto__"]}),/Invalid advisory/);
});
