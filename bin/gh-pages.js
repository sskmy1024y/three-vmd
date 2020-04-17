/* eslint-env node */

const path = require('path')
const ghPages = require('gh-pages')
const version = require('../package.json').version

ghPages.publish(
  path.resolve(__dirname, '..'),
  {
    src: ['lib/**/*', 'types/**/*', 'package.json', 'README.md'],
    message: `gh-pages v${version} [ci skip]`,
  },
  (error) => {
    if (error) {
      throw error
    }
  },
)
