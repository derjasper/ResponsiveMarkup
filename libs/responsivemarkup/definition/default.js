(function () {
    ResponsiveMarkup.block_definitions = {
        _rootBlock: "responsivemarkup",
        responsivemarkup: {
            param: {},
            subblock: {
                main: {quantifier:"1",allowed:["section"]}
            },
            getParam: {},
            getBlock: {
                main: function(data){
                    var r = data.getElementsByTagName("section");
                    if (r.length>0) return r[0];
                    else return undefined;
                }
            },
            render: function(instance,data,context) {
                var elm = document.createElement("div");
                var content_element = this.getBlock.main(data);
                if (content_element != undefined) {
                    elm.appendChild(ResponsiveMarkup._render(instance, content_element, context));
                }
                else {
                    if (ResponsiveMarkup._show_placeholder(instance,data,"main",context)) elm.appendChild(ResponsiveMarkup._render_placeholder(instance, data, "main",context));
                }
                return elm;
            },
            generate: function(root,params,blocks) {
                var elm = root.createElement('responsivemarkup');
                if (blocks.main!=undefined) {
                    elm.appendChild(blocks.main);
                }
                return elm;
            }
        },
        textblock: {
            param: {
                content: 'html|ul,li,strong,a,table,tr,th,td,p,br'
            },
            subblock: {},
            getParam: {
                content: function(data) {
                    var serialized = "";
                    var x = data.firstChild;
                    while (x != null) {
                        serialized += (new XMLSerializer()).serializeToString(x);
                        x = x.nextSibling;
                    }
                    return serialized;
                }
            },
            getBlock: {},
            render: function (instance, data, context) {
                var elm = document.createElement("div");
                elm.innerHTML = this.getParam.content(data);
                return elm;
            },
            generate: function(root,params,blocks) {
                var xmlDoc=(new DOMParser()).parseFromString('<textblock>'+params.content+'</textblock>',"text/xml");
                
                return xmlDoc.firstChild;
            }
        },
        image: {
            param: {
                src: 'imageUrl',
                description: 'string'
            },
            subblock: {},
            getParam: {
                src: function(data) {
                    return data.getAttribute('src');
                },
                description: function(data) {
                    return data.getAttribute('description');
                }
            },
            getBlock: {},
            render: function (instance, data, context) {
                if (context.img_url == undefined)
                    context.img_url = "";
                
                var elm = document.createElement("div");

                var img = document.createElement("img");
                var imgUrl = context.img_url.replace("%ID%",this.getParam.src(data));
                img.setAttribute("src",imgUrl);
                elm.appendChild(img);

                var desc = document.createElement("div");
                desc.appendChild(document.createTextNode(this.getParam.description(data)));
                elm.appendChild(desc);

                return elm;
            },
            generate: function(root,params,blocks) {
                var elm = root.createElement('image');
                elm.setAttribute('src',params.src);
                elm.setAttribute('description',params.description);
                return elm;
            }
        },
        section: {
            param: {
                title: 'string'
            },
            subblock: {
                content: {quantifier:"list",allowed:["section","textblock","imageandtext","row"]}
            },
            getParam: {
                title: function(data) {
                    var e = data.getElementsByTagName("title")[0].firstChild;
                    if (e != undefined)
                        return e.nodeValue;
                    
                    return "";
                }
            },
            getBlock: {
                content: function(data){
                    var elms = [];
                    var x = data.getElementsByTagName("content")[0].firstChild;
                    while (x != null) {
                        if (x.nodeType==1) 
                            elms.push(x);
                        x = x.nextSibling;
                    }
                    return elms;
                }
            },
            render: function (instance, data, context) {
                var elm = document.createElement("div");

                if (context.section_level == undefined)
                    context.section_level = 0;
                context.section_level++;

                context.imageandtext_count=0;
                
                if (context.show_root_title == undefined)
                    context.show_root_title = true;

                if (context.show_root_title) {
                    var title = document.createElement("h" + context.section_level);
                    title.appendChild(document.createTextNode(this.getParam.title(data)));
                    elm.appendChild(title);
                }
                else {
                    context.show_root_title = true;
                }
                
                var content_elements = this.getBlock.content(data);
                for (var i=0;i<content_elements.length;i++) {
                    elm.appendChild(ResponsiveMarkup._render(instance, content_elements[i], context));
                }

                if (ResponsiveMarkup._show_placeholder(instance,data,"content",context)) elm.appendChild(ResponsiveMarkup._render_placeholder(instance,data,"content",context));

                context.section_level--;

                return elm;
            },
            generate: function(root,params,blocks) {
                var elm = root.createElement('section');
                
                var title = root.createElement('title');
                title.appendChild(root.createTextNode(params.title));
                elm.appendChild(title);
                
                var content = root.createElement('content');
                if (blocks.content!=undefined) {
                    for (var i=0;i<blocks.content.length;i++) {
                        content.appendChild(blocks.content[i]);
                    }
                }
                elm.appendChild(content);
                
                return elm;
            }
            
        },
        row: {
            param: {},
            subblock: {
                column: {quantifier:"list",allowed:["column"]}
            },
            getParam: {},
            getBlock: {
                column: function(data) {
                    var elms = [];
                    var x = data.firstChild;
                    while (x != null) {
                        if (x.nodeType==1) 
                            elms.push(x);
                        x = x.nextSibling;
                    }
                    return elms;
                }
            },
            render: function (instance, data, context) {
                var elm = document.createElement("div");
                
                var column_elements = this.getBlock.column(data);
                for (var i=0;i<column_elements.length;i++) {
                    var wrapper = document.createElement("div");
                    wrapper.setAttribute("class","column-wrapper");
                    wrapper.appendChild(ResponsiveMarkup._render(instance, column_elements[i], context))
                    elm.appendChild(wrapper);
                }

                if (column_elements.length<4 && ResponsiveMarkup._show_placeholder(instance,data,"column",context)) {
                    var wrapper = document.createElement("div");
                    wrapper.setAttribute("class","column-wrapper");
                    wrapper.appendChild(ResponsiveMarkup._render_placeholder(instance,data,"column",context));
                    elm.appendChild(wrapper);
                    
                    elm.setAttribute("class","colcount-"+(column_elements.length+1));
                }
                else {
                    elm.setAttribute("class","colcount-"+column_elements.length);
                }

                return elm;
            },
            generate: function(root,params,blocks) {
                var elm = root.createElement('row');
                
                if (blocks.column!=undefined) {
                    for (var i=0;i<blocks.column.length;i++) {
                        elm.appendChild(blocks.column[i]);
                    }
                }
                
                return elm;
            }
        },
        column: {
            param: {
                title: 'string'
            },
            subblock: {
                content: {quantifier:"list",allowed:["textblock","image","imageandtext"]}
            },
            getParam: {
                title: function(data) {
                    var e = data.getElementsByTagName("title")[0].firstChild;
                    if (e != undefined)
                        return e.nodeValue;
                    
                    return "";
                }
            },
            getBlock: {
                content: function(data){
                    var elms = [];
                    var x = data.getElementsByTagName("content")[0].firstChild;
                    while (x != null) {
                        if (x.nodeType==1) 
                            elms.push(x);
                        x = x.nextSibling;
                    }
                    return elms;
                }
            },
            render: function (instance, data, context) {
                var elm = document.createElement("div");

                if (context.section_level == undefined)
                    context.section_level = 0;
                context.section_level++;

                context.imageandtext_count=0;
                
                if (context.show_root_title == undefined)
                    context.show_root_title = true;

                if (context.show_root_title) {
                    var title = document.createElement("h" + context.section_level);
                    title.appendChild(document.createTextNode(this.getParam.title(data)));
                    elm.appendChild(title);
                }
                else {
                    context.show_root_title = true;
                }
                
                var content_elements = this.getBlock.content(data);
                for (var i=0;i<content_elements.length;i++) {
                    elm.appendChild(ResponsiveMarkup._render(instance, content_elements[i], context));
                }

                if (ResponsiveMarkup._show_placeholder(instance,data,"content",context)) elm.appendChild(ResponsiveMarkup._render_placeholder(instance,data,"content",context));

                context.section_level--;

                return elm;
            },
            generate: function(root,params,blocks) {
                var elm = root.createElement('column');
                
                var title = root.createElement('title');
                title.appendChild(root.createTextNode(params.title));
                elm.appendChild(title);
                
                var content = root.createElement('content');
                if (blocks.content!=undefined) {
                    for (var i=0;i<blocks.content.length;i++) {
                        content.appendChild(blocks.content[i]);
                    }
                }
                elm.appendChild(content);
                
                return elm;
            }
        },
        imageandtext: {
            param: {},
            subblock: {
                image: {quantifier:"1",allowed:["image"]},
                content: {quantifier:"1",allowed:["textblock"]}
            },
            getParam: {},
            getBlock: {
                image: function(data) {
                    var r = data.getElementsByTagName("image");
                    if (r.length>0) return r[0];
                    else return undefined;
                },
                content: function(data){
                    var r = data.getElementsByTagName("textblock");
                    if (r.length>0) return r[0];
                    else return undefined;
                }
            },
            render: function (instance, data, context) {
                var elm = document.createElement("div");

                if (context.imageandtext_count == undefined)
                    context.imageandtext_count = 0;
        
                var imagearea = document.createElement("div");
                imagearea.setAttribute("class","img");
                var image_item = this.getBlock.image(data);
                if (image_item!=undefined) 
                    imagearea.appendChild(ResponsiveMarkup._render(instance, image_item, context));
                else if(ResponsiveMarkup._show_placeholder(instance,data,"image",context))
                    imagearea.appendChild(ResponsiveMarkup._render_placeholder(instance, data, "image",context));
                elm.appendChild(imagearea);

                var contentarea = document.createElement("div");
                contentarea.setAttribute("class","content");
                var content_item = this.getBlock.content(data);
                if (content_item!=undefined) 
                    contentarea.appendChild(ResponsiveMarkup._render(instance, content_item, context));
                else if(ResponsiveMarkup._show_placeholder(instance,data,"content",context))
                    contentarea.appendChild(ResponsiveMarkup._render_placeholder(instance, data, "content", context));
                elm.appendChild(contentarea);

                elm.setAttribute("class","c"+context.imageandtext_count % 2);

                context.imageandtext_count++;

                return elm;
            },
            generate: function(root,params,blocks) {
                var elm = root.createElement('imageandtext');
                if (blocks.image!=undefined) elm.appendChild(blocks.image);
                if (blocks.content!=undefined) elm.appendChild(blocks.content);
                return elm;
            }
        }
    };
})();