use serde::Serialize;
use std::time::Duration;
// State is used by linux
use tauri::{Emitter, Manager};

#[derive(Clone, Serialize)]
struct LongRunningThreadStruct {
  message: String,
}

pub async fn long_running_thread(app: &tauri::AppHandle) {
  loop {
    // sleep
    tokio::time::sleep(Duration::from_secs(2)).await;
    let _ = app.get_webview_window("main").and_then(|w| {
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
