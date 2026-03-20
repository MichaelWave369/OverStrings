use assert_cmd::Command;
use predicates::str::contains;

#[test]
fn version_command_runs() {
    let mut cmd = Command::cargo_bin("overstrings").expect("bin");
    cmd.arg("version")
        .assert()
        .success()
        .stdout(contains("overstrings"));
}

#[test]
fn tune_command_runs() {
    let mut cmd = Command::cargo_bin("overstrings").expect("bin");
    cmd.args(["tune", "--seed", "432.0"])
        .assert()
        .success()
        .stdout(contains("band_0"));
}

#[test]
fn mandala_text_runs() {
    let mut cmd = Command::cargo_bin("overstrings").expect("bin");
    cmd.args(["mandala", "--format", "text"])
        .assert()
        .success()
        .stdout(contains("Mandala Frame"));
}
