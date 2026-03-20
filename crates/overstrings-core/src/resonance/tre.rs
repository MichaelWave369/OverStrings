use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TreResonanceState {
    pub engaged: bool,
    pub description: String,
}

impl Default for TreResonanceState {
    fn default() -> Self {
        Self {
            engaged: false,
            description: "TRE resonance path is stubbed in v0.1".to_string(),
        }
    }
}
