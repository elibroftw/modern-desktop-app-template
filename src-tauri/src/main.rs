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
struct Example<'a> {
    #[serde(rename = "Attribute 1")]
    attribute_1: &'a str,
}

#[tauri::command]
fn custom_command(window: tauri::Window) {}

fn main() {
  // main window should be invisible to allow either the setup delay or the plugin to show the window
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![custom_command])
    // .setup(|app| {
    //     // Delay window open in order to avoid white flash described https://github.com/tauri-apps/tauri/issues/1564
    //     let main_window = app.get_window("main").unwrap();
    //     tauri::async_runtime::spawn(async move {
    //         sleep(Duration::from_millis(175));
    //         main_window.show().unwrap();
    //     });
    //     Ok(())
    // })
    // maximized window issues: https://github.com/tauri-apps/tauri-plugin-window-state/issues/21
    .plugin(tauri_plugin_window_state::WindowState::default())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// useful crates
// https://crates.io/crates/directories for getting common directories

// TODO: optimize permissions
// TODO: decorations false and use custom title bar
