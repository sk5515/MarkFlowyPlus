import NiceModal from '@ebay/nice-modal-react'
import isPropValid from '@emotion/is-prop-valid'
import { useEffect, useMemo } from 'react'
import {
  changeTheme as changeEditorTheme,
  darkTheme as editorDarkTheme,
  lightTheme as editorLightTheme,
  ThemeProvider as EditorProvider,
} from 'rme'
import { IStyleSheetContext, StyleSheetManager, ThemeProvider } from 'styled-components'
import { ThemeProvider as ZensThemeProvider } from 'zens'
import { GlobalStyles } from './globalStyles'
import { editorResources } from './i18n'
import { InjectFonts } from './injectFonts'
import useAppSettingStore from './stores/useAppSettingStore'
import useThemeStore from './stores/useThemeStore'

const AppThemeProvider: React.FC<BaseComponentProps> = function ({ children }) {
  const { curTheme } = useThemeStore()
  const { settingData } = useAppSettingStore()
  const theme = curTheme?.styledConstants || {}
  const codemirrorTheme = useMemo(() => {
    const baseTheme =
      curTheme.codemirrorTheme ||
      (curTheme.mode === 'dark' ? editorDarkTheme.codemirrorTheme : editorLightTheme.codemirrorTheme)
    const token = curTheme.styledConstants

    return {
      ...baseTheme,
      settings: {
        ...baseTheme.settings,
        background: token.bgColorSecondary || token.bgColor,
        foreground: token.primaryFontColor,
        caret: token.primaryFontColor,
        selection: token.accentColorFocused,
        selectionMatch: token.accentColorFocused,
        gutterBackground: token.bgColorSecondary || token.bgColor,
        gutterForeground: token.labelFontColor,
        gutterBorder: token.borderColor,
        fontFamily: settingData.editor_code_font_family,
      },
    }
  }, [
    curTheme.codemirrorTheme,
    curTheme.mode,
    curTheme.styledConstants,
    settingData.editor_code_font_family,
  ])

  const themeProp = useMemo(
    () => ({
      mode: curTheme.mode,
      codemirrorTheme,
      token: {
        ...curTheme.styledConstants,
        fontFamily: settingData.editor_root_font_family,
        codemirrorFontFamily: settingData.editor_code_font_family,
      },
    }),
    [
      curTheme.mode,
      curTheme.styledConstants,
      codemirrorTheme,
      settingData.editor_root_font_family,
      settingData.editor_code_font_family,
    ],
  )

  const i18nProp = useMemo(
    () => ({
      locales: editorResources,
      language: settingData.language,
    }),
    [settingData.language],
  )

  useEffect(() => {
    changeEditorTheme(codemirrorTheme)
  }, [codemirrorTheme])

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <ThemeProvider theme={theme}>
        <ZensThemeProvider theme={themeProp}>
          <EditorProvider theme={themeProp} i18n={i18nProp}>
            <InjectFonts />
            <GlobalStyles />
            <NiceModal.Provider>{children}</NiceModal.Provider>
          </EditorProvider>
        </ZensThemeProvider>
      </ThemeProvider>
    </StyleSheetManager>
  )
}

// This implements the default behavior from styled-components v5
const shouldForwardProp: IStyleSheetContext['shouldForwardProp'] = function (propName, target) {
  if (typeof target === 'string') {
    // For HTML elements, forward the prop if it is a valid HTML attribute
    return isPropValid(propName)
  }
  // For other elements, forward all props
  return true
}

export default AppThemeProvider
