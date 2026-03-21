use crate::presets::PresetFamilyId;

pub mod midi;
pub mod mock;
pub mod osc;
pub mod serial;

#[derive(Debug, Clone)]
pub struct TransportReceipt {
    pub transport_class: String,
    pub emitted_pattern: String,
    pub available: bool,
}

pub trait ResonanceTransport: Send {
    fn class(&self) -> &'static str;
    fn emit(&mut self, family: PresetFamilyId, intensity_class: &str) -> TransportReceipt;
}
