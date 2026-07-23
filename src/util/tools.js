const imageModules = import.meta.glob(
    '../assets/img/**/*.{png,jpg,jpeg,webp,gif,svg}',
    { eager: true, query: '?url', import: 'default' }
)

const iconModules = import.meta.glob(
    '../assets/icon/**/*.{png,jpg,jpeg,webp,gif,svg}',
    { eager: true, query: '?url', import: 'default' }
)

/**
 * 获取 src/assets/img 目录下的图片。
 *
 * @param {string} path 相对于 src/assets/img 的路径
 * @returns {string}
 */
export function getImgUrl(path) {
    const normalizedPath = String(path).replaceAll('\\', '/').replace(/^\/+/, '')
    return imageModules[`../assets/img/${normalizedPath}`] || ''
}


/**
 * 获取 src/assets/icon 目录下的图片。
 *
 * @param {string} path 相对于 src/assets/icon 的路径
 * @returns {string}
 */
export function getIconUrl(path) {
    const normalizedPath = String(path).replaceAll('\\', '/').replace(/^\/+/, '')
    return iconModules[`../assets/icon/${normalizedPath}`] || ''
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

/**
 * 计算字符串 UTF-8 字节的 MD5 值。
 *
 * @param {string} value
 * @returns {string}
 */
export function md5(value = '') {
    const bytes = new TextEncoder().encode(String(value))
    const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64
    const buffer = new ArrayBuffer(paddedLength)
    const data = new Uint8Array(buffer)
    const view = new DataView(buffer)

    data.set(bytes)
    data[bytes.length] = 0x80

    const bitLength = BigInt(bytes.length) * 8n
    view.setUint32(paddedLength - 8, Number(bitLength & 0xffffffffn), true)
    view.setUint32(paddedLength - 4, Number((bitLength >> 32n) & 0xffffffffn), true)

    const shifts = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
    ]
    const constants = Array.from(
        { length: 64 },
        (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0,
    )

    let a0 = 0x67452301
    let b0 = 0xefcdab89
    let c0 = 0x98badcfe
    let d0 = 0x10325476

    const rotateLeft = (number, count) => (number << count) | (number >>> (32 - count))

    for (let offset = 0; offset < paddedLength; offset += 64) {
        let a = a0
        let b = b0
        let c = c0
        let d = d0

        for (let index = 0; index < 64; index += 1) {
            let f
            let wordIndex

            if (index < 16) {
                f = (b & c) | (~b & d)
                wordIndex = index
            } else if (index < 32) {
                f = (d & b) | (~d & c)
                wordIndex = (5 * index + 1) % 16
            } else if (index < 48) {
                f = b ^ c ^ d
                wordIndex = (3 * index + 5) % 16
            } else {
                f = c ^ (b | ~d)
                wordIndex = (7 * index) % 16
            }

            const nextD = d
            d = c
            c = b
            const sum = (a + f + constants[index] + view.getUint32(offset + wordIndex * 4, true)) >>> 0
            b = (b + rotateLeft(sum, shifts[index])) >>> 0
            a = nextD
        }

        a0 = (a0 + a) >>> 0
        b0 = (b0 + b) >>> 0
        c0 = (c0 + c) >>> 0
        d0 = (d0 + d) >>> 0
    }

    return [a0, b0, c0, d0]
        .flatMap(number => [
            number & 0xff,
            (number >>> 8) & 0xff,
            (number >>> 16) & 0xff,
            (number >>> 24) & 0xff,
        ])
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
}

/**
 * 根据邮箱生成 Cravatar 头像地址。
 *
 * @param {string} email
 * @returns {string}
 */
export function getCravatarUrl(email = '') {
    const normalizedEmail = String(email).trim().toLowerCase()
    return `https://cravatar.cn/avatar/${md5(normalizedEmail)}?s=80`
}

/**
 * 将按父子关系返回的平铺数据转换为树形结构。
 * 顶级节点、孤立节点以及循环引用节点都会保留在根节点中。
 *
 * @param {Array<object>} items 平铺数据
 * @returns {Array<object>}
 */
export function buildTree(items = []) {
    if (!Array.isArray(items)) return []

    const nodes = items.map(item => ({ ...item, children: [] }))
    const nodeMap = new Map(nodes.map(node => [String(node.id), node]))

    const hasCircularParent = (node) => {
        const visited = new Set([String(node.id)])
        let parentId = node.parent_id

        while (parentId !== null && parentId !== undefined && Number(parentId) !== 0) {
            const key = String(parentId)
            if (visited.has(key)) return true

            visited.add(key)
            const parent = nodeMap.get(key)
            if (!parent) return false
            parentId = parent.parent_id
        }

        return false
    }

    const roots = []
    nodes.forEach(node => {
        const parentId = node.parent_id
        const parent = nodeMap.get(String(parentId))
        const isRoot = parentId === null
            || parentId === undefined
            || Number(parentId) === 0
            || !parent
            || parent === node
            || hasCircularParent(node)

        if (isRoot) {
            roots.push(node)
        } else {
            parent.children.push(node)
        }
    })

    return roots
}
