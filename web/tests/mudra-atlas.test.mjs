import test from "node:test";
import assert from "node:assert/strict";
import {
  MUDRA_ATLAS_VERSION,MUDRA_CATALOG,MUDRA_SOURCES,
  ABHINAYA_DARPANA_SINGLE_28,HATHA_PRADIPIKA_TEN,
  findMudras,getMudraById
} from "../mudra-atlas.mjs";

test("atlas has sourced, unique, read-only entries",()=>{
  assert.equal(MUDRA_ATLAS_VERSION,"overstrings.mudra-atlas.v1");
  assert.equal(MUDRA_CATALOG.length,13);
  assert.equal(new Set(MUDRA_CATALOG.map(x=>x.id)).size,MUDRA_CATALOG.length);
  for(const entry of MUDRA_CATALOG){
    assert.match(entry.id,/^[a-z]+\.[a-z]+$/);
    assert.equal(Object.isFrozen(entry),true);
    assert.equal(Object.isFrozen(entry.sourceIds),true);
    assert.equal(entry.status,"historically_attested_reference");
    assert.equal(entry.actionBinding,"none");
    assert.ok(["single_hand","two_hand","body_context"].includes(entry.kind));
    assert.ok(["single_hand_candidate","two_hand_candidate","requires_body_context"].includes(entry.tracking));
    assert.ok(entry.pose.length>30 && entry.meaning.length>20);
    assert.ok(entry.sourceIds.length>0);
    for(const id of entry.sourceIds){
      assert.ok(Object.hasOwn(MUDRA_SOURCES,id),id);
      assert.ok(MUDRA_SOURCES[id].url.startsWith("https://"));
    }
  }
});

test("source indexes preserve distinct traditional corpora",()=>{
  assert.equal(ABHINAYA_DARPANA_SINGLE_28.length,28);
  assert.equal(new Set(ABHINAYA_DARPANA_SINGLE_28).size,28);
  assert.equal(HATHA_PRADIPIKA_TEN.length,10);
  assert.equal(new Set(HATHA_PRADIPIKA_TEN).size,10);
  assert.ok(ABHINAYA_DARPANA_SINGLE_28.includes("Mushti"));
  assert.ok(HATHA_PRADIPIKA_TEN.includes("Mula Bandha"));
});

test("traditional meaning does not itself grant app privileges",()=>{
  for(const entry of MUDRA_CATALOG){
    assert.equal(entry.actionBinding,"none");
    assert.equal("actionId" in entry,false);
    assert.equal("gesture" in entry,false);
  }
  assert.equal(getMudraById("dance.tripataka")?.name,"Tripataka");
  assert.equal(getMudraById("not-a-gesture"),null);
});

test("search is pure and tradition-specific",()=>{
  assert.ok(findMudras("thumb").length>0);
  assert.ok(findMudras("Abhaya","Buddhist").some(x=>x.name==="Abhaya"));
  assert.equal(findMudras("Abhaya","dance").length,0);
  assert.ok(findMudras("fist","dance").some(x=>x.name==="Shikhara"));
  assert.equal(findMudras("no-such-shape").length,0);
  assert.equal(findMudras().length,MUDRA_CATALOG.length);
});
