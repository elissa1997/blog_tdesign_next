/**
 * 获取 src/assets/img 目录下的图片
 *
 * @param {string} path 相对于 src/assets/img 的路径
 * @returns {string}
 *
 * @example
 * getImgUrl('logo.png')
 * getImgUrl('defaultCover/coverbg1.jpg')
 * getImgUrl(`defaultCover/${name}.jpg`)
 */
export function getImgUrl(path) {
    return new URL(`../assets/img/${path}`, import.meta.url).href
}

/**
 * 将 Markdown 文本转换为适合卡片预览的纯文本。
 *
 * @param {string} markdown Markdown 内容
 * @returns {string}
 */
export function stripMarkdown(markdown = '') {
    if (typeof markdown !== 'string') return ''

    return markdown
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[([^\]]*)]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/^ {0,3}(#{1,6}|>|[-+*])\s+/gm, '')
        .replace(/^ {0,3}\d+[.)]\s+/gm, '')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/([*_~])([^*_~]+)\1/g, '$2')
        .replace(/^\s*[-*_]{3,}\s*$/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}
