use anyhow::Context;
use clap::{Parser, Subcommand, ValueEnum};
use overstrings_core::bridge::SoftwareBridge;
use overstrings_core::integration::{siglstudio, trellis};
use overstrings_core::payloads::RuntimeEventPayload;
use overstrings_core::state::session::{load_session, save_session, Session};
use overstrings_core::ResonanceEngine;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Parser, Debug)]
#[command(
    name = "overstrings",
    version,
    about = "OverStrings CLI (v0.1 seed foundation)",
    long_about = "CLI-first, local-first resonance control surface for OverStrings.",
    arg_required_else_help = true
)]
struct Cli {
    /// Local state directory for inspectable session artifacts.
    #[arg(long, default_value = ".overstrings", global = true)]
    state_dir: PathBuf,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Start a live local session and persist state.
    Play {
        /// Profile name for this session.
        #[arg(long, default_value = "default")]
        profile: String,
        /// Seed frequency in Hz.
        #[arg(long, default_value_t = 432.0)]
        seed: f64,
    },
    /// Compute and print the tuning ladder for a seed frequency.
    Tune {
        /// Seed frequency in Hz.
        #[arg(long, default_value_t = 432.0)]
        seed: f64,
    },
    /// Render mandala output in text or JSON fallback modes.
    Mandala {
        /// Output format.
        #[arg(long, value_enum, default_value_t = OutputFormat::Text)]
        format: OutputFormat,
        /// Optional output path for JSON export.
        #[arg(long)]
        output: Option<PathBuf>,
    },
    /// Run a deterministic 10 Hz PrimeBeat pulse simulation.
    Pulse {
        /// Number of pulse cycles.
        #[arg(long, default_value_t = 10)]
        cycles: u32,
    },
    /// Compute continuity diagnostics from local session state.
    Continuity,
    /// Show a concise system snapshot.
    Status,
    /// Demo the OverStrings software bridge with safe mock payloads.
    BridgeDemo {
        #[arg(long, value_enum, default_value_t = BridgeScenario::All)]
        scenario: BridgeScenario,
    },
    /// Process a safe JSON payload through the software bridge.
    BridgeEvent {
        #[arg(long)]
        payload: String,
        #[arg(long, default_value = "mock")]
        transport: String,
    },
    /// Show safe runtime bridge state.
    BridgeState {
        #[arg(long, default_value = "mock")]
        transport: String,
    },
    /// Show OverStrings build and version information.
    Version,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, ValueEnum)]
enum OutputFormat {
    Text,
    Json,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, ValueEnum)]
enum BridgeScenario {
    All,
    Anchor,
    Spiral,
    Degraded,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    fs::create_dir_all(&cli.state_dir)?;

    match cli.command {
        Commands::Play { profile, seed } => {
            let session = Session::new(profile, seed, "text");
            let path = save_session(&cli.state_dir, &session)?;
            let engine = ResonanceEngine::new(session);
            println!("command: play");
            println!("session: {}", engine.session.id);
            println!("profile: {}", engine.session.profile);
            println!("seed_hz: {:.3}", engine.session.seed_frequency_hz);
            println!("render_mode: {}", engine.session.render_mode);
            println!("state_saved: {}", path.display());
        }
        Commands::Tune { seed } => {
            let session = Session::new("tuning", seed, "text");
            let engine = ResonanceEngine::new(session);
            println!("command: tune");
            println!("tuning_profile: {}", engine.tuning.name);
            for (idx, hz) in engine.tuning.bands_hz.iter().enumerate() {
                println!("band_{idx}: {:.3} Hz", hz);
            }
        }
        Commands::Mandala { format, output } => {
            let session = load_or_default(&cli.state_dir)?;
            let engine = ResonanceEngine::new(session);
            let pulse = engine.pulse(10);
            let frame = engine.mandala_frame(pulse.measured_hz);
            println!("command: mandala");
            match format {
                OutputFormat::Text => println!("{}", frame.to_text()),
                OutputFormat::Json => {
                    let body = serde_json::to_string_pretty(&frame)?;
                    if let Some(path) = output {
                        fs::write(&path, &body)
                            .with_context(|| format!("write {}", path.display()))?;
                        println!("mandala_exported: {}", path.display());
                    } else {
                        println!("{}", body);
                    }
                }
            }
        }
        Commands::Pulse { cycles } => {
            let session = load_or_default(&cli.state_dir)?;
            let engine = ResonanceEngine::new(session);
            let pulse = engine.pulse(cycles);
            println!("command: pulse");
            println!("target_hz: {:.3}", pulse.target_hz);
            println!("measured_hz: {:.3}", pulse.measured_hz);
            println!("drift_hz: {:.3}", pulse.drift_hz);
            println!("cycles: {}", pulse.cycles);
        }
        Commands::Continuity => {
            let session = load_or_default(&cli.state_dir)?;
            let engine = ResonanceEngine::new(session);
            let pulse = engine.pulse(10);
            let now_unix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            let metrics = engine.continuity(
                &pulse,
                cli.state_dir.join("session.json").exists(),
                now_unix,
            );
            println!("command: continuity");
            println!("session_age_seconds: {}", metrics.session_age_seconds);
            println!("pulse_consistency: {:.3}", metrics.pulse_consistency);
            println!("artifact_integrity: {:.3}", metrics.artifact_integrity);
            println!("continuity_score: {:.3}", metrics.continuity_score);
            println!("notes: {}", metrics.notes);
        }
        Commands::Status => {
            let session = load_or_default(&cli.state_dir)?;
            let engine = ResonanceEngine::new(session);
            let t = trellis::status();
            let s = siglstudio::status();
            println!("command: status");
            println!("profile: {}", engine.session.profile);
            println!("seed_hz: {:.3}", engine.session.seed_frequency_hz);
            println!("shield_local_only: {}", engine.session.shield.local_only);
            println!("trellis_available: {}", t.available);
            println!("siglstudio_export_ready: {}", s.export_ready);
            println!("integration: {}", engine.integration_snapshot());
        }
        Commands::BridgeDemo { scenario } => {
            run_bridge_demo(scenario)?;
        }
        Commands::BridgeEvent { payload, transport } => {
            let mut bridge = SoftwareBridge::with_transport_class(&transport);
            let payload = RuntimeEventPayload::from_json(&payload)?;
            let result = bridge.process_event(payload)?;
            println!("command: bridge-event");
            println!("family: {}", result.family);
            println!("degraded: {}", result.degraded);
            println!("fallback_used: {}", result.fallback_used);
            println!("pattern: {}", result.emitted_pattern);
            println!("available: {}", result.available);
        }
        Commands::BridgeState { transport } => {
            let bridge = SoftwareBridge::with_transport_class(&transport);
            println!("command: bridge-state");
            println!("{}", serde_json::to_string_pretty(bridge.runtime_state())?);
        }
        Commands::Version => {
            println!("command: version");
            println!("overstrings {}", env!("CARGO_PKG_VERSION"));
            println!("build: seed-local-first");
        }
    }

