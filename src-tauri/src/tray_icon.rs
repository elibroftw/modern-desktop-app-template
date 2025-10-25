use serde::Serialize;
use std::sync::Mutex;
use tauri::menu::{Menu, MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{self, command, Emitter, Manager, Runtime};

#[derive(Clone, Serialize)]
pub struct IconTrayPayload {
  message: String,
}

impl IconTrayPayload {
  pub fn new(message: &str) -> IconTrayPayload {
    IconTrayPayload {
      message: message.into(),
    }
  }
}

pub enum TrayState {
  NotPlaying,
  Paused,
  Playing,
}

// https://v2.tauri.app/start/migrate/from-tauri-1/#migrate-to-menu-module
pub fn create_tray_menu<R: Runtime>(
  app: &tauri::AppHandle<R>,
  lang: String,
) -> Result<Menu<R>, tauri::Error> {
  // TODO: tray internationalization https://docs.rs/rust-i18n/latest/rust_i18n/
  // untested, not sure if the macro accepts dynamic languages
  // ENTER rust_i18n::set_locale(lang) IF LOCAL=lang DOES NOT COMPILE
  // .add_item("id".to_string(), t!("Label", locale = lang))
  // .add_item("id".to_string(), t!("Label")
  let toggle = MenuItemBuilder::with_id("toggle-visibility", "Hide Window")
    .accelerator("Ctrl+Shift+T")
    .build(app)?;
  MenuBuilder::new(app)
    .items(&[
      &SubmenuBuilder::new(app, "Sub Menu!")
        // .item(...)
        // .items(...)
        .text("bf-sep", "Before Separator")
        .separator()
        .text("af-sep", "After Separator")
        .build()?,
      &toggle,
      &MenuItemBuilder::with_id("quit", "Quit")
        .accelerator("Ctrl+Q")
        .build(app)?,
      &MenuItemBuilder::with_id("toggle-tray-icon", "Toggle the tray icon").build(app)?,
    ])
    .build()
}

static TRAY_ID: &'static str = "main";

pub fn create_tray_icon(app: &tauri::AppHandle) -> Result<TrayIcon, tauri::Error> {
  TrayIconBuilder::with_id(TRAY_ID)
		.icon(tauri::image::Image::from_bytes(include_bytes!("../icons/SystemTray1.ico")).ok().expect("SystemTray1.icon not found"))
    .menu(&create_tray_menu(app, "en".into())?)
		.tooltip("App Tooltip")
    .show_menu_on_left_click(false)
    .on_menu_event(move |app, event| {
      if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.emit("systemTray", IconTrayPayload::new(&event.id().as_ref()));
      }
      let tray_icon = app.tray_by_id(TRAY_ID).unwrap();

      // TODO: FIGURE OUT HOW TO GET THE ITEM HANDLER IN v2
      // let item_handle: MenuItem = tray_icon.get_item();

      match event.id().as_ref() {
        "quit" => {
          std::process::exit(0);
        }
        "toggle-tray-icon" => {
          let tray_state_mutex = app.state::<Mutex<TrayState>>();
          let mut tray_state = tray_state_mutex.lock().unwrap();
          match *tray_state {
            TrayState::NotPlaying => {
              tray_icon
                .set_icon(
                  tauri::image::Image::from_bytes(include_bytes!("../icons/SystemTray2.ico")).ok(),
                )
                .unwrap();
              *tray_state = TrayState::Playing;
            }
            TrayState::Playing => {
              tray_icon
                .set_icon(
                  tauri::image::Image::from_bytes(include_bytes!("../icons/SystemTray1.ico")).ok(),
                )
                .unwrap();
              *tray_state = TrayState::NotPlaying;
            }
            TrayState::Paused => {}
          };
        }
        "toggle-visibility" => {
          if let Some(main_window) = app.get_webview_window("main") {
            // update menu item example (TODO: support tauri v2)
            // proposed implementation: update entire menu
            if main_window.is_visible().unwrap() {
              main_window.hide().unwrap();
              // item_handle.set_title("Show Window").unwrap();
            } else {
              main_window.show().unwrap();
              // item_handle.set_title("Hide Window").unwrap();
            }
          }
        }
        _ => {}
      }
    })
    .on_tray_icon_event(|tray, event| {
      let app = tray.app_handle();
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        if let Some(main_window) = app.get_webview_window("main") {
          let _ = main_window.emit("system-tray", IconTrayPayload::new("left-click"));
          let _ = main_window.show();
          let _ = main_window.set_focus();
        }
        println!("system tray received a left click");
      } else if let TrayIconEvent::Click {
        button: MouseButton::Right,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        println!("system tray received a right click");
      } else if let TrayIconEvent::DoubleClick { .. } = event {
        println!("system tray received a double click");
      }
    })
    .build(app)
}

#[command]
#[allow(unused_must_use)]
pub fn tray_update_lang(app: tauri::AppHandle, lang: String) {
  let tray_handle = app.tray_by_id(TRAY_ID);
  if let Some(t) = tray_handle {
    t.set_menu(create_tray_menu(&app, lang).ok());
  }
}
