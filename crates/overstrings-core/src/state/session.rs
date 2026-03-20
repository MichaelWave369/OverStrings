use crate::shield::orthogonal::ShieldState;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Session {
    pub id: String,
    pub profile: String,
    pub seed_frequency_hz: f64,
    pub render_mode: String,
    pub created_unix: u64,
    pub shield: ShieldState,
}

impl Session {
    pub fn new(
        profile: impl Into<String>,
        seed_frequency_hz: f64,
        render_mode: impl Into<String>,
    ) -> Self {
        let created_unix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        Self {
            id: format!("session-{created_unix}"),
            profile: profile.into(),
            seed_frequency_hz,
            render_mode: render_mode.into(),
            created_unix,
            shield: ShieldState::default(),
        }
    }
}

pub fn save_session(state_dir: &Path, session: &Session) -> anyhow::Result<PathBuf> {
    fs::create_dir_all(state_dir)?;
    let path = state_dir.join("session.json");
    let body = serde_json::to_string_pretty(session)?;
    fs::write(&path, body)?;
    Ok(path)
}

pub fn load_session(state_dir: &Path) -> anyhow::Result<Option<Session>> {
    let path = state_dir.join("session.json");
    if !path.exists() {
        return Ok(None);
    }
    let body = fs::read_to_string(path)?;
    Ok(Some(serde_json::from_str(&body)?))
}

#[cfg(test)]
mod tests {
    use super::{load_session, save_session, Session};

    #[test]
    fn round_trip_session() {
        let dir = std::env::temp_dir().join("overstrings_test_state");
        let _ = std::fs::remove_file(dir.join("session.json"));
        let session = Session::new("test", 440.0, "text");
        save_session(&dir, &session).expect("save");
        let loaded = load_session(&dir).expect("load").expect("present");
        assert_eq!(loaded.profile, "test");
    }
}
