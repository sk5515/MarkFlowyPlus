# MarkFlowyPlus

MarkFlowyPlus 是基于 [MarkFlowy](https://github.com/drl990114/MarkFlowy) fork 后继续修改的个人维护版本。它保留了原项目本地优先的 Markdown 编辑器基础，并加入了我自己的界面、交互、打包和性能优化改动。

这个仓库不是 MarkFlowy 上游官方项目。原项目、发布版本和上游历史请查看 [drl990114/MarkFlowy](https://github.com/drl990114/MarkFlowy)。

## 主要改动

- 移除了所有 AI/Copilot 相关代码和依赖。
- 调整了编辑器工具栏、tab 栏、右键菜单、弹窗、通知和主题切换体验。
- 增加表格插入 UI、顶部搜索入口，优化 command f 搜索、菜单和 macOS 原生菜单文案。
- 优化启动速度和包体积：导出依赖按需加载、减少内置字体、移除未使用依赖和多余资源。
- 继续保持以本地文件和本地工作区为核心的 Markdown 编辑体验。

## 功能

- 所见即所得、源代码、预览三种模式。
- 支持 Markdown、JSON、TXT 和图片预览。
- 文件树、标签页、书签、目录、全局搜索。
- 明暗主题和自定义主题。
- 自定义快捷键。
- 图片粘贴/上传支持本地相对路径保存。
- 基于 Tauri 的 macOS 桌面端打包。

## 开发

```bash
yarn install
yarn workspace @markflowy/desktop tauri:dev
```

构建桌面端前端：

```bash
yarn workspace @markflowy/desktop build
```

构建 macOS DMG：

```bash
scripts/package-dmg.sh
```

## 说明

这个项目目前主要服务于我自己的桌面端使用场景，后续可能会继续与上游 MarkFlowy 产生差异。一些上游功能是有意移除的。

## 致谢

本项目 fork 自 [MarkFlowy](https://github.com/drl990114/MarkFlowy)。感谢原作者和所有贡献者提供的基础。

## License

本项目沿用上游许可证。详见 [LICENSE](./LICENSE)。

## 预览

![MarkFlowyPlus PC 预览](./preview_pc.jpg)

![MarkFlowyPlus macOS 预览](./preview_mac.png)
