var logging = require('logref')
logging.stdout()
process.logging = logging

var tako = require('tako')
  , http = require('http')
  , path = require('path')
  , optimist = require('optimist')
  , request = require('request').defaults({followRedirect:false})
  , couch = require('couch')
  , qs = require('querystring')
  , couchapp = require('couchapp')
  , Rewriter = require('Rewriter')
  , rewrites = [ 
        {"from":"/", "to":"index.html"}
      // , {"from":"/api/search", "to":"../../../_search/social_services/social_services/_search"} // github.com/open211/redirectory/wiki/Installation
      , {"from":"/api", "to":"/"}
      , {"from":"/api/*", "to":"/*"}
      , {"from":"/*", "to":'*'}
    ]
  ;
  
var opts = optimist
.usage('Usage: $0 -c [str] -s [str]')
.default({p: 9999, u: 'http://dev.earlyalameda.com'})
.demand(['c','s', 't'])

.alias('c', 'couchurl')
.alias('p', 'port')
.alias('s', 'secret')
.alias('u', 'siteurl')
.alias('t', 'users')

.describe('c', 'URL to data couchdb with admin password.')
.describe('t', 'URL to tokens and user database.')
.describe('p', 'HTTP port to run on. Defaults to 9999.')
.describe('s', 'Facebook application secret.')
.describe('u', 'Site url. Defaults to http://dev.earlyalameda.com')
.argv

if (opts.p !== 80) opts.u += ':'+opts.p

var users = couch(opts.t)
  , db = couch(opts.c)
  ;

couchapp.createApp(require('./users'), opts.t, function (app) {
  app.push(function () {
    t.httpServer.listen(opts.p, function () {
      console.log(opts.u+'login/facebook')
    })
  })
})

if (opts.u[opts.u.length - 1] !== '/') opts.u += '/'

var facebook_client_id = '262164850566060'

var t = tako({logger:console})

t.route('/login/facebook', function (req, resp) {
  users.post({type:'token'}, function (e, info) {
    if (e) return resp.error(e)
    var q =
      { client_id: facebook_client_id
      // eventually needs to use subdomain
      , redirect_uri: opts.u + 'auth/facebook/callback/'+info.id
      , scope: 'user_status,user_likes,read_stream,publish_checkins,publish_stream,user_birthday,email,user_location'
      , display: 'popup'
      , state: (Math.random()+1).toString().replace('.','')
      }
    var url = 'https://www.facebook.com/dialog/oauth?' + qs.stringify(q)
    resp.statusCode = 302
    resp.setHeader('location', url)
    resp.end()
  })
})

t.route('/auth/facebook/callback/:id', function (req, resp) {
  var id = req.params.id
    , q =
      { client_id: facebook_client_id
      , client_secret: opts.s
      // eventually needs to use subdomain
      , redirect_uri: opts.u + 'auth/facebook/callback/' + id
      , code: req.qs.code
      }
    ;
  // It's important to know that this doesn't forward to the redirect uri
  request.get('https://graph.facebook.com/oauth/access_token?'+qs.stringify(q), function (e, r, body) {
    if (e) return resp.error(e)
    if (r.statusCode !== 200) return resp.error(new Error('Error: '+body))
    var token = qs.parse(body)
    users.update(id, function (doc) {fbtoken = token}, function (e, info) {
      if (e) return resp.error(e)
      request.get('https://graph.facebook.com/me'+'?'+qs.stringify({access_token: token.access_token}, {json:true}, function (e, r, user) {
        if (e) return resp.error(e)
        if (r.statusCode !== 200) return resp.error(new Error(user))
        // check if this user already exists and unify their token
        
        // if user does not exist create that user and give them this token
      })
    })
  })
  
})


new Rewriter(t, rewrites, {verbose: true, root: "http://max.ic.ht/earlyalameda/_design/app", attachments: path.resolve(__dirname, 'attachments')})