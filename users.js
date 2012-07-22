var ddoc = { _id:'_design/u'};

ddoc.views = {}
ddoc.views.facebook = {}
ddoc.views.facebook.map = function (doc) {
  if (doc.type === 'user' && doc.facebook && doc.facebook.id) emit(doc.facebook.id, null)
}

module.exports = ddoc

