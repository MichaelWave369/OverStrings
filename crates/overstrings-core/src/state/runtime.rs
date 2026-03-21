use crate::presets::PresetFamilyId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ResonanceRuntimeState {
    pub resonance_status: String,
    pub active_family: String,
    pub transport_class: String,
    pub response_mode: String,
    pub degraded: bool,
    pub fallback_used: bool,
    pub last_event_id: String,
    pub last_gate: String,
    pub available: bool,
}

impl ResonanceRuntimeState {
    pub fn initial(transport_class: impl Into<String>) -> Self {
        Self {
            resonance_status: "idle".into(),
            active_family: PresetFamilyId::RecoveryBaseline.as_str().into(),
            transport_class: transport_class.into(),
            response_mode: "software".into(),
            degraded: false,
            fallback_used: false,
            last_event_id: "none".into(),
            last_gate: "none".into(),
            available: true,
        }
    }
}
