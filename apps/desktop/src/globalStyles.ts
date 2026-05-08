import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  html {
    border-radius: 10px;
    overflow: hidden;
    background-color:  ${(props) => props.theme.bgColor};
  }
  
  body {
    background-color: ${(props) => props.theme.bgColor};
    color: ${(props) => props.theme.primaryFontColor};
    overflow: hidden;
    line-height: normal;
    font-family: "Open Sans", "Clear Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  }

  * {
    border-color: ${(props) => props.theme.borderColor};
  }

  .icon {
    flex: 0 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 32px;
    width: 32px;
    font-size: 1rem;
    cursor: pointer;
    outline: none;
    box-shadow: none;
    transition: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "liga" 1, "calt" 1;
    font-display: swap;

    &:hover {
      color: ${(props) => props.theme.accentColor};
      background-color: ${(props) => props.theme.hoverColor};
    }

    &:focus,
    &:focus-visible,
    &:active {
      outline: none;
      box-shadow: none;
    }

    &--active {
      color: ${(props) => props.theme.accentColor};
      font-weight: 1000;
    }

    &-unselected {
      color: ${(props) => props.theme.unselectedFontColor};
    }

    &-disabled {
      color: ${(props) => props.theme.disabledFontColor};
      cursor: not-allowed;
    }
  }

  .icon-small {
    height: 22px;
    width: 22px;
    font-size: 0.85rem;
  }

  .icon-medium {
    height: 32px;
    width: 32px;
    font-size: 1rem;
  }

  .icon-large {
    height: 40px;
    width: 40px;
    font-size: 1.2rem;
  }

  .icon-rounded {
    border-radius: 50%;
  }

  .icon-smooth {
    border-radius: 6px;
  }
  .icon-square {
    border-radius: 0;
  }

  .btn-icon,
  [class^='ri-'],
  [class*=' ri-'] {
    outline: none;
    box-shadow: none;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-icon:focus,
  .btn-icon:focus-visible,
  .btn-icon:active,
  [class^='ri-']:focus,
  [class^='ri-']:focus-visible,
  [class^='ri-']:active,
  [class*=' ri-']:focus,
  [class*=' ri-']:focus-visible,
  [class*=' ri-']:active {
    outline: none;
    box-shadow: none;
  }

  .ant-wave {
    display: none !important;
  }

  button,
  [role='button'],
  [data-focus-visible],
  .ant-btn,
  .ariakit-toolbar-item {
    -webkit-tap-highlight-color: transparent;
  }

  button:focus,
  button:focus-visible,
  button:active,
  [role='button']:focus,
  [role='button']:focus-visible,
  [role='button']:active,
  [data-focus-visible],
  [data-focus-visible]:focus,
  [data-focus-visible]:focus-visible,
  [data-focus-visible]:active,
  .ant-btn:focus,
  .ant-btn:focus-visible,
  .ant-btn:active,
  .ariakit-toolbar-item:focus,
  .ariakit-toolbar-item:focus-visible,
  .ariakit-toolbar-item:active {
    outline: none !important;
    box-shadow: none !important;
  }

  button:has(i[class^='ri-']),
  button:has(i[class*=' ri-']),
  [role='button']:has(i[class^='ri-']),
  [role='button']:has(i[class*=' ri-']),
  .ant-btn:has(i[class^='ri-']),
  .ant-btn:has(i[class*=' ri-']) {
    transition: none !important;
  }

  button:has(i[class^='ri-'])::after,
  button:has(i[class*=' ri-'])::after,
  .ant-btn:has(i[class^='ri-'])::after,
  .ant-btn:has(i[class*=' ri-'])::after {
    display: none !important;
  }

  .popover {
    border: 1px solid ${(props) => props.theme.borderColor};
  }
  .display-none {
    display: none;
  }

  .ProseMirror-search-match,
  .cm-search-match,
  .cm-searchMatch,
  .cm-selectionMatch {
    background-color: #fff2a8 !important;
    box-shadow: inset 0 0 0 1px rgba(31, 35, 40, 0.18);
    color: #1f2328 !important;
    border-radius: 2px;
    text-shadow: none !important;
  }

  .ProseMirror-active-search-match,
  .cm-search-active,
  .cm-searchMatch-selected {
    background-color: #ffb020 !important;
    box-shadow: inset 0 0 0 1px rgba(31, 35, 40, 0.28);
    color: #1f2328 !important;
    border-radius: 2px;
    text-shadow: none !important;
  }

  .rme-block-handler,
  .rme-block-handler.rme-block-handler,
  div.rme-block-handler[draggable='true'],
  div[draggable='true']:has(.ri-draggable) {
    display: none !important;
    cursor: default !important;
    -webkit-user-drag: none;
    user-select: none;
  }

  .rme-block-handler .rme-draggable-handler,
  div[draggable='true'] .rme-draggable-handler,
  div[draggable='true'] .ri-draggable {
    display: none !important;
  }

  .markdown-body pre {
    overflow-x: auto !important;
    width: var(--editor-code-block-max-width, 100%) !important;
    max-width: var(--editor-code-block-max-width, 100%) !important;
    box-sizing: border-box;
    white-space: pre !important;
    word-break: normal !important;
    overflow-wrap: normal !important;
    word-wrap: normal !important;
  }

  .markdown-body pre code,
  .markdown-body pre tt {
    white-space: pre !important;
    word-break: normal !important;
    overflow-wrap: normal !important;
    word-wrap: normal !important;
  }

  .editor-view-wysiwyg .cm-editor {
    width: var(--editor-code-block-max-width, 100%) !important;
    max-width: var(--editor-code-block-max-width, 100%) !important;
    min-width: 0 !important;
    box-sizing: border-box;
    overflow-x: auto !important;
  }

  .editor-view-wysiwyg .cm-scroller {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    overflow-x: auto !important;
  }

  .editor-view-wysiwyg {
    overflow-x: hidden;
  }

  .editor-view-wysiwyg .code-block__reference {
    position: static !important;
    margin-bottom: 5px;
  }

  .editor-view-wysiwyg .cm-content,
  .editor-view-wysiwyg .cm-line {
    white-space: pre !important;
    word-break: normal !important;
    overflow-wrap: normal !important;
    word-wrap: normal !important;
  }

  .editor-view-wysiwyg .cm-content {
    width: max-content;
    min-width: 100%;
  }

  .editor-view-wysiwyg .cm-line {
    min-width: 0;
  }

  #editor-panel::-webkit-scrollbar:horizontal,
  .code-contents::-webkit-scrollbar:horizontal,
  .markdown-body::-webkit-scrollbar:horizontal,
  .markdown-body pre::-webkit-scrollbar:horizontal,
  .editor-view-wysiwyg .cm-editor::-webkit-scrollbar:horizontal,
  .editor-view-wysiwyg .cm-scroller::-webkit-scrollbar:horizontal {
    display: none;
    height: 0;
  }

  /* Styles for scrollbar */

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${(props) => props.theme.scrollbarTrackColor};
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 6px;
    background: ${(props) => props.theme.scrollbarThumbColor};
  }
`
