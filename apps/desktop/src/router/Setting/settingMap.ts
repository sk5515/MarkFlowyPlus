import { changeLng, Langs, locales } from '@/i18n'
import i18n from 'i18next'
import { EditorViewType } from 'rme'

export const getSettingMap = () => {
  return {
    general: {
      i18nKey: 'settings.general.label',
      iconName: 'ri-equalizer-line',
      desc: {
        i18nKey: 'settings.general.desc',
      },
      'Auto Save': {
        i18nKey: 'settings.general.autosave.label',
        autosave: {
          key: 'autosave',
          title: {
            i18nKey: 'settings.general.autosave.switch_auto_save.label',
          },
          desc: {
            i18nKey: 'settings.general.autosave.switch_auto_save.desc',
          },
          type: 'switch',
        },
        autosaveInterval: {
          key: 'autosave_interval',
          type: 'slider',
          title: {
            i18nKey: 'settings.general.autosave.autosaveInterval.label',
          },
          desc: {
            i18nKey: 'settings.general.autosave.autosaveInterval.desc',
          },
          scope: [1000, 10000],
        },
      },
      Misc: {
        i18nKey: 'settings.general.misc.label',
        language: {
          key: 'language',
          type: 'select',
          title: {
            i18nKey: 'settings.general.misc.language.label',
          },
          desc: {
            i18nKey: 'settings.general.misc.language.desc',
          },
          options: Object.keys(locales).map((key) => ({
            value: key,
            title: locales[key as keyof typeof locales],
          })),
          afterWrite: (val: Langs) => {
            changeLng(val)
          },
        },
      },
    },
    editor: {
      i18nKey: 'settings.editor.label',
      iconName: 'ri-edit-box-line',
      desc: {
        i18nKey: 'settings.editor.desc',
      },
      Style: {
        i18nKey: 'settings.editor.style.label',
        fullWidth: {
          key: 'editor_full_width',
          type: 'switch',
          title: {
            i18nKey: 'settings.editor.style.full_width.label',
          },
          desc: {
            i18nKey: 'settings.editor.style.full_width.desc',
          },
        },
        fontSize: {
          key: 'editor_root_font_size',
          type: 'slider',
          title: {
            i18nKey: 'settings.editor.style.font_size.label',
          },
          desc: {
            i18nKey: 'settings.editor.style.font_size.desc',
          },
          scope: [12, 40],
        },
        lineHeight: {
          key: 'editor_root_line_height',
          type: 'slider',
          title: {
            i18nKey: 'settings.editor.style.line_height.label',
          },
          desc: {
            i18nKey: 'settings.editor.style.line_height.desc',
          },
          step: 0.1,
          saveToString: true,
          scope: [1, 2],
        },
        normalFontFamily: {
          key: 'editor_root_font_family',
          type: 'fontListSelect',
          title: {
            i18nKey: 'settings.editor.style.font_family.label',
          },
          desc: {
            i18nKey: 'settings.editor.style.font_family.desc',
          },
        },
        codeFontFamily: {
          key: 'editor_code_font_family',
          type: 'fontListSelect',
          title: {
            i18nKey: 'settings.editor.style.code_font_family.label',
          },
          desc: {
            i18nKey: 'settings.editor.style.code_font_family.desc',
          },
        },
      },
      Behavior: {
        i18nKey: 'settings.editor.behavior.label',
        mdDefaultMode: {
          key: 'md_editor_default_mode',
          type: 'select',
          title: {
            i18nKey: 'settings.editor.behavior.md_default_mode.label',
          },
          desc: {
            i18nKey: 'settings.editor.behavior.md_default_mode.desc',
          },
          options: [
            { value: EditorViewType.WYSIWYG, title: i18n.t('view.wysiwyg') },
            { value: EditorViewType.SOURCECODE, title: i18n.t('view.source_code') },
          ],
        },
      },
      Wysiwyg: {
        i18nKey: 'settings.editor.wysiwyg.label',
        mdDefaultMode: {
          key: 'wysiwyg_editor_codemirror_line_wrap',
          type: 'switch',
          title: {
            i18nKey: 'settings.editor.wysiwyg.codemirror_linewrap.label',
          },
          desc: {
            i18nKey: 'settings.editor.wysiwyg.codemirror_linewrap.desc',
          },
        },
        spellcheck: {
          key: 'wysiwyg_editor_spellcheck',
          type: 'switch',
          title: {
            i18nKey: 'settings.editor.wysiwyg.spellcheck.label',
          },
          desc: {
            i18nKey: 'settings.editor.wysiwyg.spellcheck.desc',
          },
        },
      },
      SourceCode: {
        i18nKey: 'settings.editor.sourcecode.label',
        spellcheck: {
          key: 'source_code_editor_spellcheck',
          type: 'switch',
          title: {
            i18nKey: 'settings.editor.sourcecode.spellcheck.label',
          },
          desc: {
            i18nKey: 'settings.editor.sourcecode.spellcheck.desc',
          },
        },
      },
    },
    image: {
      i18nKey: 'settings.image.label',
      iconName: 'ri-image-2-line',
      desc: {
        i18nKey: 'settings.image.desc',
      },
    },
    keyboard: {
      i18nKey: 'settings.keyboard.label',
      iconName: 'ri-keyboard-fill',
      desc: {
        i18nKey: 'settings.keyboard.desc',
      },
    },
  }
}

export type SettingData = ReturnType<typeof getSettingMap>
