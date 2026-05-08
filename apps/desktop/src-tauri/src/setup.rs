use crate::app::{conf::AppConf, window_manager};
use std::time::Duration;
use tauri::{
    utils::config::{Color, WebviewUrl},
    AppHandle, Emitter, Listener, Manager, WebviewWindowBuilder,
};

#[cfg(target_os = "macos")]
use tauri::{TitleBarStyle, WindowBuilder};

pub const STARTUP_SPLASH_LABEL: &str = "startup_splash";
const STARTUP_READY_EVENT: &str = "markflowy-startup-ready";
const MAIN_REVEAL_DELAY_MS: u64 = 800;
const SPLASH_READY_CLOSE_DELAY_MS: u64 = 160;
const SPLASH_FALLBACK_CLOSE_DELAY_MS: u64 = 4_000;

#[cfg(target_os = "macos")]
fn startup_splash_size(app_handle: &AppHandle) -> (f64, f64) {
    app_handle
        .primary_monitor()
        .ok()
        .flatten()
        .map(|monitor| {
            let scale_factor = monitor.scale_factor();
            let size = monitor.size();

            (
                size.width as f64 / scale_factor,
                size.height as f64 / scale_factor,
            )
        })
        .unwrap_or((1200.0, 800.0))
}

#[cfg(target_os = "macos")]
fn close_startup_splash(app_handle: &AppHandle) {
    if let Some(splash) = app_handle.get_window(STARTUP_SPLASH_LABEL) {
        let _ = splash.hide();
        let _ = splash.close();
    }
}

#[cfg(target_os = "macos")]
fn create_startup_splash(app_handle: &AppHandle, color: Color) {
    close_startup_splash(app_handle);

    let (width, height) = startup_splash_size(app_handle);
    if let Ok(splash) = WindowBuilder::new(app_handle, STARTUP_SPLASH_LABEL)
        .title("MarkFlowy")
        .decorations(false)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .fullscreen(false)
        .always_on_top(true)
        .focused(true)
        .background_color(color)
        .inner_size(width, height)
        .center()
        .visible(true)
        .build()
    {
        let _ = splash.set_background_color(Some(color));
    }
}

#[cfg(target_os = "macos")]
fn register_startup_splash_close(app_handle: &AppHandle) {
    let ready_app = app_handle.clone();
    app_handle.once_any(STARTUP_READY_EVENT, move |_| {
        let ready_app = ready_app.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(Duration::from_millis(SPLASH_READY_CLOSE_DELAY_MS)).await;
            close_startup_splash(&ready_app);
        });
    });

    let fallback_app = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_millis(SPLASH_FALLBACK_CLOSE_DELAY_MS)).await;
        close_startup_splash(&fallback_app);
    });
}

pub fn init(app_handle: AppHandle, opened_urls: String) -> Result<(), Box<dyn std::error::Error>> {
    // 首先检查是否已经存在窗口
    if let Some(existing_window) = window_manager::get_last_opened_window(&app_handle) {
        let script = format!("window.openedUrls = `{opened_urls}`; console.log(`[setup.rs] Updated openedUrls to: {opened_urls}`);");
        let _ = existing_window.eval(&script);
        existing_window.emit("opened-urls", opened_urls.clone());

        // 确保窗口被聚焦
        let _ = existing_window.set_focus();
        return Ok(());
    }

    let theme = AppConf::theme_mode(&app_handle.clone());
    let theme_mode = match theme {
        tauri::Theme::Dark => "dark",
        tauri::Theme::Light => "light",
        _ => "light",
    };
    let window_bg_color = if theme_mode == "dark" {
        Color(19, 19, 19, 255)
    } else {
        Color(255, 255, 255, 255)
    };

    #[cfg(target_os = "macos")]
    {
        create_startup_splash(&app_handle, window_bg_color);
        register_startup_splash_close(&app_handle);
    }

    let mut main_win = WebviewWindowBuilder::new(
        &app_handle,
        "main".to_string(),
        WebviewUrl::App("index.html".into()),
    )
    .initialization_script(&format!(
        "window.__MF_INITIAL_THEME_MODE__ = '{}'; document.documentElement.dataset.themeMode = '{}'; document.documentElement.style.colorScheme = '{}'; document.body && (document.body.style.colorScheme = '{}');",
        theme_mode, theme_mode, theme_mode, theme_mode
    ))
    .initialization_script(&format!("window.openedUrls = `{opened_urls}`"))
    .initialization_script(&format!(
        "console.log(`[setup.rs] window.openedUrls set to: {opened_urls}`)"
    ))
    .title("MarkFlowy")
    .resizable(true)
    .fullscreen(false)
    .theme(Some(theme))
    .background_color(window_bg_color)
    .visible(false)
    .disable_drag_drop_handler()
    .inner_size(1200.0, 800.0)
    .min_inner_size(400.0, 400.0);

    #[cfg(target_os = "macos")]
    {
        main_win = main_win.title_bar_style(TitleBarStyle::Transparent);
    }

    let window = main_win.build()?;
    let reveal_window = window.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_millis(MAIN_REVEAL_DELAY_MS)).await;
        let _ = reveal_window.show();
        let _ = reveal_window.set_focus();
    });

    // 将初始窗口添加到全局窗口实例缓存中
    let window_label = window.label().to_string();
    let workspace_path = if !opened_urls.is_empty() {
        opened_urls.split(',').next().unwrap_or("").to_string()
    } else {
        "".to_string()
    };

    // 存储窗口实例信息到全局缓存
    if !workspace_path.is_empty() {
        use crate::WINDOW_INSTANCES;
        use std::path::PathBuf;

        let mut instances = WINDOW_INSTANCES
            .lock()
            .map_err(|e| format!("Failed to lock window instances: {}", e))?;
        instances.insert(window_label, PathBuf::from(workspace_path));
    }

    Ok(())
}
