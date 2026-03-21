use crate::presets::PresetFamilyId;
use crate::transports::{ResonanceTransport, TransportReceipt};

#[derive(Debug, Default)]
pub struct MidiTransport;

impl ResonanceTransport for MidiTransport {
    fn class(&self) -> &'static str {
        "midi"
    }

    fn emit(&mut self, _family: PresetFamilyId, _intensity_class: &str) -> TransportReceipt {
        TransportReceipt {
            transport_class: self.class().into(),
            emitted_pattern: "not_implemented_yet".into(),
            available: false,
        }
    }
}
