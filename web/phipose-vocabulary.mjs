/**
 * ΦPose Universal Vocabulary v0.1
 * Data-only app-scoped gesture command descriptions.
 * Grammar/phrases do not grant capabilities, install apps or provide execution.
 * Imported manifests are memory-only and always preview_only.
 */
import {parsePhiPose,serializePhiPose,PHIPOSE_ACTIONS} from "./phipose.mjs";

export const VOCABULARY_SCHEMA="overstrings.phipose-vocabulary.v0.1";
const APP_ID=/^[a-z][a-z0-9-]{1,30}$/;
const ACTION_ID=/^[a-z][a-z0-9-]{1,30}(?:\.[a-z][a-z0-9-]{1,30}){1,3}$/;
const MODES=Object.freeze(["shell_ui","preview_only"]);
const exactKeys=(object,allowed)=>Object.keys(object).every(k=>allowed.includes(k));
const textField=(value,max)=>typeof value==="string"&&value.trim()===value&&
  value.length>0&&value.length<=max&&!/[\u0000-\u001f\u007f]/.test(value);
const scriptSteps=script=>serializePhiPose(parsePhiPose(script)).split(" > ");
const prefix=(a,b)=>a.length<=b.length&&a.every((step,index)=>step===b[index]);
const error=msg=>{throw new TypeError("Invalid gesture vocabulary: "+msg);};

