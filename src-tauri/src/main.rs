// this hides the console for Windows release builds
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use serde::Serialize;
use tauri_plugin_store;
use tauri_plugin_window_state;
use window_shadows::set_shadow;
#[cfg(target_os = "linux")]
use fork::{daemon, Fork};
#[cfg(target_os = "linux")]
use std::{fs::metadata, path::PathBuf};
use std::{process::Command, ops::Deref, sync::Mutex};
// Manager is used by .get_window
use tauri::{self, Manager, State, SystemTray, SystemTrayMenu, SystemTraySubmenu, CustomMenuItem, SystemTrayMenuItem, SystemTrayEvent};

#[derive(Clone, Serialize)]
struct SingleInstancePayload {
  args: Vec<String>,
  cwd: String,
}

#[derive(Clone, Serialize)]
struct SystemTrayPayload {
  message: String
}

enum TrayState {
  NotPlaying,
  Paused,
  Playing
}

#[derive(Debug, Default, Serialize)]
struct Example<'a> {
    #[serde(rename = "Attribute 1")]
    attribute_1: &'a str,
}

/*
// useful if not saving the window state
#[tauri::command]
fn show_main_window(window: tauri::Window) {
    // replace "main" by the name of your window
    window.get_window("main").unwrap().show().unwrap();
}
*/

fn create_tray_menu(lang: String) -> SystemTrayMenu {
  // TODO: https://docs.rs/rust-i18n/latest/rust_i18n/
  // untested, not sure if the macro accepts dynamic languages
  // ENTER rust_i18n::set_locale(lang) IF LOCAL=lang DOES NOT COMPILE
  SystemTrayMenu::new()
    // .add_item("id".into(), t!("Label", locale = lang))
    // .add_item("id".into(), t!("Label")
    // .add_submenu("Submenu")
    // .add_native_item(item)
}

#[tauri::command]
#[allow(unused_must_use)]
fn update_tray_lang(app_handle: tauri::AppHandle, lang: String) {
  let tray_handle = app_handle.tray_handle();
  tray_handle.set_menu(create_tray_menu(lang));
}

#[tauri::command]
fn process_file(filepath: String) -> String {
    println!("Processing file: {}", filepath);
    "Hello from Rust!".into()
}

// TODO: organize better
#[tauri::command]
fn show_in_folder(path: String) {
  #[cfg(target_os = "windows")]
  {
    Command::new("explorer")
        .args(["/select,", &path]) // The comma after select is not a typo
        .spawn()
        .unwrap();
  }

  #[cfg(target_os = "linux")]
  {
    if path.contains(",") {
      // see https://gitlab.freedesktop.org/dbus/dbus/-/issues/76
      let new_path = match metadata(&path).unwrap().is_dir() {
        true => path,
        false => {
          let mut path2 = PathBuf::from(path);
          path2.pop();
          path2.into_os_string().into_string().unwrap()
        }
      };
      Command::new("xdg-open")
          .arg(&new_path)
          .spawn()
          .unwrap();
    } else {
      if let Ok(Fork::Child) = daemon(false, false) {
        Command::new("dbus-send")
            .args(["--session", "--dest=org.freedesktop.FileManager1", "--type=method_call",
                  "/org/freedesktop/FileManager1", "org.freedesktop.FileManager1.ShowItems",
                  format!("array:string:\"file://{path}\"").as_str(), "string:\"\""])
            .spawn()
            .unwrap();
      }
    }
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open")
        .args(["-R", &path])
        .spawn()
        .unwrap();
  }
}

