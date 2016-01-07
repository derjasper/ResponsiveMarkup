// TODO cross-browser compatibility
// TODO remove jQuery dependency
// TODO nicer docs and demo
// TODO add ability to rerange blocks

(function ($) {
    $.fn.onDelayed = function (eventName, delayInMs, callback) {
        var _timeout;
        this.on(eventName, function (e) {
            if (!!_timeout) {
                clearTimeout(_timeout);
            }
            _timeout = setTimeout(function () {
                callback(e);
            }, delayInMs);
        });
    };
})(jQuery);

var ResponsiveMarkup = {};

(function () {

    function widthToRem(obj) {
        return jQuery(obj).width() / parseFloat(jQuery("body").css("font-size"));
    }

    jQuery(window).onDelayed("resize", 200, function () {
        ResponsiveMarkup.update();
    });

    ResponsiveMarkup.instances = [];

    ResponsiveMarkup.create = function (elm, data, edit) {
        this.elm = elm;
        this.data = data;
        this.edit = edit || 0; // 0 : off, 1: simple, 2: extended

        // add class
        jQuery(this.elm).addClass("rm");

        // add listener
        ResponsiveMarkup.instances.push(this);
    }

    ResponsiveMarkup.create.prototype.getData = function () {
        return this.data;
    }

    ResponsiveMarkup.create.prototype.render = function (context) {
        // clear elm
        this._clear();

        // context
        if (context != undefined)
            this.context = context;
        if (this.context == undefined)
            this.context = {};

        // generate tree
        var tree = null;
        try {
            tree = ResponsiveMarkup._render(this, this.data.childNodes[0], jQuery.extend({_edit: this.edit}, this.context));
        }
        catch(e) {
            console.log(e);
            return false;
        }

        // append tree to elm
        this.elm.appendChild(tree);

        // update breakpoints
        ResponsiveMarkup.update(this);

        return true;
    }

    ResponsiveMarkup.create.prototype._clear = function () {
        while (this.elm.firstChild) {
            this.elm.removeChild(this.elm.firstChild);
        }
    }

    ResponsiveMarkup.create.prototype.destroy = function () { // call like this: delete instance.destroy()
        // clear
        this._clear();

        // remove class
        jQuery(this.elm).removeClass("rm");

        // remove listener
        var self = this;
        ResponsiveMarkup.instances = jQuery.grep(ResponsiveMarkup.instances, function (e) {
            return e != self;
        });

        return this;
    }

    ResponsiveMarkup.create.prototype.addBlock = function (data, subblock, type, param) {
        var subblock_allowed = ResponsiveMarkup.block_definitions[data.nodeName].subblock[subblock];
        if (jQuery.inArray(type, subblock_allowed.allowed) == -1)
            throw "Bad written editor: Block not allowed here";

        var param_structure = ResponsiveMarkup.block_definitions[type].param;
        if (!ResponsiveMarkup._verifyParams(param_structure, param))
            return false;

        var newblock = ResponsiveMarkup.block_definitions[type].generate(this.data, param, {});

        var d_params = ResponsiveMarkup._getParams(data);
        var d_subblocks = ResponsiveMarkup._getSubblocks(data);

        if (subblock_allowed.quantifier == "1") {
            d_subblocks[subblock] = newblock;
        }
        else {
            d_subblocks[subblock].push(newblock);
        }

        var newdata = ResponsiveMarkup.block_definitions[data.nodeName].generate(this.data, d_params, d_subblocks);
        var areaid = data.getAttribute("area-id");
        if (areaid!=null) {
            newdata.setAttribute("area-id",areaid);
        }

        data.parentNode.replaceChild(newdata, data);

        this.render();

        return true;
    }

    ResponsiveMarkup.create.prototype.editBlock = function (data, param) {
        var param_structure = ResponsiveMarkup.block_definitions[data.nodeName].param;

        if (!ResponsiveMarkup._verifyParams(param_structure, param))
            return false;

        var d_subblocks = ResponsiveMarkup._getSubblocks(data);

        var newdata = ResponsiveMarkup.block_definitions[data.nodeName].generate(this.data, param, d_subblocks);
        var areaid = data.getAttribute("area-id");
        if (areaid!=null) {
            newdata.setAttribute("area-id",areaid);
        }

        data.parentNode.replaceChild(newdata, data);

        this.render();

        return true;
    }

    ResponsiveMarkup.create.prototype.removeBlock = function (data) {
        data.parentNode.removeChild(data);
        this.render();

        return true;
    }

    ResponsiveMarkup._verifyParams = function (structure, data) {
        for (var p in structure) {
            if (structure.hasOwnProperty(p)) {
                var val = data[p];
                if (val == undefined)
                    return false;
                var verify = this.type_verificators[structure[p].split("|")[0]];
                if (verify == undefined)
                    return false;
                var verify_param = structure[p].split("|").length>1 ? structure[p].split("|")[1].split(",") : [];
                val = verify(val, verify_param);
                if (val == null)
                    return false;
                data[p] = val;
            }
        }
        return true;
    }

    ResponsiveMarkup._getParams = function (data) {
        var p = {};
        var gen = ResponsiveMarkup.block_definitions[data.nodeName].getParam;
        for (var g in gen) {
            if (gen.hasOwnProperty(g)) {
                p[g] = gen[g](data);
            }
        }
        return p;
    }

    ResponsiveMarkup._getSubblocks = function (data) {
        var p = {};
        var gen = ResponsiveMarkup.block_definitions[data.nodeName].getBlock;
        for (var g in gen) {
            if (gen.hasOwnProperty(g)) {
                p[g] = gen[g](data);
            }
        }
        return p;
    }

    ResponsiveMarkup._render = function (instance, data, context) {
        if (data == undefined) {
            throw "Bad written block definitions: data is undefined";
        }

        // check blocktype
        var blocktype = data.nodeName;
        var definition = this.block_definitions[blocktype];
        if (definition == undefined)
            throw "Unknown block " + blocktype;

        // get area id
        if (context._areaid == undefined || context._areaid == null) {
            context._areaid = data.getAttribute("area-id");
        }

        // call render method
        var output = definition.render(instance, data, context);

        // add classes
        jQuery(output).addClass("rm-resize");
        jQuery(output).addClass(data.nodeName);

        if (blocktype !== ResponsiveMarkup.block_definitions._rootBlock)
            output = this._render_block(instance, data, output, context);

        // reset area id
        if (context._areaid == data.getAttribute("area-id")) {
            context._areaid = null;
        }

        return output;
    }

    ResponsiveMarkup._show_placeholder = function (instance, data, subblock, context) {
        if (context._edit == 0)
            return false;
        else if (context._edit == 1) {
            return context._areaid != null;
        }
        else {
            return true;
        }
    }
    ResponsiveMarkup._render_placeholder = function (instance, data, subblock, context) {
        if (this.editor.placeholder != undefined) {
            var _types = this.block_definitions[data.nodeName].subblock[subblock].allowed;
            var types = [];
            for (var i = 0; i < _types.length; i++) {
                types.push({
                    type: _types[i],
                    param: this.block_definitions[_types[i]].param
                });
            }

            return this.editor.placeholder(instance, data, subblock, types);
        }
        else {
            var placeholder = document.createElement("div");
            return placeholder;
        }
    }
    ResponsiveMarkup._render_block = function (instance, data, rendered, context) {
        var allowDelete = false;

        if (context._edit == 0)
            return rendered;
        else if (context._edit == 1) {
            if (context._areaid == null) {
                allowDelete = false;
            }
            else {
                allowDelete = context._areaid != data.getAttribute("area-id");
            }
        }
        else {
            allowDelete = true;
        }

        if (this.editor.blockwrapper != undefined) {
            return this.editor.blockwrapper(rendered, instance, data, data.nodeName, this.block_definitions[data.nodeName].param, this._getParams(data), allowDelete);
        }
        else {
            return rendered;
        }
    }

    ResponsiveMarkup.update = function (instance) {
        if (instance != undefined)
            update(instance.elm, this.breakpoints);
        else {
            var that = this;
            this.instances.forEach(function (e) {
                update(e.elm, that.breakpoints);
            });
        }

        function update(e, breakpoints) {
            var elms = e.getElementsByClassName("rm-resize");
            for (var i = 0; i < elms.length; i++) {
                var elm = elms[i];
                var w = widthToRem(elm);
                var j = $(elm);
                var add = true;
                for (var bp in breakpoints) {
                    if (w <= breakpoints[bp][1] && add) {
                        j.addClass(bp);
                        add = false;
                    }
                    else {
                        j.removeClass(bp);
                    }
                }
            }
        }
    }

    ResponsiveMarkup.breakpoints = {// in rem
        s: [0, 40],
        m: [40.063, 64],
        l: [64.063, 90],
        xl: [90.063, 120],
        xxl: [120.063, Infinity]
    };

    ResponsiveMarkup.editor = {};

    ResponsiveMarkup.block_definitions = {_rootBlock: null};

    ResponsiveMarkup.type_verificators = {};

    ResponsiveMarkup.type_verificators.string = function (val) {
        return val;
    }

    ResponsiveMarkup.type_verificators.imageUrl = function (val) {
        if (val.match(/^[a-zA-Z0-9]+$/g)!=null) {
            return val;
        }
        return null;
    }
    ResponsiveMarkup.type_verificators.videoUrl = function (val) {
        if (val.match(/^[a-zA-Z0-9]+$/g)!=null) {
            return val;
        }
        return null;
    }
    ResponsiveMarkup.type_verificators.html = function (val, param) {
        var parser=new DOMParser();
        var xmlDoc=parser.parseFromString('<root>'+val+'</root>',"text/xml");

        if (xmlDoc.getElementsByTagName("parsererror").length>0)
            return null;

        var str = "";
        for (var i=0;i<param.length;i++)
            str+='<'+param[i]+'>';

        return strip_tags(val,str);
    }

    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    function escapeHtml(string) {
        return String(string).replace(/[&<>"'\/]/g, function (s) {
            return entityMap[s];
        });
    }

    function strip_tags(input, allowed) {

        allowed = (((allowed || '') + '')
                .toLowerCase()
                .match(/<[a-z][a-z0-9]*>/g) || [])
                .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
                commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
        return input.replace(commentsAndPhpTags, '')
                .replace(tags, function ($0, $1) {
                    return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
                });
    }


})();
