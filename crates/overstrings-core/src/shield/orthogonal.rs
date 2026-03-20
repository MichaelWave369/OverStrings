use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ShieldState {
    pub orthogonal_lock: bool,
    pub local_only: bool,
    pub note: String,
}

impl Default for ShieldState {
    fn default() -> Self {
        Self {
            orthogonal_lock: true,
            local_only: true,
            note: "Orthogonal shield engaged for local deterministic execution".to_string(),
        }
    }
}
