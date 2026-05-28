use serde::Serialize;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder, WindowEvent};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CameraPermission {
    status: &'static str,
    granted: bool,
    can_prompt: bool,
}

/// Random code the user must type back to be allowed to quit the app.
/// Generated once at startup and kept in app state.
struct ExitCode(String);

/// Generate a 4-digit exit code without pulling in an RNG crate.
fn generate_exit_code() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0);
    // Mix the nanos a little so the digits look less sequential.
    let value = (nanos.wrapping_mul(2654435761)) % 10_000;
    format!("{value:04}")
}

#[tauri::command]
fn app_info() -> Result<String, String> {
    Ok("Nailfail desktop shell ready".to_string())
}

/// Reveal the code the user needs to quit the app.
#[tauri::command]
fn get_exit_code(exit_code: State<'_, ExitCode>) -> String {
    exit_code.0.clone()
}

/// Quit only when the supplied code matches the one generated at startup.
#[tauri::command]
fn attempt_exit(app: AppHandle, code: String, exit_code: State<'_, ExitCode>) -> Result<(), String> {
    if code.trim() == exit_code.0 {
        app.exit(0);
        Ok(())
    } else {
        Err("Incorrect exit code".to_string())
    }
}

/// Slam a fullscreen, always-on-top overlay over every display as a hard
/// punishment for biting. The overlay is dismissible (click / any key), so it
/// interrupts hard without fighting the OS for an inescapable lock.
#[tauri::command]
fn trigger_block_screen(app: AppHandle) -> Result<(), String> {
    // Already showing — just make sure it is up front, don't stack duplicates.
    if let Some(window) = app.get_webview_window("block-screen") {
        let _ = window.show();
        let _ = window.set_focus();
        return Ok(());
    }

    // Accessory apps don't take focus; flip to a regular app so the overlay
    // can grab the screen, then flip back when it is dismissed.
    #[cfg(target_os = "macos")]
    let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);

    let window = WebviewWindowBuilder::new(
        &app,
        "block-screen",
        WebviewUrl::App("index.html?view=block".into()),
    )
    .title("Nailfail")
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .fullscreen(true)
    .focused(true)
    .build()
    .map_err(|error| error.to_string())?;

    let _ = window.set_focus();
    Ok(())
}

/// Tear down the block overlay and hand focus back to whatever the user was on.
#[tauri::command]
fn dismiss_block_screen(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("block-screen") {
        window.close().map_err(|error| error.to_string())?;
    }

    #[cfg(target_os = "macos")]
    let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);

    Ok(())
}

/// Hide the main window into the tray.
#[tauri::command]
fn hide_to_tray(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn request_camera_permission() -> Result<CameraPermission, String> {
    request_platform_camera_permission().await
}

#[tauri::command]
fn open_camera_settings() -> Result<(), String> {
    open_platform_camera_settings()
}

#[tauri::command]
fn reset_camera_permission() -> Result<(), String> {
    reset_platform_camera_permission()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ExitCode(generate_exit_code()))
        .invoke_handler(tauri::generate_handler![
            app_info,
            request_camera_permission,
            open_camera_settings,
            reset_camera_permission,
            get_exit_code,
            attempt_exit,
            hide_to_tray,
            trigger_block_screen,
            dismiss_block_screen
        ])
        .setup(|app| {
            // macOS: launch as a regular windowed app (Dock icon + focused window)
            // rather than a hidden menu-bar/tray accessory.
            #[cfg(target_os = "macos")]
            let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);

            // Make sure the main window is shown and focused on launch.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }

            build_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // The window's close button hides to the tray instead of quitting.
            // The only way out is the code-gated `attempt_exit` command.
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Build the tray icon and its menu (Show window / Request quit).
fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let show_item = MenuItem::with_id(app, "show", "Show Nailfail", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit (requires code)", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    let mut builder = TrayIconBuilder::with_id("nailfail-tray")
        .tooltip("Nailfail")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_main_window(app),
            "quit" => {
                // Quitting still needs the code: surface the window and ask for it.
                show_main_window(app);
                let _ = app.emit("request-exit", ());
            }
            _ => {}
        });

    if let Some(icon) = app.default_window_icon().cloned() {
        builder = builder.icon(icon);
    }

    builder.build(app)?;
    Ok(())
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg(target_os = "macos")]
async fn request_platform_camera_permission() -> Result<CameraPermission, String> {
    tauri::async_runtime::spawn_blocking(request_macos_camera_permission)
        .await
        .map_err(|error| error.to_string())?
}

