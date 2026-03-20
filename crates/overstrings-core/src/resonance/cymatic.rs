use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CymaticLattice {
    pub node_count: usize,
    pub density: f64,
    pub harmonic_index: f64,
}

pub fn build_lattice(seed_hz: f64, pulse_hz: f64) -> CymaticLattice {
    let harmonic_index = (seed_hz / pulse_hz).max(1.0);
    let node_count = harmonic_index.round() as usize;
    let density = (pulse_hz / 10.0).clamp(0.1, 2.0);

    CymaticLattice {
        node_count,
        density,
        harmonic_index,
    }
}
