// main.rs — Tauri backend for md-reader
//
// Responsibilities:
// 1. Read the markdown file path from CLI args
// 2. Expose read_file IPC command for the WebView to fetch content
// 3. Watch the file for changes using the notify crate
// 4. Emit "file-changed" events to the WebView when the file is modified

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

/// Shared state: the path to the markdown file being viewed
struct AppState {
    file_path: PathBuf,
}

/// IPC command: read the markdown file and return its contents as a string
#[tauri::command]
fn read_file(state: tauri::State<'_, AppState>) -> Result<String, String> {
    fs::read_to_string(&state.file_path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Start watching the file for changes, emitting "file-changed" events to the WebView
fn start_watcher(app_handle: AppHandle, file_path: PathBuf) {
    std::thread::spawn(move || {
        // Debounce: ignore events within 100ms of the last one
        let last_event = Arc::new(Mutex::new(Instant::now() - Duration::from_secs(1)));
        let last_event_clone = Arc::clone(&last_event);
        let app = app_handle.clone();
        let path = file_path.clone();

        let mut watcher = RecommendedWatcher::new(
            move |result: Result<Event, notify::Error>| {
                if let Ok(event) = result {
                    // Only react to modification events
                    if matches!(
                        event.kind,
                        EventKind::Modify(_) | EventKind::Create(_)
                    ) {
                        let mut last = last_event_clone.lock().unwrap();
                        if last.elapsed() < Duration::from_millis(100) {
                            return; // Debounce
                        }
                        *last = Instant::now();

                        // Read the updated file content and emit to WebView
                        if let Ok(content) = fs::read_to_string(&path) {
                            let _ = app.emit("file-changed", content);
                        }
                    }
                }
            },
            Config::default(),
        )
        .expect("Failed to create file watcher");

        // Watch the parent directory (covers file renames/recreates by editors)
        let watch_dir = file_path.parent().unwrap_or(&file_path);
        watcher
            .watch(watch_dir.as_ref(), RecursiveMode::NonRecursive)
            .expect("Failed to start watching file");

        // Keep the watcher alive
        loop {
            std::thread::sleep(Duration::from_secs(1));
        }
    });
}

/// Resolve a relative path by trying the given base directory first, then walking
/// up to parent directories. This handles `cargo tauri dev` where the binary's CWD
/// is src-tauri/ but the user typed the path relative to tauri-app/.
fn resolve_relative_path(base: &PathBuf, relative: &PathBuf) -> PathBuf {
    let mut dir = base.clone();
    // Try up to 3 parent levels (src-tauri → tauri-app → project root → above)
    for _ in 0..4 {
        let candidate = dir.join(relative);
        if let Ok(resolved) = candidate.canonicalize() {
            return resolved;
        }
        // Move up one directory
        if !dir.pop() {
            break;
        }
    }
    // Nothing found — return the original CWD-based path so the error message is clear
    base.join(relative)
}

fn main() {
    let cwd = std::env::current_dir().unwrap_or_default();

    // Parse CLI args early — before Tauri setup() — for correct path resolution.
    let args: Vec<String> = std::env::args().collect();
    let file_path = if args.len() > 1 {
        let p = PathBuf::from(&args[1]);
        if p.is_absolute() {
            p
        } else {
            // During `cargo tauri dev`, the binary CWD is src-tauri/ — one level
            // deeper than the user's shell (tauri-app/). Try CWD first, then walk
            // up parent directories to find the file. In production, the OS passes
            // absolute paths via file associations, so this only matters for dev.
            resolve_relative_path(&cwd, &p)
        }
    } else {
        // No file argument — will show a friendly message in setup()
        PathBuf::new()
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![read_file])
        .setup(move |app| {
            // Validate the file path
            if file_path.as_os_str().is_empty() {
                eprintln!("Usage: md-reader <file.md>");
                eprintln!("No file specified. Please provide a markdown file path.");
                std::process::exit(1);
            }

            if !file_path.exists() {
                eprintln!("Error: File not found: {}", file_path.display());
                std::process::exit(1);
            }

            // Set the window title to the filename
            let filename = file_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("md-reader");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title(&format!("{} — md-reader", filename));
            }

            // Store the file path in app state
            app.manage(AppState {
                file_path: file_path.clone(),
            });

            // Start file watcher for live-reload
            start_watcher(app.handle().clone(), file_path);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error running md-reader");
}
