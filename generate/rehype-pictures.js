import path from 'path'
import fs from 'fs'
import {toVFile} from 'to-vfile'
import sharp from 'sharp'
import {rename} from 'vfile-rename'
import {visit} from 'unist-util-visit'
import {h} from 'hastscript'
import {classnames} from 'hast-util-classnames'

export default function pictures(options) {
  const sizes = [600, 1200, 2400, 3600]
  const formats = ['webp', 'png', 'jpg']
  const mimes = {webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg'}
  const base = options.base
  const sources = formats.flatMap((format) =>
    sizes.flatMap((size) => ({
      stem: {suffix: '-' + size},
      extname: '.' + format
    }))
  )

  return transform

  function transform(tree) {
    const promises = []

    visit(tree, 'element', visitor)

    if (promises.length > 0) {
      return Promise.all(promises).then(() => {})
    }

    function visitor(node, _, parent) {
      const src = (node.tagName === 'img' && node.properties.src) || ''

      if (!src || src.charAt(0) !== '/') {
        return
      }

      promises.push(rewrite(src, node, parent))

      function rewrite(src, node, parent) {
        const resolved = path.join(base, src.split('/').join(path.sep))
        const promises = [].concat(
          // See which images exist.
          sources.map((d) => {
            const fp = rename(toVFile({path: resolved}), d).path

            return fs.promises.access(fp, fs.constants.R_OK).then(
              () => fp,
              () => {}
            )
          }),
          // See dimension.
          sharp(resolved)
            .metadata()
            .catch(() => {
              throw new Error('Could not find `' + resolved + '`')
            })
        )

        return Promise.all(promises).then((result) => {
          const defaults = new Set(['png', 'jpg'])
          const info = result.pop()
          const available = new Set(result.filter(Boolean))
          const siblings = parent.children
          let width = info.width
          let height = info.height
          let biggestDefault

          // Generate the sources, but only if they exist.
          const srcs = formats.flatMap((format) => {
            const applicable = sizes
              .map((size) => {
                const fp = rename(toVFile({path: resolved}), {
                  stem: {suffix: '-' + size},
                  extname: '.' + format
                }).path

                return available.has(fp) ? [fp, size] : []
              })
              .sort((a, b) => a[1] - b[1])
              .filter((d) => d.length > 0)

            if (applicable.length === 0) {
              return []
            }

            if (defaults.has(format)) {
              biggestDefault = applicable[applicable.length - 1]
            }

            return h('source', {
              srcSet: applicable.map(
                (d) => ['/' + path.relative(base, d[0])] + ' ' + d[1] + 'w'
              ),
              type: mimes[format]
            })
          })

          if (biggestDefault) {
            node.properties.src = path.relative(base, biggestDefault[0])
            width = biggestDefault[1]
            height = (width / info.width) * info.height
          }

          node.properties.loading = 'lazy'
          node.properties.decoding = 'async'
          node.properties.width = width
          node.properties.height = height

          if (width / height > 2) {
            classnames(parent, 'panorama')
          } else if (width / height > 1) {
            classnames(parent, 'landscape')
          }

          siblings[siblings.indexOf(node)] = h('picture', srcs.concat(node))
        })
      }
    }
  }
}
