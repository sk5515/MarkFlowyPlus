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
        window_manager::reveal_window(&existing_window);

        return Ok(());
    }

    let initial_theme = AppConf::initial_theme_appearance(&app_handle.clone());
    let theme = initial_theme.theme;
    let theme_mode = initial_theme.mode;
    let (bg_r, bg_g, bg_b) = initial_theme.background;
    let window_bg_color = Color(bg_r, bg_g, bg_b, 255);

    let mut main_win = WebviewWindowBuilder::new(
        &app_handle,
        "main".to_string(),
        WebviewUrl::App("index.html".into()),
    )
    .initialization_script(compat::webview_init_script())
    .initialization_script(&format!(
        "window.__MF_INITIAL_THEME_MODE__ = '{}'; window.__MF_INITIAL_BG_COLOR__ = 'rgb({}, {}, {})'; document.documentElement.dataset.themeMode = '{}'; document.documentElement.style.colorScheme = '{}'; document.documentElement.style.backgroundColor = window.__MF_INITIAL_BG_COLOR__; document.documentElement.style.setProperty('--mf-initial-bg-color', window.__MF_INITIAL_BG_COLOR__); document.body && (document.body.style.colorScheme = '{}'); document.body && (document.body.style.backgroundColor = window.__MF_INITIAL_BG_COLOR__);",
        theme_mode, bg_r, bg_g, bg_b, theme_mode, theme_mode, theme_mode
    ))
    .initialization_script(&format!("window.openedUrls = `{opened_urls}`"))
    .title("MarkFlowyPlus")
    .resizable(true)
    .decorations(!cfg!(target_os = "windows"))
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
