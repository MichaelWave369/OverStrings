use crate::payloads::{PayloadValidationError, RuntimeEventPayload};
use crate::presets::{get_preset_definition, PresetFamilyId};
use crate::state::runtime::ResonanceRuntimeState;
use crate::transports::midi::MidiTransport;
use crate::transports::mock::MockTransport;
use crate::transports::osc::OscTransport;
use crate::transports::serial::SerialTransport;
use crate::transports::{ResonanceTransport, TransportReceipt};
use thiserror::Error;

pub struct SoftwareBridge {
    transport: Box<dyn ResonanceTransport>,
    runtime_state: ResonanceRuntimeState,
}

#[derive(Debug, Clone)]
pub struct BridgeEventResult {
    pub event_id: String,
    pub family: String,
    pub degraded: bool,
    pub fallback_used: bool,
    pub emitted_pattern: String,
    pub available: bool,
}

#[derive(Debug, Error)]
pub enum BridgeError {
    #[error(transparent)]
    Validation(#[from] PayloadValidationError),
}

impl SoftwareBridge {
    pub fn with_transport_class(transport_class: &str) -> Self {
        let transport = transport_from_class(transport_class);
        Self {
            runtime_state: ResonanceRuntimeState::initial(transport.class()),
            transport,
        }
    }

    pub fn process_event(
        &mut self,
        payload: RuntimeEventPayload,
    ) -> Result<BridgeEventResult, BridgeError> {
        payload.validate()?;

        let (family, fallback_used) = resolve_family(&payload);
        let definition = get_preset_definition(family);
        let (resolved_family, did_degrade) = if definition
            .allowed_intensity_classes
            .contains(&payload.intensity_class.as_str())
        {
            (family, false)
        } else {
            (definition.fallback_family, true)
        };

        let receipt = self
            .transport
            .emit(resolved_family, &payload.intensity_class);
        self.update_state(
            &payload,
            resolved_family,
            fallback_used || did_degrade,
            &receipt,
        );

        Ok(BridgeEventResult {
            event_id: payload.event_id,
            family: resolved_family.as_str().into(),
            degraded: payload.degraded_used || did_degrade,
            fallback_used: fallback_used || did_degrade,
            emitted_pattern: receipt.emitted_pattern,
            available: receipt.available,
        })
    }

    fn update_state(
        &mut self,
        payload: &RuntimeEventPayload,
        family: PresetFamilyId,
        fallback_used: bool,
        receipt: &TransportReceipt,
    ) {
        self.runtime_state.resonance_status = if receipt.available {
            "responsive".into()
        } else {
            "degraded".into()
        };
        self.runtime_state.active_family = family.as_str().into();
        self.runtime_state.transport_class = receipt.transport_class.clone();
        self.runtime_state.degraded = payload.degraded_used || !receipt.available;
        self.runtime_state.fallback_used = fallback_used;
        self.runtime_state.last_event_id = payload.event_id.clone();
        self.runtime_state.last_gate = payload.gate.clone();
        self.runtime_state.available = receipt.available;
    }

    pub fn runtime_state(&self) -> &ResonanceRuntimeState {
        &self.runtime_state
    }
}

pub fn resolve_family(payload: &RuntimeEventPayload) -> (PresetFamilyId, bool) {
    if payload.degraded_used || payload.fallback_state != "none" {
        return (PresetFamilyId::RecoveryBaseline, true);
    }

    let hint = PresetFamilyId::parse(&payload.preset_family_hint);
    if let Some(hint_family) = hint {
        if hint_family != PresetFamilyId::OracleGlow || payload.oracle_enabled.unwrap_or(false) {
            return (hint_family, false);
        }
    }

    if payload.oracle_enabled.unwrap_or(false)
        && matches!(
            payload.runtime_mode.as_deref(),
            Some("oracle") | Some("oracle_follow_on")
        )
    {
        return (PresetFamilyId::OracleGlow, false);
    }

    let gate_num = parse_gate_number(&payload.gate);
    let mapped = match gate_num {
        Some(65) => PresetFamilyId::AnchorWarm,
        Some(68) => PresetFamilyId::PrimebeatPulse,
        Some(69) => PresetFamilyId::ShieldShell,
        Some(71) => PresetFamilyId::SpiralInvoke,
        _ => PresetFamilyId::RecoveryBaseline,
    };
    let used_fallback = mapped == PresetFamilyId::RecoveryBaseline;
    (mapped, used_fallback)
}

fn parse_gate_number(gate: &str) -> Option<u32> {
    let numeric: String = gate.chars().filter(|c| c.is_ascii_digit()).collect();
    numeric.parse::<u32>().ok()
}

fn transport_from_class(class: &str) -> Box<dyn ResonanceTransport> {
    match class {
        "serial" => Box::new(SerialTransport),
        "osc" => Box::new(OscTransport),
        "midi" => Box::new(MidiTransport),
        _ => Box::new(MockTransport),
    }
}

#[cfg(test)]
mod tests {
    use super::{resolve_family, SoftwareBridge};
    use crate::payloads::RuntimeEventPayload;

    fn payload(gate: &str) -> RuntimeEventPayload {
        RuntimeEventPayload {
            event_id: "evt_01".into(),
            gate: gate.into(),
            preset_family_hint: "anchor_warm".into(),
            intensity_class: "medium".into(),
            transport_class: "mock".into(),
            degraded_used: false,
            fallback_state: "none".into(),
            oracle_enabled: Some(false),
            runtime_mode: Some("normal".into()),
            device_profile: None,
            session_id: None,
        }
    }

    #[test]
    fn maps_gate_and_fallbacks() {
        let mut p = payload("gate_65_anchor");
        p.preset_family_hint = "unknown".into();
        assert_eq!(resolve_family(&p).0.as_str(), "anchor_warm");
        p.gate = "gate_unknown".into();
        assert_eq!(resolve_family(&p).0.as_str(), "recovery_baseline");
    }

    #[test]
    fn bridge_updates_safe_state() {
        let mut bridge = SoftwareBridge::with_transport_class("mock");
        let result = bridge.process_event(payload("gate_71_spiral")).expect("ok");
        assert!(result.emitted_pattern.contains("warm_low_tone"));
        assert_eq!(bridge.runtime_state().resonance_status, "responsive");
    }
}
