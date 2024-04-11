use serde::Serialize;
use std::process::Command;
use std::time::Duration;
// State is used by linux
use tauri::{Manager, State};

#[cfg(not(target_os = "windows"))]
use std::path::PathBuf;

#[cfg(target_os = "linux")]
use crate::DbusState;

#[cfg(target_os = "linux")]
#[tauri::command]
pub fn show_item_in_folder(path: String, dbus_state: State<DbusState>) -> Result<(), String> {
  let dbus_guard = dbus_state.0.lock().map_err(|e| e.to_string())?;

  // see https://gitlab.freedesktop.org/dbus/dbus/-/issues/76
  if dbus_guard.is_none() || path.contains(",") {
    let mut path_buf = PathBuf::from(&path);
    let new_path = match path_buf.is_dir() {
      true => path,
      false => {
        path_buf.pop();
        path_buf.into_os_string().into_string().unwrap()
      }
    };
    Command::new("xdg-open")
      .arg(&new_path)
      .spawn()
      .map_err(|e| format!("{e:?}"))?;
  } else {
    // https://docs.rs/dbus/latest/dbus/
    let dbus = dbus_guard.as_ref().unwrap();
    let proxy = dbus.with_proxy(
      "org.freedesktop.FileManager1",
      "/org/freedesktop/FileManager1",
      Duration::from_secs(5),
    );
    let (_,): (bool,) = proxy
      .method_call(
        "org.freedesktop.FileManager1",
        "ShowItems",
        (vec![format!("file://{path}")], ""),
      )
      .map_err(|e| e.to_string())?;
  }
  Ok(())
}

#[cfg(not(target_os = "linux"))]
#[tauri::command]
pub fn show_item_in_folder(path: String) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    Command::new("explorer")
      .args(["/select,", &path]) // The comma after select is not a typo
      .spawn()
      .map_err(|e| e.to_string())?;
  }

  #[cfg(target_os = "macos")]
  {
    let path_buf = PathBuf::from(&path);
    if path_buf.is_dir() {
      Command::new("open")
        .args([&path])
        .spawn()
        .map_err(|e| e.to_string())?;
    } else {
      Command::new("open")
        .args(["-R", &path])
        .spawn()
        .map_err(|e| e.to_string())?;
    }
  }
  Ok(())
}

// useful if not saving the window state
#[tauri::command]
pub fn show_main_window(window: tauri::Window) {
  // replace "main" by the name of your window
  window.get_window("main").unwrap().show().unwrap();
}

#[derive(Clone, Serialize)]
struct LongRunningThreadStruct {
  message: String,
}

pub async fn long_running_thread(app: &tauri::AppHandle) {
  loop {
    // sleep
    tokio::time::sleep(Duration::from_secs(2)).await;
    let _ = app.get_window("main").and_then(|w| {
      w.emit(
        "longRunningThread",
        LongRunningThreadStruct {
          message: "LRT Message".into(),
        },
      )
      .ok()
    });
  }
}
