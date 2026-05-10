import { loadThemeCss, removeInsertedTheme } from '@/helper/extensions'
import { builtInThemes, darkTheme, lightTheme, type MfTheme } from '@markflowy/theme'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { create } from 'zustand'
import useAppSettingStore from './useAppSettingStore'

export const isBuiltInTheme = (themeName: string) => {
  return builtInThemes.some((theme) => theme.name === themeName)
}

const useThemeStore = create<ThemeStore>((set, get) => {
  return {
    curTheme: window.__MF_INITIAL_THEME_MODE__ === 'dark' ||
      (window.__MF_INITIAL_THEME_MODE__ !== 'light' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches)
      ? darkTheme
      : lightTheme,

    themes: [...builtInThemes],

    setCurThemeByName: (themeName) => {
      const { themes } = get()
      const targetTheme = themes.find((theme) => theme.name === themeName)

      if (targetTheme) {
        if (targetTheme.globalStyleText) {
          loadThemeCss(targetTheme.globalStyleText)
        } else {
          removeInsertedTheme()
        }

        const appWindow = getCurrentWindow()

        if (targetTheme.mode === 'dark') {
          document.body.style.colorScheme = 'dark'
          appWindow.setTheme('dark')
        } else {
          document.body.style.colorScheme = 'light'
          appWindow.setTheme('light')
        }

        set((prev) => ({
          ...prev,
          curTheme: targetTheme,
        }))
      }
    },

    getCurTheme: () => {
      const { themes, curTheme } = get()

      return themes.find((theme) => theme.name === curTheme.name)
    },

    insertTheme: (targetTheme) => {
      const { themes, curTheme, setCurThemeByName } = get()
      const existingThemeIndex = themes.findIndex((theme) => theme.name === targetTheme.name)

      if (existingThemeIndex >= 0) {
        const nextThemes = themes.map((theme, index) =>
          index === existingThemeIndex ? targetTheme : theme,
        )
        const isActiveTheme = curTheme.name === targetTheme.name

        set((prev) => ({
          ...prev,
          themes: nextThemes,
          curTheme: isActiveTheme ? targetTheme : prev.curTheme,
        }))

        if (isActiveTheme) {
          setCurThemeByName(targetTheme.name)
        }
        return
      }

      set((prev) => ({ ...prev, themes: [...themes, targetTheme] }))

      const { settingData } = useAppSettingStore.getState()
      if (settingData.theme === targetTheme.name) {
        setCurThemeByName(targetTheme.name)
      }
    },

    deleteTheme: (delThemeName) => {
      const { themes } = get()

      const filterThemes = themes.filter((theme) => theme.name !== delThemeName)

      set((prev) => ({ ...prev, themes: filterThemes }))
    },
  }
})

type ThemeStore = {
  curTheme: MfTheme
  themes: MfTheme[]
  setCurThemeByName: (themeName: string) => void
  getCurTheme: () => MfTheme | undefined
  insertTheme: (theme: MfTheme) => void
  deleteTheme: (themeName: string) => void
}

export default useThemeStore
