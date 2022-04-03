// this hides the console for Windows release builds
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use serde:: Serialize;
use std::{collections::BTreeMap, fs};
use tauri;
use tauri::Manager;  // used by .get_window
use std::thread::sleep;
use std::time::Duration;
use tauri_plugin_window_state;

#[derive(Debug, Default, Serialize)]
struct Settings<'a> {
    #[serde(rename = "Color Scheme")]
    color_scheme: &'a str,
}

#[tauri::command]
fn custom_command(window: tauri::Window) {}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![custom_command])
    .setup(|app| {
        // Work around for https://github.com/tauri-apps/tauri/issues/1564
        //  Delay window open in order to avoid white flash
        let main_window = app.get_window("main").unwrap();
        tauri::async_runtime::spawn(async move {
            sleep(Duration::from_millis(175));
            main_window.show().unwrap();
        });
        Ok(())
    })
    // https://github.com/tauri-apps/tauri-plugin-window-state/issues/21
    // .plugin(tauri_plugin_window_state::WindowState::default())  // requires visible: false
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
