"use strict";

var nweb = {
  go: function(model) {    
    nweb.applyBindings(model, document.body, nweb.bindings, []);
    nweb.invalidate(nweb.bindings);
  },
  binds: function(name) {
    var binds = {
      "nw-repeat": nweb.getRepeatBinding,
      "nw-text": nweb.getTextBinding,
      "nw-html": nweb.getHtmlBinding,
      "nw-value": nweb.getValueBinding,
      "nw-checked": nweb.getCheckedBinding,
      "nw-template": nweb.getTemplateBinding,
      "nw-when": nweb.getWhenBinding,
      "nw-unless": nweb.getUnlessBinding,
      "nw-css": nweb.getCssBinding,
      "nw-style": nweb.getStyleBinding,
      "nw-visible": nweb.getVisibleBinding,
      "nw-disable": nweb.getDisableBinding,
      "nw-enable": nweb.getEnableBinding,
      "nw-click": nweb.getClickBinding,
      "nw-submit": nweb.getSubmitBinding,
      "nw-events": nweb.getEventsBinding
    };
    return binds[name];
  },
  applyBindings: function (model, el, bindings, loopStack, isInsideTemplate) {
    if (!el)
      throw "Argument null or undefined exception: el in applyBindings";
    if(el.nodeType != 1)
      return;
    
    var attrs = nweb.utils.getElementAttributes(el);

    for(var i = 0; i < attrs.length; i++) {
      var attrName = attrs[i].nodeName;
      if(attrName.indexOf("nw-") == 0) {
        var binder = nweb.binds(attrName);
        
        if(typeof binder === 'undefined')
          throw "Unrecognized nw- attribute: " + attrName;
        
        if(!el.__nw_is_repeat && !el.__nw_is_template) {
          var attrValue = attrs[i].nodeValue;          
          var binding = binder(model, el, bindings, loopStack, attrValue);

          if(typeof binding !== 'undefined')
            bindings.push(binding);
        }        
      }
    }

    for(var i = attrs.length - 1; i >= 0; i--)
      if(attrs[i].nodeName.indexOf("nw-") === 0)
        el.removeAttribute(attrs[i].nodeName);
    
    if(el.__nw_is_template && !isInsideTemplate)
      return;

    for(var i = 0; i < el.childNodes.length; i++)
      nweb.applyBindings(model, el.childNodes[i], bindings, loopStack);
  },
  getTextBinding: function(model, el, bindings, loopStack, attrVal) {
    var expr = nweb.parseExpression(model, attrVal, loopStack);
    return {
      el: el,
      getValue: function() {
        return nweb.getParsedValue(model, expr, loopStack);
      },
      apply: function(value) {
        el.innerHTML = nweb.utils.htmlEncode(value);
      }
    };
  },
  getHtmlBinding: function(model, el, bindings, loopStack, attrVal) {
    var expr = nweb.parseExpression(model, attrVal, loopStack);
    return {
      el: el,
      getValue: function() {
        return nweb.getParsedValue(model, expr, loopStack);
      },
      apply: function(value) {
        el.innerHTML = value;
      }
    };
  },
  getCssBinding: function(model, el, bindings, loopStack, attrVal) {
    var css = /(.+):\s(.+)/.exec(attrVal);
    var expr = nweb.parseExpression(model, css[2], loopStack);
    return {
      el: el,
      getValue: function() {
        return nweb.getParsedValue(model, expr, loopStack);
      },
      apply: function(value) {
        if(value)
          $(el).addClass(css[1]);
        else
          $(el).removeClass(css[1]);
      }
    };
  },
  getStyleBinding: function(model, el, bindings, loopStack, attrVal) {
    var style = /(.+):\s(.+)/.exec(attrVal);
    var expr = nweb.parseExpression(model, style[2], loopStack);
    return {
      el: el,
      getValue: function() {
        return nweb.getParsedValue(model, expr, loopStack);
      },
      apply: function(value) {        
        $(el).css(style[1], value);
      }
    };
  },
  getVisibleBinding: function(model, el, bindings, loopStack, attrVal) {    
    var expr = nweb.parseExpression(model, attrVal, loopStack);
    return {
      el: el,
      getValue: function() {
        return nweb.getParsedValue(model, expr, loopStack);
      },
      apply: function(value) {        
        if(value)
          $(el).show();
        else
          $(el).hide();
      }
    };
  },
  getDisableBinding: function(model, el, bindings, loopStack, attrVal, isEnable) {
    var expr = nweb.parseExpression(model, attrVal, loopStack);
    return {
      el: el,
      getValue: function() {
        return nweb.getParsedValue(model, expr, loopStack);
      },
      apply: function(value) {        
        $(el).prop("disabled", value && !isEnable);
      }
    };
  },
  getEnableBinding: function(model, el, bindings, loopStack, attrVal) {    
    return nweb.getDisableBinding(model, el, bindings, loopStack, attrVal, true);
  },
  getValueBinding: function(model, el, bindings, loopStack, attrVal) {
    var expr = nweb.parseExpression(model, attrVal, loopStack);
    var $el = $(el);
    if($el.is(":text")) {
      $el.on("keyup", function() {
        nweb.execute(function() {
          eval(expr + " = $el.val();");
        });
      });
    } else {
      $(el).change(function() {
        nweb.execute(function() {
          var newVal = nweb.getValue(el);
          eval(expr + " = newVal;");
        });
      })
    };
    return {
      el: el,
      getValue: function() {
        return nweb.getParsedValue(model, expr, loopStack);
      },
      apply: function(value) {
        nweb.setValue($el[0], value);        
      }
    };
  },
  getCheckedBinding: function(model, el, bindings, loopStack, attrVal) {
    var expr = nweb.parseExpression(model, attrVal, loopStack);
    var $el = $(el);

    $(el).change(function() {
      nweb.execute(function() {
        eval(expr + " = $el.prop('checked');");
      });
    })

    return {
      el: el,
      getValue: function() {
        return nweb.getParsedValue(model, expr, loopStack);
      },
      apply: function(value) {
        $el.prop("checked", value);
      }
    };
  },
  getRepeatBinding: function(model, el, bindings, loopStack, attrVal) {
    var $el = $(el);
    var repeat = /(.+)\sin\s(.+)/.exec(attrVal);
    var html = el.outerHTML;    
    var expr = nweb.parseExpression(model, repeat[2], loopStack);    

    $el = nweb.utils.replaceWith($el, $("<!-- repeat " + expr + " -->"));
    el.__nw_is_template = true;
    el.__nw_is_repeat = true;

    var binding = {
      el: el,
      generatedEls: [],
      subBindings: [],
      getValue: function() {
          var ret = nweb.getParsedValue(model, expr, loopStack);

          if (ret.toArray)
              return ret.toArray();
          else
              return ret;
      },
      apply: function(value) {
        var array = value;

        for (var i = 0; i < binding.generatedEls.length; i++)
          binding.generatedEls[i].remove();

        binding.generatedEls = [];
        binding.subBindings = [];

        for (var i = array.length - 1; i >= 0; i--) {
          var $newEl = $(html).removeAttr("nw-repeat");
          
          $newEl.insertAfter($el);

          nweb.applyBindings(model, $newEl[0], binding.subBindings, loopStack.concat({ name: repeat[1], val: array[i] }), true);
          binding.generatedEls.push($newEl);
        };
      }
    };
    return binding;
  },
  getTemplateBinding: function(model, el, bindings, loopStack, attrVal) {
    var $el = $(el);
    var template = /(.+):\s(.+)/.exec(el.getAttribute("nw-template"));
    var parsedVal;

    if(!template) {
      template = /(.+)/.exec(el.getAttribute("nw-template"));
      parsedVal = model;
    } else {
      parsedVal = nweb.parseExpression(model, template[2], loopStack);
    }

    var parsedName = nweb.parseExpression(model, template[1], loopStack);    
    var html = $("#" + nweb.getParsedValue(model, parsedName, loopStack)).html();
    el.__nw_is_template = true;

    var binding = {
      el: el,
      subBindings: [],
      getValue: function() {
        return nweb.getParsedValue(model, parsedVal, loopStack);
      },
      apply: function(value) {
        $el = nweb.utils.replaceWith($el, $(html).removeAttr("nw-template"));
        nweb.applyBindings(value, $el[0], binding.subBindings = [], loopStack, true);        
      }
    };
    return binding;
  },
  getWhenBinding: function (model, el, bindings, loopStack, attrVal, isUnless) {
    var $el = $(el);
    var expr = nweb.parseExpression(model, attrVal, loopStack);        
    var html = el.outerHTML;
    
    $el = nweb.utils.replaceWith($el, $("<!-- " + expr + " -->"));
    el.__nw_is_template = true;

    var binding = {
      el: el,
      subBindings: [],
      getValue: function () {
        return nweb.getParsedValue(model, expr, loopStack);
      },
      apply: function (value) {
        binding.subBindings = [];

        if (value && !isUnless) {
          $el = nweb.utils.replaceWith($el, $(html));

          if(isUnless)
            $el.removeAttr("nw-unless");
          else
            $el.removeAttr("nw-when");

          nweb.applyBindings(model, $el[0], binding.subBindings, loopStack, true);
        } else {
          $el.hide();
        }
      }
    };
    return binding;
  },
  getUnlessBinding: function (model, el, bindings, loopStack, attrVal) {
    return getWhenBinding(model, el, bindings, loopStack, attrValue, true)
  },
  getClickBinding: function(model, el, bindings, loopStack, attrVal) {
    var parsed = nweb.parseExpression(model, attrVal, loopStack);
    $(el).on("click", function() {
      nweb.execute(function() {
        nweb.getParsedValue(model, parsed, loopStack);  
      })
    });
  },
  getSubmitBinding: function(model, el, bindings, loopStack, attrVal) {
    var parsed = nweb.parseExpression(model, attrVal, loopStack);
    $(el).on("submit", function() {
      nweb.execute(function() {
        nweb.getParsedValue(model, parsed, loopStack);  
      })
    });
  },
  getEventsBinding: function(model, el, bindings, loopStack, attrVal) {
    var parsed = nweb.parseExpression(model, attrVal, loopStack);
    var method = nweb.getParsedValue(model, parsed, loopStack, el);
    method.apply(el);
  },
  applyLoopStackToExpr: function(expr, loopStack) {
    for (var i = loopStack.length - 1; i >= 0; i--) {
      var loop = loopStack[i];
      var re = new RegExp("(\\W|^)" + loop.name + "(\\W|$)", "g");
      expr = expr.replace(re, "$1loopStack[" + i + "].val$2");
    };
    return expr;
  },
  parseExpression: function(model, expr, loopStack) {
    if(expr == "self")
      return "model";
    var expr = nweb.applyLoopStackToExpr(expr, loopStack);
    return expr.replace(/self\./g, "model.");
  },
  getParsedValue: function(model, parsedExpr, loopStack, returnFunction) {
    if(parsedExpr.length === 0)
      return null;
    else {      
      try {
        var val = eval(parsedExpr);
        if(nweb.utils.isFunction(val) && !returnFunction) {
          if(loopStack.length > 0)
            return val(loopStack[loopStack.length - 1].val);
          return val(functionParams);
        }
        else
          return val;
      } catch(e) {
        throw "Error evaluating: " + parsedExpr + " " + e;
      }
    }
  },
  execute: function(code) {
    code();
    nweb.invalidate(nweb.bindings);
  },
  invalidate: function(bindings) {
    if(typeof bindings === 'undefined')
      bindings = nweb.bindings;
    var changeFound;
    do {
      changeFound = false;
      for (var i = bindings.length - 1; i >= 0; i--) {
        var binding = bindings[i];
        var newValue = binding.getValue();

        if(typeof newValue === 'undefined')
          continue;

        if(nweb.utils.isArray(newValue)) {
          if(!binding.oldValue || !nweb.utils.areArraysEqual(newValue, binding.oldValue)) {
            changeFound = true;  
            binding.apply(newValue);
          }

          binding.oldValue = newValue.slice();
        } else {
          if(binding.oldValue !== newValue) {
            changeFound = true;
            binding.apply(newValue);
            binding.oldValue = newValue;
          }
        }

        if (binding.subBindings)
          nweb.invalidate(binding.subBindings);
      }
    } while(changeFound)
  },
  savePosition: function($el) {
      $el[0].__nw_prev = $el.prev();
      $el[0].__nw_parent = $el.parent();      
  },
  restoreInSavedPosition: function($el) {    
    if ($el[0].__nw_prev.length > 0)
        $el[0].__nw_prev.after($el);
    else
        $el[0].__nw_parent.prepend($el);
  },
  getValue: function(el) {
    if(el.tagName == "SELECT") {
      var selected = $("option:selected", el)[0];
      if(selected)
        return selected[nweb.dataKey];
    } else {
      return $(el).val();
    }
  },
  setValue: function(el, val) {
    if(el.tagName == "SELECT") {
      var toSelect = $("option", el).filter(function() {
        return this[nweb.dataKey] == val;
      }).prop("selected", false);
      toSelect.prop("selected", true);
    } else if(el.tagName == "OPTION") {
      el[nweb.dataKey] = val;
    } else {
      $(el).val(val);
    }
  },
  dataKey: "__nw_value_data",
  bindings: []  
};

