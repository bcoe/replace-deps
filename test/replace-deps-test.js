/* global describe, it */
var fs = require('fs'),
  ReplaceDeps = require('../')

require('chai').should()
require('tap').mochaGlobals()

describe('ReplaceDeps', function () {
  describe('walk', function () {
    it('handles require being assigned to a variable', function (done) {
      ReplaceDeps({
        path: './test/fixtures/assign.js',
        replace: function (requireStr) {
          if (requireStr.match('pre-')) return "'" + requireStr.replace('pre-', '@pre/') + "'"
          return "'" + requireStr + "'"
        }
      }).walk(function (e, output) {
        output[0].modifiedContent.should.match(/\('@pre\/hello'\)/)
        output[0].modifiedContent.should.match(/\('@pre\/goodbye'\)/)
        output[0].modifiedContent.should.match(/\('lodash'\)/)
        return done()
      })
    })

    it('handles require being called inside a function', function (done) {
      ReplaceDeps({
        path: './test/fixtures/called-in-function.js',
        replace: function (requireStr) {
          if (requireStr.match('pre-')) return "'" + requireStr.replace('pre-', '@pre/') + "'"
          return "'" + requireStr + "'"
        }
      }).walk(function (e, output) {
        output[0].modifiedContent.should.match(/b\(require\('@pre\/hello'\)\)/)
        output[0].modifiedContent.should.match(/d\(require\('@pre\/goodbye'\)\)/)
        output[0].modifiedContent.should.match(/f\(require\('lodash'\)\)/)
        return done()
      })
    })

    it('handles a lonely require statement', function (done) {
      ReplaceDeps({
        path: './test/fixtures/lonely.js',
        replace: function (requireStr) {
          if (requireStr.match('pre-')) return "'" + requireStr.replace('pre-', '@pre/') + "'"
          return "'" + requireStr + "'"
        }
      }).walk(function (e, output) {
        output[0].modifiedContent.should.match(/require\('@pre\/hello'\)/)
        output[0].modifiedContent.should.match(/require\('@pre\/goodbye'\)\.awesomeify\(\)/)
        output[0].modifiedContent.should.match(/require\('lodash'\)/)
        return done()
      })
    })

    it('handles module.require syntax', function (done) {
      ReplaceDeps({
        path: './test/fixtures/module.js',
        replace: function (requireStr) {
          if (requireStr.match('pre-')) return "'" + requireStr.replace('pre-', '@pre/') + "'"
          return "'" + requireStr + "'"
        }
      }).walk(function (e, output) {
        output[0].modifiedContent.should.match(/module\.require\('@pre\/hello'\)/)
        output[0].modifiedContent.should.match(/module\.require\('@pre\/goodbye'\)\.awesomeify\(\)/)
        output[0].modifiedContent.should.match(/module\.require\('lodash'\)/)
        return done()
      })
    })

    it('handles require statements that are invoked', function (done) {
      ReplaceDeps({
        path: './test/fixtures/invoke.js',
        replace: function (requireStr) {
          if (requireStr.match('pre-')) return "'" + requireStr.replace('pre-', '@pre/') + "'"
          return "'" + requireStr + "'"
        }
      }).walk(function (e, output) {
        output[0].modifiedContent.should.match(/require\('@pre\/hello'\)\(\)/)
        output[0].modifiedContent.should.match(/require\('@pre\/goodbye'\)\(\{\}\)/)
        output[0].modifiedContent.should.match(/require\('lodash'\)/)
        return done()
      })
    })

    it('recursively walks a whole directory if a path to a folder is given', function (done) {
      ReplaceDeps({
        path: './test/fixtures',
        replace: function (requireStr) {
          if (requireStr.match('pre-')) return "'" + requireStr.replace('pre-', '@pre/') + "'"
          return "'" + requireStr + "'"
        }
      }).walk(function (e, output) {
        output.length.should.equal(5)
        return done()
      })
    })
  })

  describe('write', function () {
    it('rewrites a .js file with modified require statements', function (done) {
      var fixturePath = './test/fixtures/generated.js'

      fs.writeFileSync(
        fixturePath,
        "var hello = require('pre-hello')\nvar lodash = require('lodash')",
        'utf-8'
      )

      ReplaceDeps({
        path: fixturePath,
        replace: function (requireStr) {
          if (requireStr.match('pre-')) return "'" + requireStr.replace('pre-', '@pre/') + "'"
          return "'" + requireStr + "'"
        }
      }).write(function (e) {
        var content = fs.readFileSync(fixturePath, 'utf-8')
        content.should.match(/require\('@pre\/hello'\)/)
        content.should.match(/require\('lodash'\)/)
        fs.unlinkSync(fixturePath)
        return done()
      })
    })
  })
})
