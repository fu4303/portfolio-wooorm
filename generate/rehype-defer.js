import {visit} from 'unist-util-visit'

// Rehype plugin to defer scripts
export default function defer() {
  return transform

  function transform(tree) {
    const scripts = []
    let head = null

    visit(tree, 'element', visitor)

    const scope = head || tree
    scope.children = scope.children.concat(scripts)

    function visitor(node, index, parent) {
      if (node.tagName === 'script') {
        if (!node.properties.type || !/module/i.test(node.properties.type)) {
          node.properties.defer = true
        }

        scripts.push(node)
        parent.children.splice(index, 1)

        return index
      }

      if (node.tagName === 'head') {
        head = node
      }
    }
  }
}
