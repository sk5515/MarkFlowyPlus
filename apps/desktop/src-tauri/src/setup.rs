use crate::{
    app::{conf::AppConf, window_manager},
    compat,
};
use tauri::{
    utils::config::{Color, WebviewUrl},
    webview::PageLoadEvent,
    AppHandle, Emitter, WebviewWindowBuilder,
};

#[cfg(target_os = "macos")]
use tauri::{LogicalPosition, TitleBarStyle};

pub fn init(app_handle: AppHandle, opened_urls: String) -> Result<(), Box<dyn std::error::Error>> {
    // 首先检查是否已经存在窗口
    if let Some(existing_window) = window_manager::get_last_opened_window(&app_handle) {
        let script = format!("window.openedUrls = `{opened_urls}`;");
        let _ = existing_window.eval(&script);
        let _ = existing_window.emit("opened-urls", opened_urls.clone());

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

    let mut main_win = WebviewWindowBuilder::new(
        &app_handle,
        "main".to_string(),
        WebviewUrl::App("index.html".into()),
    )
    .initialization_script(compat::webview_init_script())
    .initialization_script(&format!(
        "window.__MF_INITIAL_THEME_MODE__ = '{}'; document.documentElement.dataset.themeMode = '{}'; document.documentElement.style.colorScheme = '{}'; document.body && (document.body.style.colorScheme = '{}');",
        theme_mode, theme_mode, theme_mode, theme_mode
    ))
    .initialization_script(&format!("window.openedUrls = `{opened_urls}`"))
    .title("MarkFlowyPlus")
    .resizable(true)
    .decorations(true)
    .fullscreen(false)
    .theme(Some(theme))
    .background_color(window_bg_color)
    .visible(false)
    .on_page_load(|window, payload| {
        if matches!(payload.event(), PageLoadEvent::Finished) {
            let _ = window.show();
        }
    })
    .disable_drag_drop_handler()
    .inner_size(1200.0, 800.0)
    .min_inner_size(400.0, 400.0);

    #[cfg(target_os = "macos")]
    {
        main_win = main_win
            .title_bar_style(TitleBarStyle::Overlay)
            .hidden_title(true)
            .traffic_light_position(LogicalPosition::new(12.0, 8.0));
    }

    let window = main_win.build()?;

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
