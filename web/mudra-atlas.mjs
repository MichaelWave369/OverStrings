/**
 * OverStrings Mudra Atlas v1. A SOURCE-LINKED CULTURAL REFERENCE, not a classifier.
 * No gesture detection, intents, uploads, accounts, telemetry, or automatic action binding.
 * Descriptions summarize representative variants; practitioners may use other forms.
 */
export const MUDRA_SOURCES = Object.freeze({
  met: Object.freeze({title:"The Metropolitan Museum of Art — Recognizing the Gods", url:"https://www.metmuseum.org/essays/recognizing-the-gods", type:"museum"}),
  gandhara: Object.freeze({title:"The Metropolitan Museum of Art — The Art of Gandhara", url:"https://resources.metmuseum.org/resources/metpublications/pdf/The_Art_of_Gandhara_in_The_Metropolitan_Museum_of_Art.pdf", type:"museum"}),
  buddhist: Object.freeze({title:"Impart Encyclopedia of Art — Buddhist Mudras", url:"https://imp-art.org/collections/sacred-gestures-mudras-in-buddhist-iconography/", type:"encyclopedia"}),
  wheel: Object.freeze({title:"Impart Encyclopedia of Art — Dharmachakra Mudra", url:"https://imp-art.org/articles/dharmachakra-mudra/", type:"encyclopedia"}),
  ad_single: Object.freeze({title:"Abhinaya Darpaṇa, ch. 12 (1917 English translation)", url:"https://www.wisdomlib.org/hinduism/book/the-mirror-of-gesture/d/doc143269.html", type:"historical_text_translation"}),
  ad_combined: Object.freeze({title:"Abhinaya Darpaṇa, ch. 13 (1917 English translation)", url:"https://www.wisdomlib.org/hinduism/book/the-mirror-of-gesture/d/doc143271.html", type:"historical_text_translation"}),
  natya: Object.freeze({title:"Nāṭyaśāstra, ch. IX (English translation)", url:"https://www.wisdomlib.org/hinduism/book/the-natyashastra/d/doc209706.html", type:"historical_text_translation"}),
  hatha: Object.freeze({title:"Haṭha Yoga Pradīpikā, ch. III (English translation)", url:"https://www.wisdomlib.org/hinduism/book/hatha-yoga-pradipika-english/d/doc7976.html", type:"historical_text_translation"}),
  gheranda: Object.freeze({title:"Gheraṇḍa Saṃhitā, ch. III (Sanskrit and English)", url:"https://sarvakosh.com/granth/gheranda-samhita-saptanga-yoga-hindi", type:"historical_text_translation"})
});
const row = (id,name,tradition,kind,pose,meaning,sourceIds,tracking,notes="") =>
  ({id,name,tradition,kind,pose,meaning,sourceIds,tracking,notes,status:"historically_attested_reference",actionBinding:"none"});
