use crate::resonance::primebeat::PulseReport;
use crate::state::session::Session;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ContinuityMetrics {
    pub session_age_seconds: u64,
    pub pulse_consistency: f64,
    pub artifact_integrity: f64,
    pub continuity_score: f64,
    pub notes: String,
}

pub fn compute_metrics(
    session: &Session,
    pulse: &PulseReport,
    artifact_present: bool,
    now_unix: u64,
) -> ContinuityMetrics {
    let age = now_unix.saturating_sub(session.created_unix);
    let pulse_consistency = (1.0 - pulse.drift_hz.abs() / pulse.target_hz).clamp(0.0, 1.0);
    let artifact_integrity = if artifact_present { 1.0 } else { 0.4 };
    let continuity_score = (pulse_consistency * 0.7) + (artifact_integrity * 0.3);

    ContinuityMetrics {
        session_age_seconds: age,
        pulse_consistency,
        artifact_integrity,
        continuity_score,
        notes: "Deterministic local continuity estimate".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::compute_metrics;
    use crate::resonance::primebeat::run_primebeat;
    use crate::state::session::Session;

    #[test]
    fn continuity_score_in_range() {
        let session = Session::new("seed", 432.0, "text");
        let pulse = run_primebeat(10);
        let metrics = compute_metrics(&session, &pulse, true, session.created_unix + 5);
        assert!((0.0..=1.0).contains(&metrics.continuity_score));
    }
}
