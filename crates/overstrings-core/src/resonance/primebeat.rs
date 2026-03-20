use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PulseReport {
    pub target_hz: f64,
    pub cycles: u32,
    pub measured_hz: f64,
    pub drift_hz: f64,
}

pub fn run_primebeat(cycles: u32) -> PulseReport {
    let target_hz = 10.0;
    let correction = (cycles as f64 % 5.0) * 0.01;
    let measured_hz = target_hz - correction;
    let drift_hz = measured_hz - target_hz;

    PulseReport {
        target_hz,
        cycles,
        measured_hz,
        drift_hz,
    }
}

#[cfg(test)]
mod tests {
    use super::run_primebeat;

    #[test]
    fn pulse_report_stays_close_to_target() {
        let report = run_primebeat(12);
        assert!((report.target_hz - 10.0).abs() < f64::EPSILON);
        assert!(report.measured_hz > 9.9);
    }
}
