use crate::app::window_manager::get_focused_window;
use tauri::menu::{Menu, MenuEvent, MenuItemBuilder, PredefinedMenuItem, Submenu};
use tauri::{App, AppHandle, Emitter};

pub fn generate_menu(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let menu_handler = move |app: &AppHandle, event: MenuEvent| {
        let menu_id = event.id().as_ref();

        // 获取当前焦点窗口
        if let Some(window) = get_focused_window(app) {
            let focused_window_label = window.label();
            println!("focused_window: {}", focused_window_label);

            // 发送菜单事件到焦点窗口
            app.emit_to(&focused_window_label, "native:menu", menu_id)
                .expect("failed to emit");

            // 处理特定的菜单事件
            match menu_id {
                "Settings" => {
                    app.emit_to(&focused_window_label, "app_openSetting", {})
                        .map_err(|err| println!("{:?}", err))
                        .ok();
                    app.emit_to(&focused_window_label, "native:menu", "app_openSetting")
                        .map_err(|err| println!("{:?}", err))
                        .ok();
                }
                _ => {}
            }
        } else {
            println!("No focused window found for menu event");
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
                    &MenuItemBuilder::new("Settings").id("Settings").build(app)?,
                    &PredefinedMenuItem::quit(app, Some("Quit"))?,
                ],
            )?,
            &Submenu::with_items(
                app,
                "File",
                true,
                &[&MenuItemBuilder::new("Save").id("app_save").build(app)?],
            )?,
            &Submenu::with_items(
                app,
                "Edit",
                true,
                &[
                    &PredefinedMenuItem::redo(app, None)?,
                    &PredefinedMenuItem::undo(app, None)?,
                    &PredefinedMenuItem::cut(app, None)?,
                    &PredefinedMenuItem::copy(app, None)?,
                    &PredefinedMenuItem::paste(app, None)?,
                    &PredefinedMenuItem::select_all(app, None)?,
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