fn main() {
  // https://docs.rs/tauri/1.2.2/tauri/struct.SystemTrayMenu.html
  let tray_menu_en = SystemTrayMenu::new()
    // https://docs.rs/tauri/1.2.2/tauri/struct.SystemTraySubmenu.html
    .add_submenu(
      SystemTraySubmenu::new("Sub Menu!", SystemTrayMenu::new()
          .add_item(CustomMenuItem::new("bf-sep".to_string(), "Before Separator"))
          // https://docs.rs/tauri/1.2.2/tauri/enum.SystemTrayMenuItem.html
          .add_native_item(SystemTrayMenuItem::Separator)
          .add_item(CustomMenuItem::new("af-sep".to_string(), "After Separator"))
      ))
    // https://docs.rs/tauri/1.2.2/tauri/struct.CustomMenuItem.html#
    .add_item(CustomMenuItem::new("quit".to_string(), "Quit"))
    .add_item(CustomMenuItem::new("toggle-visibility".to_string(), "Hide Window"))
    .add_item(CustomMenuItem::new("toggle-tray-icon".to_string(), "Toggle the tray icon"));
  // https://docs.rs/tauri/1.2.2/tauri/struct.SystemTray.html
  let system_tray = SystemTray::new().with_menu(tray_menu_en).with_id("main-tray");

  // main window should be invisible to allow either the setup delay or the plugin to show the window
  tauri::Builder::default()
    // system tray
    .system_tray(system_tray)
    .on_system_tray_event(|app, event| match event {
      // https://tauri.app/v1/guides/features/system-tray/#preventing-the-app-from-closing
      SystemTrayEvent::MenuItemClick { id, .. } => {
        let main_window = app.get_window("main").unwrap();
        main_window.emit("systemTray", SystemTrayPayload { message: id.clone() }).unwrap();
        let item_handle = app.tray_handle().get_item(&id);
        match id.as_str() {
          "quit" => { std::process::exit(0); }
          "toggle-tray-icon" => {
              let tray_state_mutex = app.state::<Mutex<TrayState>>();
              let mut tray_state = tray_state_mutex.lock().unwrap();
              match *tray_state {
                TrayState::NotPlaying => {
                  app.tray_handle().set_icon(tauri::Icon::Raw(include_bytes!("../icons/SystemTray2.ico").to_vec())).unwrap();
                  *tray_state = TrayState::Playing;
                }
                TrayState::Playing => {
                  app.tray_handle().set_icon(tauri::Icon::Raw(include_bytes!("../icons/SystemTray1.ico").to_vec())).unwrap();
                  *tray_state = TrayState::NotPlaying;
                }
                TrayState::Paused => {},
              };
          }
          "toggle-visibility" => {
            // update menu item example
            if main_window.is_visible().unwrap() {
                main_window.hide().unwrap();
                item_handle.set_title("Show Window").unwrap();
            } else {
                main_window.show().unwrap();
                item_handle.set_title("Hide Window").unwrap();
            }
          }
          _ => {}
        }
      }
      SystemTrayEvent::LeftClick { position: _, size: _, .. } => {
        let main_window = app.get_window("main").unwrap();
        main_window.emit("system-tray", SystemTrayPayload { message: "left-click".into() }).unwrap();
        println!("system tray received a left click");
      }
      SystemTrayEvent::RightClick { position: _, size: _, .. } => {
        println!("system tray received a right click");
      }
      SystemTrayEvent::DoubleClick { position: _, size: _, .. } => {
        println!("system tray received a double click");
      }
      _ => {}
    })
    // custom commands
    .invoke_handler(tauri::generate_handler![/* show_main_window, */update_tray_lang, process_file, show_in_folder])
    // allow only one instance and propagate args and cwd to existing instance
    .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
      app.emit_all("newInstance", SingleInstancePayload { args, cwd }).unwrap();
    }))
    // persistent storage with filesystem
    .plugin(tauri_plugin_store::Builder::default().build())
    // save window position and size between sessions
    // if you remove this, make sure to uncomment the show_main_window code
    //  in this file and TauriProvider.jsx
    .plugin(tauri_plugin_window_state::Builder::default().build())
    // custom setup code
    .setup(|app| {
        app.manage(Mutex::new(TrayState::NotPlaying));
        if let Some(window) = app.get_window("main") {
          set_shadow(&window, true).ok(); // don't care if platform is unsupported
        }
        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// useful crates
// https://crates.io/crates/directories for getting common directories

// TODO: optimize permissions
// TODO: decorations false and use custom title bar
