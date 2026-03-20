use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SiglStudioStatus {
    pub live_bridge: bool,
    pub export_ready: bool,
}

pub fn status() -> SiglStudioStatus {
    SiglStudioStatus {
        live_bridge: false,
        export_ready: true,
    }
}
