use serde::Serialize;
use std::sync::Mutex;
use tauri::{
  self, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
  SystemTraySubmenu,
};

#[derive(Clone, Serialize)]
pub struct SystemTrayPayload {
  message: String,
}

impl SystemTrayPayload {
  pub fn new(message: &str) -> SystemTrayPayload {
    SystemTrayPayload {
      message: message.into(),
    }
  }
}

pub enum TrayState {
  NotPlaying,
  Paused,
  Playing,
}

pub fn create_tray_menu(lang: String) -> SystemTrayMenu {
  // TODO: tray internationalization https://docs.rs/rust-i18n/latest/rust_i18n/
  // untested, not sure if the macro accepts dynamic languages
  // ENTER rust_i18n::set_locale(lang) IF LOCAL=lang DOES NOT COMPILE
  // .add_item("id".to_string(), t!("Label", locale = lang))
  // .add_item("id".to_string(), t!("Label")

  SystemTrayMenu::new()
    // https://docs.rs/tauri/latest/tauri/struct.SystemTraySubmenu.html
    .add_submenu(SystemTraySubmenu::new(
      "Sub Menu!",
      SystemTrayMenu::new()
        .add_item(CustomMenuItem::new(
          "bf-sep".to_string(),
          "Before Separator",
        ))
        // https://docs.rs/tauri/latest/tauri/enum.SystemTrayMenuItem.html
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("af-sep".to_string(), "After Separator")),
    ))
    // https://docs.rs/tauri/latest/tauri/struct.CustomMenuItem.html#
    .add_item(CustomMenuItem::new("quit".to_string(), "Quit"))
    .add_item(CustomMenuItem::new(
      "toggle-visibility".to_string(),
      "Hide Window",
    ))
    .add_item(CustomMenuItem::new(
      "toggle-tray-icon".to_string(),
      "Toggle the tray icon",
    ))
}

pub fn create_system_tray() -> SystemTray {
  SystemTray::new()
    .with_menu(create_tray_menu("en".into()))
    .with_id("main-tray")
}

#[tauri::command]
#[allow(unused_must_use)]
pub fn tray_update_lang(app: tauri::AppHandle, lang: String) {
  let tray_handle = app.tray_handle();
  tray_handle.set_menu(create_tray_menu(lang));
}

pub fn tray_event_handler(app: &tauri::AppHandle, event: SystemTrayEvent) {
  match event {
    SystemTrayEvent::MenuItemClick { id, .. } => {
      let main_window = app.get_window("main").unwrap();
      main_window
        .emit("systemTray", SystemTrayPayload::new(&id))
        .unwrap();
      let item_handle = app.tray_handle().get_item(&id);
      match id.as_str() {
        "quit" => {
          std::process::exit(0);
        }
        "toggle-tray-icon" => {
          let tray_state_mutex = app.state::<Mutex<TrayState>>();
          let mut tray_state = tray_state_mutex.lock().unwrap();
          match *tray_state {
            TrayState::NotPlaying => {
              app
                .tray_handle()
                .set_icon(tauri::Icon::Raw(
                  include_bytes!("../icons/SystemTray2.ico").to_vec(),
                ))
                .unwrap();
              *tray_state = TrayState::Playing;
            }
            TrayState::Playing => {
              app
                .tray_handle()
                .set_icon(tauri::Icon::Raw(
                  include_bytes!("../icons/SystemTray1.ico").to_vec(),
                ))
                .unwrap();
              *tray_state = TrayState::NotPlaying;
            }
            TrayState::Paused => {}
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
    SystemTrayEvent::LeftClick {
      position: _,
      size: _,
      ..
    } => {
      let main_window = app.get_window("main").unwrap();
      main_window
        .emit("system-tray", SystemTrayPayload::new("left-click"))
        .unwrap();
      println!("system tray received a left click");
    }
    SystemTrayEvent::RightClick {
      position: _,
      size: _,
      ..
    } => {
      println!("system tray received a right click");
    }
    SystemTrayEvent::DoubleClick {
      position: _,
      size: _,
      ..
    } => {
      println!("system tray received a double click");
    }
    _ => {}
  }
}
