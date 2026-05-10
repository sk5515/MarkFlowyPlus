use crate::app::window_manager::get_focused_window;
use tauri::menu::{Menu, MenuEvent, MenuItemBuilder, PredefinedMenuItem, Submenu};
use tauri::{App, AppHandle, Emitter};

pub fn generate_menu(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let menu_handler = move |app: &AppHandle, event: MenuEvent| {
        let menu_id = event.id().as_ref();

        // 获取当前焦点窗口
        if let Some(window) = get_focused_window(app) {
            let focused_window_label = window.label();

            // 发送菜单事件到焦点窗口
            app.emit_to(&focused_window_label, "native:menu", menu_id)
                .expect("failed to emit");

            // 处理特定的菜单事件
            match menu_id {
                "Settings" => {
                    app.emit_to(&focused_window_label, "app_openSetting", {})
                        .map_err(|err| eprintln!("{:?}", err))
                        .ok();
                    app.emit_to(&focused_window_label, "native:menu", "app_openSetting")
                        .map_err(|err| eprintln!("{:?}", err))
                        .ok();
                }
                _ => {}
            }
        }
    };

    let menu_items = Menu::with_items(
        app,
        &[
            &Submenu::with_items(
                app,
                "MarkFlowyPlus",
                true,
                &[
                    &MenuItemBuilder::new("设置").id("Settings").build(app)?,
                    &PredefinedMenuItem::quit(app, Some("退出 MarkFlowyPlus"))?,
                ],
            )?,
            &Submenu::with_items(
                app,
                "文件",
                true,
                &[&MenuItemBuilder::new("保存").id("app_save").build(app)?],
            )?,
            &Submenu::with_items(
                app,
                "编辑",
                true,
                &[
                    &PredefinedMenuItem::redo(app, Some("重做"))?,
                    &PredefinedMenuItem::undo(app, Some("撤销"))?,
                    &PredefinedMenuItem::cut(app, Some("剪切"))?,
                    &PredefinedMenuItem::copy(app, Some("复制"))?,
                    &PredefinedMenuItem::paste(app, Some("粘贴"))?,
                    &PredefinedMenuItem::select_all(app, Some("全选"))?,
                ],
            )?,
            // &Submenu::with_items(
            //     app,
            //     "View",
            //     true,
            //     &[
            //         &MenuItemBuilder::new("SourceCode View")
            //             .id("SourceCodeView")
            //             .build(app)?,
            //         &MenuItemBuilder::new("Wysiwyg View")
            //             .id("WysiwygView")
            //             .build(app)?,
            //     ],
            // )?,
        ],
    )?;

    app.set_menu(menu_items).expect("failed to set menu");

    app.on_menu_event(menu_handler);

    Ok(())
}
