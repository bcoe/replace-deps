var _ = require('lodash'),
  assert = require('assert'),
  falafel = require('falafel'),
  fs = require('fs'),
  glob = require('glob'),
  Promise = require('bluebird')

function ReplaceDeps (opts) {
  opts = _.extend(this, {
    replace: function (str) { return "'" + str + "'" },
    requireRegex: /(^|\.)require *\(/,
    path: './'
  }, opts)

  assert.equal(typeof this.replace, 'function', 'you must provide a replacement function')
}

ReplaceDeps.prototype.write = function (cb) {
  var _this = this

  return this.walk()
    .then(function (filesWithContent) {
      return Promise.all(_.map(filesWithContent, function (fileWithContent) {
        return _this.writeFile(fileWithContent)
      }))
    }).nodeify(cb)
}

ReplaceDeps.prototype.writeFile = function (fileWithContent) {
  return new Promise(function (resolve, reject) {
    if (fileWithContent.content === fileWithContent.modifiedContent) return resolve()
    fs.writeFile(fileWithContent.path, fileWithContent.modifiedContent, 'utf-8', function (err) {
      if (err) reject(err)
      else return resolve()
    })
  })
}

ReplaceDeps.prototype.walk = function (cb) {
  var _this = this

  return this.files()
    .then(function (files) {
      return Promise.all(_.map(files, function (path) {
        return _this.readFile(path)
      }))
    })
    .then(function (filesWithContent) {
      return Promise.all(_.map(filesWithContent, function (fileWithContent) {
        return _this.rewriteRequire(fileWithContent)
      }))
    }).nodeify(cb)
}

ReplaceDeps.prototype.files = function (cb) {
  var _this = this

  return new Promise(function (resolve, reject) {
    fs.stat(_this.path, function (err, stats) {
      if (err) reject(err)
      else if (stats.isDirectory()) {
        glob(_this.path + '/**/*.js', {}, function (err, files) {
          if (err) reject(err)
          else resolve(files)
        })
      } else {
        resolve([_this.path])
      }
    })
  }).nodeify(cb)
}

ReplaceDeps.prototype.readFile = function (path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, 'utf-8', function (err, content) {
      if (err) {
        reject(err)
      } else {
        resolve({
          content: content,
          path: path
        })
      }
    })
  })
}

ReplaceDeps.prototype.rewriteRequire = function (fileWithContent) {
  return this.modifyAST(fileWithContent)
}

ReplaceDeps.prototype.modifyAST = function (fileWithContent) {
  var _this = this,
    output

  return new Promise(function (resolve, reject) {
    output = falafel(fileWithContent.content, function (node) {
      if (node.type === 'Literal') {
        _this.processNode(node)
      }
    })

    fileWithContent.modifiedContent = output
    resolve(fileWithContent)
  })
}

ReplaceDeps.prototype.processNode = function (node) {
  if (this.requireRegex.test(node.parent.source())) {
    node.update(
      this.replace(node.value)
    )
  }
}

module.exports = function (opts) {
  return (new ReplaceDeps(opts))
}
