use chrono::Local;
use std::{
    env,
    fs::{create_dir_all, OpenOptions},
    io::{self, Write},
    path::PathBuf,
};

pub fn log_dir() -> PathBuf {
    let home = env::var_os("HOME")
        .or_else(|| env::var_os("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));

    home.join("MarkFlowyPlus").join("logs")
}

pub fn log_path() -> PathBuf {
    log_dir().join("markflowyplus.log")
}

pub fn append_line(line: impl AsRef<str>) -> io::Result<()> {
    let dir = log_dir();
    create_dir_all(&dir)?;

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(dir.join("markflowyplus.log"))?;

    writeln!(file, "{}", line.as_ref())
}

pub fn append_app_line(level: &str, target: &str, message: impl AsRef<str>) -> io::Result<()> {
    append_line(format!(
        "{} [{level}] [{target}] {}",
        Local::now().format("%Y-%m-%d %H:%M:%S%.3f"),
        message.as_ref()
    ))
}

pub struct LogFileWriter;

impl Write for LogFileWriter {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        let dir = log_dir();
        create_dir_all(&dir)?;

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(dir.join("markflowyplus.log"))?;

        file.write_all(buf)?;
        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

#[tauri::command]
pub fn write_frontend_log(level: String, message: String) -> Result<(), String> {
    append_app_line(&level, "frontend", message).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn get_log_file_path() -> String {
    log_path().to_string_lossy().to_string()
}