#[cfg(not(target_os = "macos"))]
async fn request_platform_camera_permission() -> Result<CameraPermission, String> {
    Ok(CameraPermission {
        status: "unsupported",
        granted: true,
        can_prompt: false,
    })
}

#[cfg(target_os = "macos")]
fn request_macos_camera_permission() -> Result<CameraPermission, String> {
    use block2::RcBlock;
    use objc2::runtime::Bool;
    use objc2_av_foundation::{AVAuthorizationStatus, AVCaptureDevice, AVMediaTypeVideo};
    use std::sync::mpsc;
    use std::time::Duration;

    let media_type = unsafe { AVMediaTypeVideo.ok_or("AVMediaTypeVideo is unavailable")? };
    let status = unsafe { AVCaptureDevice::authorizationStatusForMediaType(media_type) };

    if status != AVAuthorizationStatus::NotDetermined {
        return Ok(camera_permission_from_status(status));
    }

    let (sender, receiver) = mpsc::channel();
    let block = RcBlock::new(move |granted: Bool| {
        let _ = sender.send(granted.as_bool());
    });

    unsafe {
        AVCaptureDevice::requestAccessForMediaType_completionHandler(media_type, &block);
    }

    let granted = receiver
        .recv_timeout(Duration::from_secs(120))
        .map_err(|_| "Timed out waiting for macOS camera permission prompt".to_string())?;

    Ok(CameraPermission {
        status: if granted { "authorized" } else { "denied" },
        granted,
        can_prompt: false,
    })
}

#[cfg(target_os = "macos")]
fn camera_permission_from_status(status: objc2_av_foundation::AVAuthorizationStatus) -> CameraPermission {
    use objc2_av_foundation::AVAuthorizationStatus;

    if status == AVAuthorizationStatus::Authorized {
        CameraPermission {
            status: "authorized",
            granted: true,
            can_prompt: false,
        }
    } else if status == AVAuthorizationStatus::NotDetermined {
        CameraPermission {
            status: "notDetermined",
            granted: false,
            can_prompt: true,
        }
    } else if status == AVAuthorizationStatus::Restricted {
        CameraPermission {
            status: "restricted",
            granted: false,
            can_prompt: false,
        }
    } else {
        CameraPermission {
            status: "denied",
            granted: false,
            can_prompt: false,
        }
    }
}

#[cfg(target_os = "macos")]
fn open_platform_camera_settings() -> Result<(), String> {
    std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Camera")
        .spawn()
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn open_platform_camera_settings() -> Result<(), String> {
    Err("Camera settings shortcut is only implemented on macOS".to_string())
}

#[cfg(target_os = "macos")]
fn reset_platform_camera_permission() -> Result<(), String> {
    let bundle_ids = ["com.nailfail.desktop", "com.nailfail.app"];
    let mut last_error = None;

    for bundle_id in bundle_ids {
        match std::process::Command::new("tccutil")
            .args(["reset", "Camera", bundle_id])
            .status()
        {
            Ok(status) if status.success() => return Ok(()),
            Ok(status) => last_error = Some(format!("tccutil exited with status {status}")),
            Err(error) => last_error = Some(error.to_string()),
        }
    }

    Err(last_error.unwrap_or_else(|| "Could not reset camera permission".to_string()))
}

#[cfg(not(target_os = "macos"))]
fn reset_platform_camera_permission() -> Result<(), String> {
    Err("Camera permission reset is only implemented on macOS".to_string())
}