export const MUDRA_CATALOG = Object.freeze([
  row("buddhist.abhaya","Abhaya","Buddhist iconography","single_hand",
    "Representative form: one hand raised, fingers open, palm outward toward the viewer.",
    "Reassurance, fearlessness, and protection.",["met","gandhara","buddhist"],"single_hand_candidate",
    "Palm facing and raised posture matter. Variations occur across periods and regions."),
  row("buddhist.varada","Varada","Buddhist iconography","single_hand",
    "Representative form: extended hand lowered with fingers generally pointing down, open palm visible.",
    "Giving, charity, or bestowal.",["met","buddhist"],"requires_body_context",
    "A lowered arm cannot be reliably located relative to the body from hand joints alone."),
  row("buddhist.dhyana","Dhyana","Buddhist iconography","two_hand",
    "Representative form: upward-facing palms resting one above the other in the lap.",
    "Meditation or absorption.",["met","buddhist"],"requires_body_context",
    "Hands-in-lap location depends on body tracking; thumb positions vary by tradition."),
  row("buddhist.dharmachakra","Dharmachakra","Buddhist iconography","two_hand",
    "Common form: two hands before the chest, with index finger and thumb of each forming a circle.",
    "Turning the wheel of Dharma; teaching, especially the first sermon.",["met","gandhara","wheel"],"two_hand_candidate",
    "Iconographic variants exist; two-hand finger contact may occlude XR joints."),
  row("buddhist.bhumisparsha","Bhumisparsha","Buddhist iconography","body_context",
    "Seated representative form: right hand reaches down across the knee toward earth, left hand rests in lap.",
    "Calling the earth to witness the Buddha's awakening.",["buddhist"],"requires_body_context",
    "Not a distinct isolated finger shape. Requires body/knee/ground context."),
  row("buddhist.vitarka","Vitarka","Buddhist iconography","single_hand",
    "Common teaching-discussion form: one hand raised with thumb and index touching in a circle.",
    "Discussion or exposition of the teachings.",["wheel"],"single_hand_candidate",
    "Can be visually confused with other thumb-index circle gestures; context is essential."),
  row("dance.pataka","Pataka","Abhinaya Darpaṇa / dance","single_hand",
    "Four fingers extended and held together; thumb bent toward the fingers or palm.",
    "A codified expressive hand with many contextual uses, including cloud, wind, and prohibition.",["ad_single","natya"],"single_hand_candidate",
    "One hasta is not one fixed emotional state."),
  row("dance.tripat āka".replace(" ",""),"Tripataka","Abhinaya Darpaṇa / dance","single_hand",
    "Start from Pataka, then bend the ring finger while the other three long fingers stay extended.",
    "A codified expressive hand used for a crown, tree, flame, and other meanings.",["ad_single","natya"],"single_hand_candidate"),
  row("dance.mushti","Mushti","Abhinaya Darpaṇa / dance","single_hand",
    "Close the four fingers into the palm and lay the thumb over them.",
    "A fist form used for gripping, steadiness, and wrestling.",["ad_single","natya"],"single_hand_candidate"),
  row("dance.shikhara","Shikhara","Abhinaya Darpaṇa / dance","single_hand",
    "Clenched fist with thumb extended upward.",
    "A stage sign with context-dependent uses, including bow, pillar, and questioning.",["ad_single","natya"],"single_hand_candidate",
    "This traditional hand form can resemble a modern thumbs-up, but does not have the same universal meaning."),
  row("dance.kapittha","Kapittha","Abhinaya Darpaṇa / dance","single_hand",
    "From Shikhara, curve the index finger over the raised thumb.",
    "Expressive uses include depicting Lakshmi or Sarasvati and grasping fabric or flowers.",["ad_single","natya"],"single_hand_candidate"),
  row("dance.trishula","Trishula","Abhinaya Darpaṇa / dance","single_hand",
    "Bend thumb and little finger, leaving index, middle, and ring fingers extended.",
    "Trident or three-together sign.",["ad_single"],"single_hand_candidate"),
  row("dance.anjali","Anjali","Nāṭyaśāstra / Abhinaya Darpaṇa","two_hand",
    "Place two Pataka hands palm to palm, fingers together and pointing upward.",
    "Salutation and respect; hand height depends on whom the performer addresses.",["natya","ad_combined","gandhara"],"two_hand_candidate")
].map(x=>Object.freeze({...x,sourceIds:Object.freeze(x.sourceIds)})));
export const ABHINAYA_DARPANA_SINGLE_28 = Object.freeze([
  "Pataka","Tripataka","Ardha-pataka","Kartarimukha","Mayura","Ardhachandra","Arala","Shukatundaka",
  "Mushti","Shikhara","Kapittha","Katakamukha","Suchi","Chandrakala","Padmakosha","Sarpashirsha",
  "Mrigashirsha","Simhamukha","Kangula","Alapadma","Chatura","Bhramara","Hamsasya","Hamsapaksha",
  "Sandamsha","Mukula","Tamrachuda","Trishula"
]);
export const HATHA_PRADIPIKA_TEN = Object.freeze([
  "Mahamudra","Mahabandha","Mahavedha","Khechari","Uddiyana Bandha","Mula Bandha",
  "Jalandhara Bandha","Viparita Karani","Vajroli","Shakti Chalana"
]);
export const MUDRA_ATLAS_VERSION = "overstrings.mudra-atlas.v1";
export function findMudras(query="",tradition="all") {
  const q=String(query).toLocaleLowerCase().trim();
  return MUDRA_CATALOG.filter(item =>
    (tradition==="all"||item.tradition.includes(tradition)) &&
    (!q||[item.name,item.pose,item.meaning,item.tradition].some(s=>s.toLocaleLowerCase().includes(q)))
  );
}
export function getMudraById(id) {
  return MUDRA_CATALOG.find(x=>x.id===id) || null;
}
