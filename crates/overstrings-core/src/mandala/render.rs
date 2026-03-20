use crate::resonance::cymatic::CymaticLattice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MandalaFrame {
    pub profile: String,
    pub seed_hz: f64,
    pub pulse_hz: f64,
    pub lattice: CymaticLattice,
}

impl MandalaFrame {
    pub fn to_text(&self) -> String {
        format!(
            "Mandala Frame\nprofile: {}\nseed_hz: {:.3}\npulse_hz: {:.3}\nnodes: {}\ndensity: {:.3}",
            self.profile,
            self.seed_hz,
            self.pulse_hz,
            self.lattice.node_count,
            self.lattice.density
        )
    }
}

#[cfg(test)]
mod tests {
    use super::MandalaFrame;
    use crate::resonance::cymatic::build_lattice;

    #[test]
    fn text_render_contains_profile() {
        let frame = MandalaFrame {
            profile: "vineyard".to_string(),
            seed_hz: 432.0,
            pulse_hz: 10.0,
            lattice: build_lattice(432.0, 10.0),
        };
        assert!(frame.to_text().contains("vineyard"));
    }
}
