use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TrellisStatus {
    pub available: bool,
    pub hook_intent: String,
}

pub fn status() -> TrellisStatus {
    TrellisStatus {
        available: false,
        hook_intent: "Discovery/install hook scaffold ready; runtime bridge not implemented"
            .to_string(),
    }
}
