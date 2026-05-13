# 主题配色修改指南

这份记录用于下次快速修改 MarkFlowyPlus 主题颜色，避免重新定位同一批 token 和 CodeMirror 样式。

## 主要入口

- 主题 token 定义在 `packages/theme/src/theme/index.ts`。
- 桌面端把主题 token 转成编辑器主题的位置在 `apps/desktop/src/AppThemeProvider.tsx`。
- WYSIWYG 代码块的补充样式在 `apps/desktop/src/globalStyles.ts`。

## 主题名和 token 的关系

`packages/theme/src/theme/index.ts` 里每个导出的主题都有一个 `name`，例如：

```ts
export const lightTheme: MfTheme = {
  name: 'MarkFlowyPlus Light',
  mode: 'light',
  styledConstants: styledLightTheme,
}
```

所以要修改名为 `"MarkFlowyPlus Light"` 的主题，应改它引用的 `styledLightTheme`，不是只按变量名猜。

## 常用背景 token

在 `styledConstants` 中，目前这些字段控制常见区域：

- `bgColor`：编辑器主背景。
- `bgColorSecondary`：代码块背景的核心 token，也会作为 CodeMirror gutter 背景。
- `sideBarBgColor`：左侧面板背景。
- `sideBarHeaderBgColor`：左侧面板顶部背景。
- `rightBarBgColor`：右侧面板背景。
- `rightBarHeaderBgColor`：右侧面板顶部背景。

本次确认过的规律：

- `MarkFlowyPlus Light`
  - 编辑器背景：`bgColor`
  - 代码块背景：`bgColorSecondary`
  - 左侧背景：`sideBarBgColor` / `sideBarHeaderBgColor`
  - 右侧背景：`rightBarBgColor` / `rightBarHeaderBgColor`
- `MarkFlowyPlus Dark` 也遵循同一套 token 映射。

## 代码块背景的实际控制链路

代码块颜色不是只由一个 CSS 选择器决定。

1. `packages/theme/src/theme/index.ts` 里设置主题 token，例如 `bgColorSecondary`。
2. `apps/desktop/src/AppThemeProvider.tsx` 里把 token 写入 CodeMirror theme：

```ts
background: token.bgColorSecondary || token.bgColor,
gutterBackground: token.bgColorSecondary || token.bgColor,
```

3. `apps/desktop/src/globalStyles.ts` 里还需要覆盖 WYSIWYG 代码块的内部 DOM 层：

```ts
.editor-view-wysiwyg .cm-editor
.editor-view-wysiwyg .cm-scroller
.editor-view-wysiwyg .cm-content
.editor-view-wysiwyg .cm-line
```

这些层都要使用 `props.theme.bgColorSecondary`。否则会出现代码块上下部分已经变色，但中间大部分仍保留旧色的情况。

## 修改示例

把 `"MarkFlowyPlus Light"` 调成：

- 编辑器背景 `#FFFFFF`
- 代码块背景 `#F8F8F8`
- 左右侧面板背景 `#FAFAFA`

应在 `styledLightTheme` 中设置：

```ts
bgColor: '#ffffff',
bgColorSecondary: '#f8f8f8',
sideBarHeaderBgColor: '#FAFAFA',
sideBarBgColor: '#FAFAFA',
rightBarBgColor: '#FAFAFA',
rightBarHeaderBgColor: '#FAFAFA',
```

把 Sepia 代码块背景改成 `#F2E5BC`，应在 Sepia 对应的 styled theme 中设置：

```ts
bgColorSecondary: '#f2e5bc',
```

并确认 `globalStyles.ts` 里 `.cm-editor`、`.cm-scroller`、`.cm-content`、`.cm-line` 都使用了 `props.theme.bgColorSecondary`。

## 验证和打包

修改后建议先跑：

```powershell
yarn workspace @markflowy/theme build
yarn workspace @markflowy/desktop build
```

需要打包安装时跑：

```powershell
yarn package:windows
Start-Process -FilePath "D:\GitHub\MarkFlowyPlus\target\manual-installer\MarkFlowyPlus-0.55.4-setup.exe" -ArgumentList "/S" -Wait -WindowStyle Hidden
```

如果 Tauri 下载 NSIS 失败，但脚本回退到本机 NSIS 并生成 `target\manual-installer\MarkFlowyPlus-0.55.4-setup.exe`，通常仍可继续安装。
