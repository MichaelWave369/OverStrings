use crate::presets::PresetFamilyId;
use crate::transports::{ResonanceTransport, TransportReceipt};

#[derive(Debug, Default)]
pub struct MockTransport;

impl ResonanceTransport for MockTransport {
    fn class(&self) -> &'static str {
        "mock"
    }

    fn emit(&mut self, family: PresetFamilyId, intensity_class: &str) -> TransportReceipt {
        let emitted_pattern = match family {
            PresetFamilyId::AnchorWarm => {
                format!("warm_low_tone|short_pulse|stable_center::{intensity_class}")
            }
            PresetFamilyId::ShieldShell => {
                format!("dense_pulse|constrained_shimmer|protective_clamp::{intensity_class}")
            }
            PresetFamilyId::PrimebeatPulse => {
                format!("rhythmic_pulse|phase_carrier_emphasis|repeat_signature::{intensity_class}")
            }
            PresetFamilyId::SpiralInvoke => {
                format!("rising_shimmer|invoke_chime|bloom_decay::{intensity_class}")
            }
            PresetFamilyId::OracleGlow => {
                format!("bell_reflection|clear_light|oracle_aftertone::{intensity_class}")
            }
            PresetFamilyId::RecoveryBaseline => {
                format!("quiet_neutral|reduced_energy|settle_baseline::{intensity_class}")
            }
        };

        TransportReceipt {
            transport_class: self.class().into(),
            emitted_pattern,
            available: true,
        }
    }
}
