import MarkdownIt from 'markdown-it'
import { katex } from '@mdit/plugin-katex'
import { fromHighlighter } from '@shikijs/markdown-it/core'
import { createHighlighterCore } from '@shikijs/core'
import { createOnigurumaEngine } from '@shikijs/engine-oniguruma'
import vitesseLight from '@shikijs/themes/vitesse-light'
import vitesseDark from '@shikijs/themes/vitesse-dark'
import vue from '@shikijs/langs/vue'
import javascript from '@shikijs/langs/javascript'
import typescript from '@shikijs/langs/typescript'
import json from '@shikijs/langs/json'
import html from '@shikijs/langs/html'
import css from '@shikijs/langs/css'
import scss from '@shikijs/langs/scss'
import bash from '@shikijs/langs/bash'
import java from '@shikijs/langs/java'
import python from '@shikijs/langs/python'
import sql from '@shikijs/langs/sql'
import markdown from '@shikijs/langs/markdown'

const languages = [
  vue,
  javascript,
  typescript,
  json,
  html,
  css,
  scss,
  bash,
  java,
  python,
  sql,
  markdown,
]

let rendererPromise

async function createRenderer() {
  const highlighter = await createHighlighterCore({
    themes: [vitesseLight, vitesseDark],
    langs: languages,
    engine: createOnigurumaEngine(() => import('shiki/wasm')),
  })

  const renderer = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  })

  renderer.use(katex, {
    delimiters: 'dollars',
    throwOnError: false,
  })

  renderer.use(fromHighlighter(highlighter, {
    themes: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
    defaultColor: false,
    defaultLanguage: 'text',
    fallbackLanguage: 'text',
  }))

  return renderer
}

function getRenderer() {
  if (!rendererPromise) {
    rendererPromise = createRenderer().catch((error) => {
      rendererPromise = undefined
      throw error
    })
  }

  return rendererPromise
}

export async function renderMarkdown(content = '') {
  const renderer = await getRenderer()
  return renderer.render(typeof content === 'string' ? content : '')
}
