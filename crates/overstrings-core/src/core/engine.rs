use crate::core::continuity::{compute_metrics, ContinuityMetrics};
use crate::core::tuning::TuningProfile;
use crate::integration::{siglstudio, trellis};
use crate::mandala::render::MandalaFrame;
use crate::mandala::sigl_bridge::{build_export, SiglExportArtifact};
use crate::resonance::cymatic::build_lattice;
use crate::resonance::primebeat::{run_primebeat, PulseReport};
use crate::state::session::Session;

#[derive(Debug, Clone)]
pub struct ResonanceEngine {
    pub session: Session,
    pub tuning: TuningProfile,
}

impl ResonanceEngine {
    pub fn new(session: Session) -> Self {
        let tuning = TuningProfile::from_seed(session.seed_frequency_hz, session.profile.clone());
        Self { session, tuning }
    }

    pub fn pulse(&self, cycles: u32) -> PulseReport {
        run_primebeat(cycles)
    }

    pub fn mandala_frame(&self, pulse_hz: f64) -> MandalaFrame {
        MandalaFrame {
            profile: self.session.profile.clone(),
            seed_hz: self.session.seed_frequency_hz,
            pulse_hz,
            lattice: build_lattice(self.session.seed_frequency_hz, pulse_hz),
        }
    }

    pub fn sigl_export(&self, pulse_hz: f64) -> SiglExportArtifact {
        build_export(self.mandala_frame(pulse_hz))
    }

    pub fn continuity(
        &self,
        pulse: &PulseReport,
        artifact_present: bool,
        now_unix: u64,
    ) -> ContinuityMetrics {
        compute_metrics(&self.session, pulse, artifact_present, now_unix)
    }

    pub fn integration_snapshot(&self) -> String {
        let t = trellis::status();
        let s = siglstudio::status();
        format!(
            "trellis.available={} siglstudio.export_ready={} siglstudio.live_bridge={}",
            t.available, s.export_ready, s.live_bridge
        )
    }
}
