// Generated by CoffeeScript 1.6.3
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = function(BasePlugin) {
    var Tagging, balUtil, _, _ref;
    _ = require('lodash');
    balUtil = require('bal-util');
    return Tagging = (function(_super) {
      __extends(Tagging, _super);

      function Tagging() {
        _ref = Tagging.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      Tagging.prototype.name = 'tagging';

      Tagging.prototype.config = {
        collectionName: 'documents',
        indexPageLayout: 'tags',
        indexPagePath: 'tags',
        context: null,
        getTagWeight: function(count, maxCount) {
          var logmax, logmin, result;
          logmin = 0;
          logmax = Math.log(maxCount);
          result = (Math.log(count) - logmin) / (logmax - logmin);
          return result;
        }
      };

      Tagging.prototype.tagCloud = {};

      Tagging.prototype.tagCollection = null;

      Tagging.prototype.contextualizeAfterLock = false;

      Tagging.prototype.extendCollections = function(next) {
        return this.tagCollection = this.docpad.getDatabase().createLiveChildCollection().setQuery("isTagIndex", {
          tag: {
            $exists: true
          }
        });
      };

      Tagging.prototype.extendTemplateData = function(_arg) {
        var me, templateData;
        templateData = _arg.templateData;
        me = this;
        templateData.getTagCloud = function(options) {
          return me.getTagCloud(options);
        };
        templateData.getTagUrl = function(tag, options) {
          return me.getTagUrl(tag, options);
        };
        return this;
      };

      Tagging.prototype.contextualizeAfter = function(_arg, next) {
        var collection, templateData;
        collection = _arg.collection, templateData = _arg.templateData;
        if (!this.contextualizeAfterLock) {
          return this.generateTags(collection, next);
        } else {
          next();
        }
        return this;
      };

      Tagging.prototype.getTagCloud = function(options) {
        var context, _ref1;
        context = (_ref1 = options != null ? options.context : void 0) != null ? _ref1 : 'all';
        return this.tagCloud[context].tags;
      };

      Tagging.prototype.getTagUrl = function(tag, options) {
        var doc, query;
        query = options != null ? options : {};
        query.tag = tag;
        doc = this.tagCollection.findOne(query);
        return doc != null ? doc.get('url') : void 0;
      };

      Tagging.prototype.generateTags = function(renderCollection, next) {
        var config, context, contextPath, database, doc, docpad, docs_created, me, newDocs, relativePath, slug, tag, tagCloud, targetedDocuments, _ref1, _ref2,
          _this = this;
        me = this;
        docpad = this.docpad;
        config = this.config;
        database = docpad.getDatabase();
        targetedDocuments = docpad.getCollection(this.config.collectionName);
        docpad.log('debug', 'tagging::generateTags: Generating tag cloud');
        targetedDocuments.forEach(function(document) {
          var cloud, context, contexts, count, tag, tags, _base, _i, _len, _results;
          tags = document.get('tags') || [];
          contexts = _(['all']).union([document.get('context') || null]).flatten().compact().value();
          _results = [];
          for (_i = 0, _len = contexts.length; _i < _len; _i++) {
            context = contexts[_i];
            if ((_base = _this.tagCloud)[context] == null) {
              _base[context] = {
                tags: {},
                maxCount: 0
              };
            }
            cloud = _this.tagCloud[context];
            _results.push((function() {
              var _base1, _j, _len1, _results1;
              _results1 = [];
              for (_j = 0, _len1 = tags.length; _j < _len1; _j++) {
                tag = tags[_j];
                if ((_base1 = cloud.tags)[tag] == null) {
                  _base1[tag] = {
                    tag: tag,
                    count: 0,
                    url: "",
                    weight: 0
                  };
                }
                count = ++cloud.tags[tag].count;
                if (count > cloud.maxCount) {
                  _results1.push(cloud.maxCount = count);
                } else {
                  _results1.push(void 0);
                }
              }
              return _results1;
            })());
          }
          return _results;
        });
        docpad.log('debug', 'tagging::generateTags: Generating tag index pages');
        docs_created = 0;
        newDocs = new docpad.FilesCollection();
        _ref1 = this.tagCloud;
        for (context in _ref1) {
          if (!__hasProp.call(_ref1, context)) continue;
          tagCloud = _ref1[context];
          _ref2 = tagCloud.tags;
          for (tag in _ref2) {
            if (!__hasProp.call(_ref2, tag)) continue;
            if (!this.tagCollection.findOne({
              tag: tag,
              context: context
            })) {
              slug = balUtil.generateSlugSync(tag);
              contextPath = context === 'all' ? '' : context;
              relativePath = _([contextPath, config.indexPagePath, slug + ".html"]).compact().join('/');
              doc = this.docpad.createDocument({
                slug: slug,
                relativePath: relativePath,
                context: context,
                isDocument: true,
                encoding: 'utf8'
              }, {
                data: " ",
                meta: {
                  layout: config.indexPageLayout,
                  referencesOthers: true,
                  tag: tag,
                  context: context
                }
              });
              database.add(doc);
              newDocs.add(doc);
              docs_created++;
              if (!renderCollection.findOne({
                tag: tag,
                context: context
              })) {
                renderCollection.add(doc);
              }
            }
          }
        }
        docpad.log('debug', "tagging::generateTags: " + docs_created + " new docs added");
        docpad.loadFiles({
          collection: newDocs
        }, function(err) {
          if (err) {
            return next(err);
          }
          _this.contextualizeAfterLock = true;
          return docpad.contextualizeFiles({
            collection: newDocs
          }, function(err) {
            var item, _ref3, _ref4;
            if (err) {
              return next(err);
            }
            _this.contextualizeAfterLock = false;
            _ref3 = _this.tagCloud;
            for (context in _ref3) {
              if (!__hasProp.call(_ref3, context)) continue;
              tagCloud = _ref3[context];
              _ref4 = tagCloud.tags;
              for (tag in _ref4) {
                if (!__hasProp.call(_ref4, tag)) continue;
                item = _ref4[tag];
                item.url = _this.getTagUrl(tag, {
                  context: context
                });
                item.weight = _this.config.getTagWeight(item.count, tagCloud.maxCount);
              }
            }
            return next();
          });
        });
        return this;
      };

      return Tagging;

    })(BasePlugin);
  };

}).call(this);