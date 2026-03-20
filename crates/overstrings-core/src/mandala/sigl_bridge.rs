use crate::mandala::render::MandalaFrame;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SiglExportArtifact {
    pub schema: String,
    pub frame: MandalaFrame,
    pub mode: String,
}

pub fn build_export(frame: MandalaFrame) -> SiglExportArtifact {
    SiglExportArtifact {
        schema: "overstrings.sigl.v0".to_string(),
        frame,
        mode: "offline-export".to_string(),
    }
}
