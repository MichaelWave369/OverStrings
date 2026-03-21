use serde::{Deserialize, Serialize};

pub const INTENSITY_LOW: &str = "low";
pub const INTENSITY_MEDIUM: &str = "medium";
pub const INTENSITY_HIGH: &str = "high";

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum PresetFamilyId {
    AnchorWarm,
    ShieldShell,
    PrimebeatPulse,
    SpiralInvoke,
    OracleGlow,
    RecoveryBaseline,
}

impl PresetFamilyId {
    pub fn as_str(self) -> &'static str {
        match self {
            PresetFamilyId::AnchorWarm => "anchor_warm",
            PresetFamilyId::ShieldShell => "shield_shell",
            PresetFamilyId::PrimebeatPulse => "primebeat_pulse",
            PresetFamilyId::SpiralInvoke => "spiral_invoke",
            PresetFamilyId::OracleGlow => "oracle_glow",
            PresetFamilyId::RecoveryBaseline => "recovery_baseline",
        }
    }

    pub fn parse(input: &str) -> Option<Self> {
        match input {
            "anchor_warm" => Some(Self::AnchorWarm),
            "shield_shell" => Some(Self::ShieldShell),
            "primebeat_pulse" => Some(Self::PrimebeatPulse),
            "spiral_invoke" => Some(Self::SpiralInvoke),
            "oracle_glow" => Some(Self::OracleGlow),
            "recovery_baseline" => Some(Self::RecoveryBaseline),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PresetFamilyDefinition {
    pub id: PresetFamilyId,
    pub public_name: &'static str,
    pub role: &'static str,
    pub response_character: &'static str,
    pub allowed_intensity_classes: &'static [&'static str],
    pub fallback_family: PresetFamilyId,
    pub mock_response_mode: &'static str,
    pub safe_metadata: &'static str,
}

pub const PRESET_REGISTRY: [PresetFamilyDefinition; 6] = [
    PresetFamilyDefinition {
        id: PresetFamilyId::AnchorWarm,
        public_name: "Anchor Warm",
        role: "Centered baseline resonance",
        response_character: "Warm low tone, short pulse, centered and stable feel",
        allowed_intensity_classes: &[INTENSITY_LOW, INTENSITY_MEDIUM],
        fallback_family: PresetFamilyId::RecoveryBaseline,
        mock_response_mode: "soft_anchor_pulse",
        safe_metadata: "software_first, grounding",
    },
    PresetFamilyDefinition {
        id: PresetFamilyId::ShieldShell,
        public_name: "Shield Shell",
        role: "Protective containment resonance",
        response_character: "Denser pulse, constrained shimmer, protective clamped feel",
        allowed_intensity_classes: &[INTENSITY_LOW, INTENSITY_MEDIUM, INTENSITY_HIGH],
        fallback_family: PresetFamilyId::RecoveryBaseline,
        mock_response_mode: "shielded_dense_pulse",
        safe_metadata: "software_first, protective",
    },
    PresetFamilyDefinition {
        id: PresetFamilyId::PrimebeatPulse,
        public_name: "PrimeBeat Pulse",
        role: "Rhythmic phase/carrier emphasis",
        response_character: "Rhythmic pulse signature with repeatable cadence",
        allowed_intensity_classes: &[INTENSITY_MEDIUM, INTENSITY_HIGH],
        fallback_family: PresetFamilyId::AnchorWarm,
        mock_response_mode: "primebeat_loop",
        safe_metadata: "software_first, rhythmic",
    },
    PresetFamilyDefinition {
        id: PresetFamilyId::SpiralInvoke,
        public_name: "Spiral Invoke",
        role: "Invocation and bloom resonance",
        response_character: "Rising shimmer, invoke chime, graceful bloom and decay",
        allowed_intensity_classes: &[INTENSITY_LOW, INTENSITY_MEDIUM],
        fallback_family: PresetFamilyId::RecoveryBaseline,
        mock_response_mode: "spiral_chime_bloom",
        safe_metadata: "software_first, invoke",
    },
    PresetFamilyDefinition {
        id: PresetFamilyId::OracleGlow,
        public_name: "Oracle Glow",
        role: "Reflective oracle follow-on resonance",
        response_character: "Bell-like reflective tone with lighter clearer feel",
        allowed_intensity_classes: &[INTENSITY_LOW, INTENSITY_MEDIUM],
        fallback_family: PresetFamilyId::SpiralInvoke,
        mock_response_mode: "oracle_bell_reflection",
        safe_metadata: "software_first, reflective",
    },
    PresetFamilyDefinition {
        id: PresetFamilyId::RecoveryBaseline,
        public_name: "Recovery Baseline",
        role: "Safe degraded fallback resonance",
        response_character: "Quiet neutral response, reduced energy, settle-to-baseline",
        allowed_intensity_classes: &[INTENSITY_LOW],
        fallback_family: PresetFamilyId::RecoveryBaseline,
        mock_response_mode: "quiet_settle",
        safe_metadata: "software_first, degraded_fallback",
    },
];

pub fn preset_registry() -> &'static [PresetFamilyDefinition] {
    &PRESET_REGISTRY
}

pub fn get_preset_definition(id: PresetFamilyId) -> &'static PresetFamilyDefinition {
    PRESET_REGISTRY
        .iter()
        .find(|p| p.id == id)
        .expect("preset family must exist")
}