    Ok(())
}

fn run_bridge_demo(scenario: BridgeScenario) -> anyhow::Result<()> {
    let mut bridge = SoftwareBridge::with_transport_class("mock");
    let payloads = match scenario {
        BridgeScenario::All => vec![
            sample_payload("evt_anchor", "gate_65_anchor", "anchor_warm", "low", false),
            sample_payload(
                "evt_prime",
                "gate_68_prime",
                "primebeat_pulse",
                "high",
                false,
            ),
            sample_payload(
                "evt_shield",
                "gate_69_shield",
                "shield_shell",
                "medium",
                false,
            ),
            sample_payload(
                "evt_spiral",
                "gate_71_spiral",
                "spiral_invoke",
                "medium",
                false,
            ),
            RuntimeEventPayload {
                event_id: "evt_oracle".into(),
                gate: "gate_71_spiral".into(),
                preset_family_hint: "oracle_glow".into(),
                intensity_class: "low".into(),
                transport_class: "mock".into(),
                degraded_used: false,
                fallback_state: "none".into(),
                oracle_enabled: Some(true),
                runtime_mode: Some("oracle_follow_on".into()),
                device_profile: Some("local_demo".into()),
                session_id: Some("demo_session".into()),
            },
            RuntimeEventPayload {
                event_id: "evt_recovery".into(),
                gate: "gate_reset".into(),
                preset_family_hint: "recovery_baseline".into(),
                intensity_class: "low".into(),
                transport_class: "mock".into(),
                degraded_used: true,
                fallback_state: "degraded".into(),
                oracle_enabled: Some(false),
                runtime_mode: Some("safe".into()),
                device_profile: None,
                session_id: None,
            },
        ],
        BridgeScenario::Anchor => {
            vec![sample_payload(
                "evt_anchor",
                "gate_65_anchor",
                "anchor_warm",
                "low",
                false,
            )]
        }
        BridgeScenario::Spiral => vec![sample_payload(
            "evt_spiral",
            "gate_71_spiral",
            "spiral_invoke",
            "medium",
            false,
        )],
        BridgeScenario::Degraded => vec![RuntimeEventPayload {
            event_id: "evt_recovery".into(),
            gate: "gate_reset".into(),
            preset_family_hint: "recovery_baseline".into(),
            intensity_class: "low".into(),
            transport_class: "mock".into(),
            degraded_used: true,
            fallback_state: "degraded".into(),
            oracle_enabled: Some(false),
            runtime_mode: Some("safe".into()),
            device_profile: None,
            session_id: None,
        }],
    };

    println!("command: bridge-demo");
    for payload in payloads {
        let result = bridge.process_event(payload)?;
        println!(
            "event={} family={} degraded={} pattern={}",
            result.event_id, result.family, result.degraded, result.emitted_pattern
        );
    }
    println!(
        "safe_runtime_state={} ",
        serde_json::to_string_pretty(bridge.runtime_state())?
    );

    Ok(())
}

fn sample_payload(
    event_id: &str,
    gate: &str,
    hint: &str,
    intensity: &str,
    degraded: bool,
) -> RuntimeEventPayload {
    RuntimeEventPayload {
        event_id: event_id.into(),
        gate: gate.into(),
        preset_family_hint: hint.into(),
        intensity_class: intensity.into(),
        transport_class: "mock".into(),
        degraded_used: degraded,
        fallback_state: if degraded {
            "degraded".into()
        } else {
            "none".into()
        },
        oracle_enabled: Some(false),
        runtime_mode: Some("normal".into()),
        device_profile: Some("local_demo".into()),
        session_id: Some("demo_session".into()),
    }
}

fn load_or_default(state_dir: &std::path::Path) -> anyhow::Result<Session> {
    Ok(load_session(state_dir)?.unwrap_or_else(|| Session::new("default", 432.0, "text")))
}