export function compileVocabulary(input,{imported=true}={}) {
  if(!input || typeof input!=="object" || Array.isArray(input))error("object expected");
  if(!exactKeys(input,["schema","app_id","title","version","commands"]))error("unknown manifest field");
  let serialized="";
  try{serialized=JSON.stringify(input);}catch{error("manifest not JSON-compatible");}
  if(!serialized||serialized.length>20000)error("manifest exceeds 20 KB");
  if(input.schema!==VOCABULARY_SCHEMA)error("unsupported schema");
  if(!textField(input.app_id,31)||!APP_ID.test(input.app_id))error("invalid app ID");
  if(imported && ["phios","system","operator"].includes(input.app_id))error("reserved app ID");
  if(!textField(input.title,60)||!textField(input.version,32)||
    !/^\d+\.\d+\.\d+$/.test(input.version))error("title or version");
  if(!Array.isArray(input.commands)||input.commands.length<1||input.commands.length>12)
    error("expected 1-12 commands");

  const seenIds=new Set(),scripts=[];
  const commands=input.commands.map((cmd,index)=>{
    if(!cmd||typeof cmd!=="object"||Array.isArray(cmd)||
      !exactKeys(cmd,["id","label","description","script","mode"]))
      error("unknown command field at "+index);
    if(!textField(cmd.id,120)||!ACTION_ID.test(cmd.id)||
      !cmd.id.startsWith(input.app_id+"."))error("invalid command namespace");
    if(seenIds.has(cmd.id))error("duplicate command ID");
    seenIds.add(cmd.id);
    if(!textField(cmd.label,64)||!textField(cmd.description,180)||
      !textField(cmd.script,140)||!MODES.includes(cmd.mode))
      error("malformed command");
    if(imported && cmd.mode!=="preview_only")error("imported commands must be preview-only");
    if(cmd.mode==="shell_ui" &&
      (input.app_id!=="phios"||!Object.hasOwn(PHIPOSE_ACTIONS,cmd.id)))
      error("UI routes require built-in PhiOS allowlist");
    let steps;
    try{steps=scriptSteps(cmd.script);}catch{error("malformed gesture program");}
    const canonical=steps.join(" > ");
    for(const other of scripts) {
      // Prefixes would make one command finish before another can complete.
      if(prefix(steps,other.steps)||prefix(other.steps,steps))
        error("colliding or prefix-ambiguous gesture phrase");
    }
    scripts.push({steps});
    return Object.freeze({
      id:cmd.id,label:cmd.label,description:cmd.description,
      script:canonical,mode:cmd.mode
    });
  });
  return Object.freeze({
    schema:VOCABULARY_SCHEMA,app_id:input.app_id,
    title:input.title,version:input.version,
    provenance:imported?"user_import_preview":"bundled_reviewed_reference",
    commands:Object.freeze(commands),
    authority:false,execution_authority:false
  });
}
export function parseImportedVocabulary(json) {
  if(typeof json!=="string"||!json.trim())error("invalid JSON input");
  if(json.length>20000)error("manifest exceeds 20 KB");
  let value;try{value=JSON.parse(json);}catch{error("invalid JSON");}
  return compileVocabulary(value,{imported:true});
}
const builtins=[
  {
    schema:VOCABULARY_SCHEMA,app_id:"phios",title:"PhiOS Shell",version:"0.1.0",
    commands:[
      {id:"phios.view.home",label:"Home",description:"Navigate to PhiShell Home.",
        script:"L:open > R:open",mode:"shell_ui"},
      {id:"phios.view.research",label:"Research",description:"Navigate to PhiShell Research.",
        script:"L:open > R:pinch",mode:"shell_ui"},
      {id:"phios.view.build",label:"Build",description:"Navigate to PhiShell Build.",
        script:"L:point > R:pinch",mode:"shell_ui"},
      {id:"phios.view.ledger",label:"Ledger",description:"Navigate to PhiShell Ledger.",
        script:"L:point > R:open",mode:"shell_ui"},
      {id:"phios.command.open",label:"Command Palette",description:"Open the governed command palette.",
        script:"L:open+R:pinch > L:point",mode:"shell_ui"}
    ]
  },
  {
    schema:VOCABULARY_SCHEMA,app_id:"phioffice",title:"PhiOffice Preview",version:"0.1.0",
    commands:[
      {id:"phioffice.page.next",label:"Next Slide (PhiDeck)",description:"Propose selecting the next PhiDeck slide when an approved host is enabled.",
        script:"L:point > R:swipe-right",mode:"preview_only"},
      {id:"phioffice.page.previous",label:"Previous Slide (PhiDeck)",description:"Propose selecting the previous PhiDeck slide when an approved host is enabled.",
        script:"L:point > R:swipe-left",mode:"preview_only"},
      {id:"phioffice.palette.open",label:"Open Tools",description:"Propose showing the editor tools.",
        script:"L:open > R:pinch",mode:"preview_only"},
      {id:"phioffice.write.section.next",label:"Next Heading (PhiWrite)",
        description:"Move the PhiWrite editor cursor to the next Markdown heading without editing.",
        script:"L:open > R:point",mode:"preview_only"},
      {id:"phioffice.write.section.previous",label:"Previous Heading (PhiWrite)",
        description:"Move the PhiWrite editor cursor to the previous Markdown heading without editing.",
        script:"L:grab > R:point",mode:"preview_only"},
      {id:"phioffice.grid.cell.next",label:"Next Cell (PhiGrid)",
        description:"Focus the next visible grid cell without changing its contents.",
        script:"L:pinch > R:swipe-right",mode:"preview_only"},
      {id:"phioffice.grid.cell.previous",label:"Previous Cell (PhiGrid)",
        description:"Focus the previous visible grid cell without changing its contents.",
        script:"L:pinch > R:swipe-left",mode:"preview_only"}
    ]
  },
  {
    schema:VOCABULARY_SCHEMA,app_id:"domistika",title:"Domistika XR",version:"0.1.0",
    commands:[
      {id:"domistika.brush.next",label:"Next Brush",description:"Choose the next brush style for future strokes only.",
        script:"L:open > R:swipe-right",mode:"preview_only"},
      {id:"domistika.brush.previous",label:"Previous Brush",description:"Choose the previous brush style for future strokes only.",
        script:"L:open > R:swipe-left",mode:"preview_only"},
      {id:"domistika.palette.open",label:"Open Palette",description:"Propose showing paint controls. This action is not implemented in the host.",
        script:"L:open+R:pinch > R:point",mode:"preview_only"},
      {id:"domistika.room.home",label:"Studio Home",
        description:"Navigate to Domistika Studio Home without changing artwork.",
        script:"L:open > R:grab",mode:"preview_only"},
      {id:"domistika.room.canvas",label:"Canvas Studio",
        description:"Navigate to the 2D canvas/easel room without changing artwork.",
        script:"L:point > R:open",mode:"preview_only"},
      {id:"domistika.room.spatial",label:"3D Painting",
        description:"Navigate to spatial painting without starting a stroke.",
        script:"L:point > R:grab",mode:"preview_only"},
      {id:"domistika.room.workshop",label:"Sculpture Workshop",
        description:"Navigate to the sculpture room without modifying objects.",
        script:"L:grab > R:open",mode:"preview_only"},
      {id:"domistika.room.gallery",label:"Art Gallery",
        description:"Navigate to the temporary gallery viewing room.",
        script:"L:grab > R:pinch",mode:"preview_only"}
    ]
  },
  {
    schema:VOCABULARY_SCHEMA,app_id:"genewrist",title:"Gen.E-Wrist Preview",version:"0.1.0",
    commands:[
      {id:"genewrist.menu.open",label:"Open Wrist Menu",description:"Propose opening the wrist tool menu.",
        script:"L:point > R:pinch",mode:"preview_only"},
      {id:"genewrist.menu.close",label:"Close Wrist Menu",description:"Propose closing the wrist tool menu.",
        script:"L:point > R:grab",mode:"preview_only"},
      {id:"genewrist.tool.next",label:"Next Tool",description:"Propose selecting the next tool.",
        script:"L:point > R:swipe-right",mode:"preview_only"}
    ]
  }
];
export const BUILTIN_VOCABULARIES=Object.freeze(builtins.map(x=>compileVocabulary(x,{imported:false})));
export function getVocabulary(catalog,appId) {
  if(!Array.isArray(catalog))return null;
  return catalog.find(x=>x.app_id===appId)||null;
}
/**
 * Only user-selected, valid, preview-only imports are admitted.
 * The registry is a UI lookup, never an authority/capability registry.
 */
export function registerPreviewVocabulary(catalog,newVocabulary) {
  if(!Array.isArray(catalog)||catalog.length>32)error("too many app scopes");
  const safe=compileVocabulary({
    schema:newVocabulary?.schema,app_id:newVocabulary?.app_id,
    title:newVocabulary?.title,version:newVocabulary?.version,
    commands:newVocabulary?.commands?.map(c=>({
      id:c.id,label:c.label,description:c.description,script:c.script,mode:c.mode
    }))
  },{imported:true});
  if(catalog.some(x=>x.app_id===safe.app_id))error("app namespace already registered");
  return Object.freeze([...catalog,safe]);
}
