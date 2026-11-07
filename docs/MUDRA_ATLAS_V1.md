# OverStrings Rung 6 — Sourced Mudra Atlas (research edition)

**Status:** reference collection + static browsing page; **not** a hand-pose classifier or gameplay binding.

## Why this exists

A circulated "36 sacred mudras" poster conflates Buddhist iconography, Indian dance hastas, later yoga teaching mnemonics, and some incorrect hand drawings. There is no historically universal canonical set of 36 mudras. A named gesture may have different shapes or uses in different lineages. The atlas therefore identifies **source tradition**, **physical description**, **historical association**, **variant/limitation**, and **recognition readiness** separately.

The catalogue does **not** say any pose detoxifies, changes blood chemistry, grants prosperity, or directly heals a condition. An attributed symbolic association is not a biomedical claim. We do not equate symbolic gesture, yogic mudra/bandha, and dance hasta merely because English sometimes calls them all "mudras."

## Primary historical corpora and trusted interpretive references

| Corpus | Scope | Study starting point |
| --- | --- | --- |
| Nāṭyaśāstra, ch. IX | 24 single-hand, 13 combined-hand, plus nṛtta hand families; named gestures have multiple theatrical uses | https://www.wisdomlib.org/hinduism/book/the-natyashastra/d/doc209706.html |
| Abhinaya Darpaṇa, chs. 12–13 | 28 single-hand hastas in ch. 12; ch. 13 names 24 combined hands in the 1917 translation (counts can vary between manuscripts, editions and secondary accounts) | https://www.wisdomlib.org/hinduism/book/the-mirror-of-gesture/d/doc143269.html and https://www.wisdomlib.org/hinduism/book/the-mirror-of-gesture/d/doc143271.html |
| Haṭha Yoga Pradīpikā, ch. III, verses 6–7 | Ten named mudra/bandha practices, many **not finger configurations** | https://www.wisdomlib.org/hinduism/book/hatha-yoga-pradipika-english/d/doc7976.html |
| Gheraṇḍa Saṃhitā, ch. III, verses 1–3 | Twenty-five mudras, including groups of dhāraṇās and bodily practices; not interchangeable with 25 hand signs | https://sarvakosh.com/granth/gheranda-samhita-saptanga-yoga-hindi |
| Buddhist/Hindu/Jain iconography | Artwork and variant-dependent gestures, including abhaya, varada, dhyana and dharmachakra | https://www.metmuseum.org/essays/recognizing-the-gods |
| Buddhist mudra reference | Common Buddhist mudras, plus their iconographic relationships and variants | https://imp-art.org/collections/sacred-gestures-mudras-in-buddhist-iconography/ and https://imp-art.org/articles/dharmachakra-mudra/ |
| Scholarly comparative study | Explains differing numbers of single and two-hand hastas across texts | https://sangeetgalaxy.co.in/wp-content/uploads/2020/07/4.-Garima-Tandon.pdf |

**Editorial caution:** These are accessible editions/translations and iconographic summaries, not claims to reconstruct a single first or original performance. Translation choices differ. Expert cultural review remains a future requirement.

## Shipped data and page

- `web/mudra-atlas.mjs`: read-only, source-linked 13-entry research catalogue with separate `pose` and `meaning` fields, explicit tracking constraints, and **no** action binding.
- `web/mudra-atlas.html`: searchable static educational page. It uses local JavaScript only and never opens XR or requests a hand pose, microphone or camera.
- `ABHINAYA_DARPANA_SINGLE_28`: index of all 28 single-hand names in one accessible translation. Index membership is **not** evidence that the app can recognize that pose.
- `HATHA_PRADIPIKA_TEN`: names of ten hatha practices. Not presented as finger-gesture templates.
- `web/tests/mudra-atlas.test.mjs`: source, uniqueness and safety invariants.

Catalogue entries are representative, not universal. For example, **Abhaya** in Buddhist iconography is an elevated outward-facing palm, **Dhyana** is commonly palms-up in the lap, **Anjali** is joined palms and is also described in classical drama/dance, **Mushti** is a fist, and **Shikhara** has a raised thumb. A thumbs-up icon cannot simply be renamed Kubera.

## Relationship to existing OverStrings

Existing modules remain intact:

1. `web/gesture.mjs` recognizes only provisional `open`, `pinch`, `grab`, `point` and `neutral` using current per-hand heuristics.
2. `web/motion.mjs` and `web/phrases.mjs` support *manually triggered* research captures and comparisons, not persistent identity recognition.
3. `web/action-gateway.mjs` and `web/host-sdk.mjs` are separate consent-gated advisory preview layers. No atlas entry automatically maps to an action.
4. A named hand pose must never be passed into a host just because a text label matches. In particular, `pinch` and `vitarka` or `chin` are **not** interchangeable without source and full-context verification.

## Proposed next stage: historical geometry → calibrated XR experiments

Each future reviewed pose should add (a) `source_edition` and page/verse/plate, (b) region/lineage and alternate forms, (c) source license, (d) independent cultural review, and (e) a shape-specific test plan. A gesture's cultural description remains immutable even if a separate host assigns a modern optional use.

Research detector features, in order:
1. **Palm-relative hand skeleton:** 25 XRHand joints/hand; normalized finger joint angles and tip-to-tip distances, scaled to each observed hand.
2. **Orientation:** derive a robust palm normal only from valid tracked joints, then separately evaluate hand elevation relative to available head/body references.
3. **Two-hand relations:** relative wrist transforms, hand-to-hand distances, finger pairing and crossings, with mirror/left-hand variants recorded explicitly.
4. **Geometry + temporal stability:** collect examples from multiple people with varied hand proportions, both hands, multiple rotation angles, occlusions, seated/standing use and hard negative examples. Distinguish "unrecognized" from "neutral" and surface uncertainty.
5. **Confidence calibration:** validate *per pose* with real Quest 3 captures; publish confusion matrices, false-trigger rates and latency before any action proposal.
6. **Explicit opt-in controls:** demonstration/reference mode first; separate, revocable host permissions and safe fallback for each game. Preserve controller access and accessibility alternatives.

Full-body mudras and poses requiring knees/lap/earth are **out of scope** for 25-hand-joint-only recognition. Some historical religious or contemplative practices may not be appropriate as game commands. Obtain input from living practitioners and historians before publishing stronger claims or prominent sacred imagery.

## Acceptance criteria for this rung

- New atlas can be browsed without starting the WebXR session.
- Every entry identifies source(s), representative pose, traditional association, tracking constraint and an explicit no-action-binding status.
- The original gesture tracker and host permissions are unchanged.
- Node test suite runs alongside existing browser-logic tests; no new dependencies.
- User should not mistake a reference entry for an active, recognized or scientifically validated gesture.

**Verification remains:** deployed GitHub Pages and real headset recognition have not been demonstrated by writing this document. The atlas is an educational seed.