nweb.utils = {
    isArray: function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    },
    areArraysEqual: function(a1, a2) {
        return JSON.stringify(a1) == JSON.stringify(a2);
    },
    isFunction: function(obj) {
        return obj && { }.toString.call(obj) == '[object Function]';
    },
    toTypedObject: function(obj) {
        if (typeof obj === "string") {
            try {
                obj = JSON.parse(obj);
            } catch(e) {
            }
        }

        if (!!obj.$type) {
            var typename = obj.$type.replace(/\./g, "_").replace(/\+/g, "_").replace(/(.+),.+/g, "$1");
            var newObj = eval('new ' + typename + '()');
            for (var p in obj) {
                if (obj.hasOwnProperty(p) && newObj.hasOwnProperty(p)) {
                    if (typeof newObj[p] === "function")
                        newObj[p](nweb.utils.toTypedObject(obj[p]));
                    else
                        newObj[p] = nweb.utils.toTypedObject(obj[p]);
                }
            }
            return newObj;
        }
        if (obj instanceof Array) {
            var newArr = [];
            for (var i = 0, l = obj.length; i < l; newArr.push(nweb.utils.toTypedObject(obj[i++]))) ;
            return newArr;
        }
        return obj;
    },
    getTemplateName: function(model, viewName) {
        if (!model)
            throw "Model passed in template() cannot be null or undefined. Make sure, you initialized members that are used in templating.";

        return nweb.utils.getConstructorName(model) + "__" + viewName;
    },
    getConstructorName: function(model) {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec(model.constructor.toString());
        return (results && results.length > 1) ? results[1] : "";
    },
    htmlEncode: function(value) {
        return $('<div/>').text(value).html();
    },
    htmlDecode: function(value) {
        return $('<div/>').html(value).text();
    },
    getElementAttributes: function(el) {
        var arr = [];
        for (var i = 0, attrs = el.attributes, l = attrs.length; i < l; i++) {
            arr.push(attrs[i]);
        }
        arr.sort(function (a, b) {
          if (a.nodeName == "nw-repeat")
            return -2;
          if (a.nodeName == "nw-when" || a.nodeName == "nw-unless")
            return -1;
          return 1;
        });
        return arr;
    },
    replaceWith: function($el, $newEl) {
        $el.replaceWith($newEl);
        return $newEl;
    }
};

Array.prototype.getEnumerator = function() {
    this.__enumeratorIndex = -1;
    this.Current = null;
    return this;
};

Array.prototype.dispose = Array.prototype.getEnumerator;

Array.prototype.moveNext = function() {
    if (typeof this.__enumeratorIndex === 'undefined')
        this.__enumeratorIndex = -1;
    this.__enumeratorIndex++;
    this.Current = this[this.__enumeratorIndex];
    return this.__enumeratorIndex < this.length;
};

Array.prototype.current = function() {
    return this[this.__enumeratorIndex];
};

Array.prototype.hd = function() {
    return this[0];
};

Array.prototype.tl = function() {
    return this.splice(1);
};

Array.prototype.Head = Array.prototype.hd;
Array.prototype.Tail = Array.prototype.tl;

Array.prototype.remove = function() {
    var what, ax;
    while (arguments.length && this.length) {
        what = arguments[--arguments.length];
        while ((ax = this.indexOf(what)) != -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (what, i) {
        i = i || 0;
        while (i < this.length) {
            if (this[i] === what) return i;
            ++i;
        }
        return -1;
    };
}

// TODO: Maybe move
var Nemerle_Utility_Identity = {
    Instance: function (x) {
        return x;
    }
};
