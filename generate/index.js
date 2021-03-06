import path from 'path'
import glob from 'glob'
import all from 'p-all'
import {toVFile} from 'to-vfile'
import {reporter} from 'vfile-reporter'
import unified from 'unified'
import favicon from 'rehype-prevent-favicon-request'
import minify from 'rehype-preset-minify'
import doc from 'rehype-document'
import meta from 'rehype-meta'
import stringify from 'rehype-stringify'
import {u} from 'unist-builder'
import {h} from 'hastscript'
import move from './wooorm-move.js'
import mkdirp from './unified-mkdirp.js'
import defer from './rehype-defer.js'
import pictures from './rehype-pictures.js'
import renderPost from './render-post.js'
import * as home from './render/home.js'
import * as thanks from './render/thanks.js'
import * as writing from './render/writing.js'
import * as seeing from './render/seeing.js'
import * as watching from './render/watching.js'
import * as listening from './render/listening.js'

const tasks = []

const pages = [home, thanks, writing, seeing, watching, listening]

const posts = glob.sync('post/**/*.md')

let index = -1

while (++index < pages.length) {
  if (!pages[index].data.pathname) {
    pages[index].data.pathname = '/' + pages[index].data.label + '/'
  }
}

index = -1

while (++index < posts.length) {
  pages.push(renderPost(toVFile.readSync(posts[index])))
}

index = -1

while (++index < pages.length) {
  add(pages[index])
}

function add(d) {
  tasks.push(() => {
    const tree = d.render(pages)
    return {
      tree: 'type' in tree ? tree : u('root', tree),
      file: toVFile({data: {meta: d.data}})
    }
  })
}

const pipeline = unified()
  .use(pictures, {base: path.join('build')})
  .use(wrap)
  .use(doc, {
    link: [
      {rel: 'stylesheet', href: '/syntax.css'},
      {rel: 'stylesheet', href: '/index.css'},
      {rel: 'stylesheet', media: '(min-width: 32em)', href: '/big.css'}
    ]
  })
  .use(meta, {
    twitter: true,
    og: true,
    copyright: true,
    origin: 'https://wooorm.com',
    type: 'website',
    name: 'wooorm.com',
    siteTags: ['oss', 'open', 'source', 'ties', 'music', 'shows'],
    siteAuthor: 'Titus Wormer',
    siteTwitter: '@wooorm',
    author: 'Titus Wormer',
    authorTwitter: '@wooorm',
    separator: ' | ',
    color: '#000000'
  })
  .use(defer)
  .use(favicon)
  .use(minify)
  .use(move)
  .use(mkdirp)
  .use(stringify)
  .freeze()

const promises = tasks.map((fn) => () => {
  return Promise.resolve(fn())
    .then(({tree, file}) => {
      return pipeline.run(tree, file).then((tree) => ({tree, file}))
    })
    .then(({tree, file}) => {
      file.value = pipeline.stringify(tree, file)
      return file
    })
    .then((file) => toVFile.write(file).then(() => file))
    .then(done, done)

  function done(x) {
    console.log(reporter(x))
  }
})

all(promises, {concurrency: 2})

function wrap() {
  const structure = pages
    .map((d) => d.data)
    .filter((d) => {
      const parts = d.pathname.replace(/^\/|\/$/g, '').split('/')
      return parts.length === 1
    })

  return transform

  function transform(tree, file) {
    const self = section(file.data.meta.pathname)

    return u('root', [
      h('header', [
        h('nav.top', [
          h(
            'ol',
            structure.map((d) => {
              return h('li', {className: [d.label]}, [
                h(
                  'span.text',
                  h(
                    'a',
                    {
                      className:
                        section(d.pathname) === self ? ['active'] : null,
                      href: d.pathname
                    },
                    d.title || ''
                  )
                )
              ])
            })
          )
        ])
      ]),
      h('main', tree),
      h('footer')
    ])
  }

  function section(pathname) {
    return pathname.split('/')[1]
  }
}
