use serde::{Deserialize, Serialize};

pub const GOLDEN_RATIO: f64 = 1.618_033_988_75;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TuningProfile {
    pub name: String,
    pub seed_frequency_hz: f64,
    pub bands_hz: Vec<f64>,
}

impl TuningProfile {
    pub fn from_seed(seed_frequency_hz: f64, name: impl Into<String>) -> Self {
        let bands_hz = (0..7)
            .map(|step| seed_frequency_hz * GOLDEN_RATIO.powf(step as f64 / 2.0))
            .collect();

        Self {
            name: name.into(),
            seed_frequency_hz,
            bands_hz,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::TuningProfile;

    #[test]
    fn seed_profile_has_expected_band_count() {
        let p = TuningProfile::from_seed(432.0, "seed");
        assert_eq!(p.bands_hz.len(), 7);
        assert!((p.bands_hz[0] - 432.0).abs() < 1e-8);
    }
}
