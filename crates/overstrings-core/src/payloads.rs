use crate::presets::{PresetFamilyId, INTENSITY_HIGH, INTENSITY_LOW, INTENSITY_MEDIUM};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RuntimeEventPayload {
    pub event_id: String,
    pub gate: String,
    pub preset_family_hint: String,
    pub intensity_class: String,
    pub transport_class: String,
    pub degraded_used: bool,
    pub fallback_state: String,
    pub oracle_enabled: Option<bool>,
    pub runtime_mode: Option<String>,
    pub device_profile: Option<String>,
    pub session_id: Option<String>,
}

#[derive(Debug, Error, Clone, PartialEq, Eq)]
pub enum PayloadValidationError {
    #[error("missing required field: {0}")]
    MissingField(&'static str),
    #[error("invalid intensity class: {0}")]
    InvalidIntensity(String),
    #[error("invalid transport class: {0}")]
    InvalidTransport(String),
    #[error("invalid preset family hint: {0}")]
    InvalidPresetHint(String),
}

impl RuntimeEventPayload {
    pub fn validate(&self) -> Result<(), PayloadValidationError> {
        required_string(&self.event_id, "event_id")?;
        required_string(&self.gate, "gate")?;
        required_string(&self.preset_family_hint, "preset_family_hint")?;
        required_string(&self.intensity_class, "intensity_class")?;
        required_string(&self.transport_class, "transport_class")?;
        required_string(&self.fallback_state, "fallback_state")?;

        if !matches!(
            self.intensity_class.as_str(),
            INTENSITY_LOW | INTENSITY_MEDIUM | INTENSITY_HIGH
        ) {
            return Err(PayloadValidationError::InvalidIntensity(
                self.intensity_class.clone(),
            ));
        }

        if !matches!(
            self.transport_class.as_str(),
            "mock" | "serial" | "osc" | "midi"
        ) {
            return Err(PayloadValidationError::InvalidTransport(
                self.transport_class.clone(),
            ));
        }

        if PresetFamilyId::parse(&self.preset_family_hint).is_none() {
            return Err(PayloadValidationError::InvalidPresetHint(
                self.preset_family_hint.clone(),
            ));
        }

        Ok(())
    }

    pub fn from_json(input: &str) -> Result<Self, anyhow::Error> {
        let parsed: RuntimeEventPayload = serde_json::from_str(input)?;
        parsed.validate()?;
        Ok(parsed)
    }
}

fn required_string(value: &str, name: &'static str) -> Result<(), PayloadValidationError> {
    if value.trim().is_empty() {
        return Err(PayloadValidationError::MissingField(name));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::RuntimeEventPayload;

    #[test]
    fn validates_minimum_shape() {
        let payload = RuntimeEventPayload {
            event_id: "evt_001".into(),
            gate: "gate_71_spiral".into(),
            preset_family_hint: "spiral_invoke".into(),
            intensity_class: "medium".into(),
            transport_class: "mock".into(),
            degraded_used: false,
            fallback_state: "none".into(),
            oracle_enabled: Some(true),
            runtime_mode: Some("oracle".into()),
            device_profile: None,
            session_id: None,
        };

        payload.validate().expect("valid payload");
    }
}
