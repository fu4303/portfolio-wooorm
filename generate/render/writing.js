'use strict'

var h = require('hastscript')

exports.data = {
  title: 'Writing',
  label: 'blog',
  description: 'Things Titus writes',
  published: '2020-05-01T00:00:00.000Z',
  modified: Date.now()
}

exports.render = writing

function writing(pages) {
  var posts = pages
    .map((d) => d.data)
    .filter((d) => {
      var parts = d.pathname.replace(/^\/|\/$/g, '').split('/')
      return parts[0] === 'blog' && parts.length === 2
    })

  var items = posts.sort(sort).map((d) => {
    var pub = fmt(d.published)
    var mod = fmt(d.modified)

    if (mod === pub) pub = ''

    return h('li.card', [
      h('.caption', [
        h('h3', h('span.text', h('a', {href: d.pathname}, d.title))),
        h('p', h('span.text', d.description)),
        pub || mod
          ? h(
              'p',
              mod ? h('span.text', mod) : '',
              pub && mod ? h('span.text', ' · ') : '',
              pub ? h('span.text', (mod ? 'original: ' : '') + pub) : ''
            )
          : ''
      ])
    ])
  })

  return [h('h1', h('span.text', 'Writing')), h('ol.cards', items)]

  function sort(a, b) {
    return pick(b) - pick(a)
  }

  function pick(d) {
    return d.published
  }

  function fmt(value) {
    return value
      ? value.toLocaleDateString('en', {
          month: 'short',
          year: 'numeric',
          day: 'numeric'
        })
      : ''
  }
}