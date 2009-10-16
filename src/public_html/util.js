var debug = true;
function log(e){
  if (debug) opera.postError(e);
}

window.documentFilter = [];
function callDocumentFilters(){
  for (var i=0, l=documentFilter.length; i<l; i++) {
    try{
      documentFilter[i](document);
    }catch(e){
      log(e);
    }
  }
}
if (window.addEventListener) {
  window.addEventListener('DOMContentLoaded', callDocumentFilters, false);
} else if (window.attachEvent) {
  window.attachEvent('onload', callDocumentFilters);
} else {
  window.onload = callDocumentFilters;
}

// Clever anchor linking
/*
(function(){
  var hash_hankaku = {"１":"1","２":"2","３":"3","４":"4","５":"5","６":"6","７":"7","８":"8","９":"9","０":"0"};
  var hankaku = function(z){return hash_hankaku[z]};
  var re_zenkaku = /[\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff10]/g; // /[１２３４５６７８９０]/g
  var re_anchor_html = /<a href="\.\.\/test\/read\.cgi\/.*?" target="_blank">(.*?)<\/a>/g;
  var re_anchor_text = /(?:＞＞|&gt;＞|＞&gt;|&gt;&gt;|＞|&gt;)(([\d\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff10]+)(?:[-\u30fc\u2212\u2013\u30fc\u2014\u2015][\d\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff10]+)?)/g; // /(＞＞|&gt;＞|＞&gt;|&gt;&gt;|＞|&gt;)([\d１２３４５６７８９０]+(?:[-ー−–ー—―][\d１２３４５６７８９０]+)?)/g
  var re_hyphen = /[\u30fc\u2212\u2013\u30fc\u2014\u2015]/g; // /[ー−–ー—―]/g

  function res_filter(_doc){
    var res = _doc.children;
    for (var i=0,l=res.length; i<l; i++) {
      if (/^dd$/i.test(res[i].nodeName)) {
        var nodes = res[i].childNodes;
        for (var j=0,n=nodes.length; j<n; j++) {
          var node = nodes[j];
          if (/^br$/i.test(node.nodeName) continue;
          if (/^a$/i.test(node.nodeName)) {
            var value = node.innerHTML;
          }
          if (/^#text$/.test(node.nodeName) && re_anchor_text(node)) {

          }
        }
      }
    }
    
    var nodes = res.childNodes;
    for (var i=0, 
    return html.replace(re_anchor_html, '$1').replace(
      re_anchor_text, 
      function($0, $1, $2){ // clever anchor generation
        var anchor_format = $1.replace(re_zenkaku, hankaku).replace(re_hyphen, '-');
        var start_res = $2.replace(re_zenkaku, hankaku);
        return '<span class="anchor" title="&gt;&gt;' + anchor_format + '"><a href="#res_' + start_res + '">' + $0 + '</a></span>';
      }
    ).replace( // text linker
      /h?(ttps?:\/\/[^\s\])'"）」】<>]+)(&gt;|&lt;)|h?(ttps?:\/\/[^\s\])'"）」】<>]+)/g,
      function($0, $1, $2, $3) {
        if ($1) {
          var u = $1, n = $2;
        } else {
          var u = $3, n = '';
        }
        return '<a href="h' + u + '" class="external">' + u + '</a>' + n;
      }
    );
  }
})()
*/


// Link to 2ch have option to open in 2ch unite.
(function(){
  var m = location.href.match(/^(http:\/\/.*?)http:\/\/.*/);
  if (!m) return;
  var service = m[1];
  var favicon = 'data:image/gif;base64,R0lGODlhEAAQAPQAAAAAABkOBCMAAFc6FGNVEWxoZ5ksH4txEdMAEOgIGeQpG8Q1Gd9oH7JCQqyOFqGNJ9q0Hs%2BrDum8DPGwIeCgHvjKIf3UI%2FLRKPrPEJ2WdbW0s5uTlPv6%2B%2Bvr7NrW1bvBwSH5BAkAAAAALAAAAAAQABAAAAWmICCKhGM6w6gCB2RV02RZ1LEeFsYoSaJQM5sIZ2EkFgZDD2gRuiQKxaBkXFwsEADBIskYEITKpRq5VAgtTacwcHCjA0jF4ihw7geMZcIzhCsVDhkdGhweERQJCAZxgHSFHR6RBg0EBC6AgQUehR53HRkSc44EBRsaGh4fHBoIDK9zWQCmnp4NCAhHLgQjG3ccGwIDw5cOKxsfGnLLEUIrIicOBAEqIQA7';

  function rewrite2chLink(_doc){
    var external = _doc.getElementsByClassName('external');
    for (var i=0, l=external.length; i<l; i++) {
      var a = external[i];
      if (/^http:\/\/.+?\/test\/read\.cgi\/.+?\/\d+/.test(a.href)) {
        var e = _doc.createElement('a');
        e.href = a.href;
        e.className = 'original';
        var img = _doc.createElement('img');
        img.height = 12;
        img.width = 12;
        img.src = favicon;
        img.alt = '●';
        img.title = '元リンク';
        e.appendChild(img);
        a.parentNode.insertBefore(e, a.nextSibling);
        a.href = service + '?url=' + encodeURIComponent(a.href);
        a.className = 'internal';
      }
    }
  }

  window.documentFilter.push(rewrite2chLink);
})();

// popup anchors.
(function(){
  var style = document.createElement('style');
  style.appendChild(document.createTextNode(
    '.anchor:hover{background-color:#ddd;}'+
    '.anchor_wrapper{'+
      'position:absolute;'+
      'background-color:#e6e6fa;'+
      'border:outset 1px #710100;'+
      'opacity:0.95;'+
      'left:3em;'+
      'margin-top:1em;'+
     '}'
  ));
  document.getElementsByTagName('head')[0].appendChild(style);

  function getRes(start,end){
    var res = [];
    while (start <= end) {
      var head = document.getElementById('res_'+start);
      if (head) {
        res.push(head, head.nextSibling);
      }
      start++;
    }
    return res;
  }
  var popupTimer = null;
  window.preparePopupAnchor = function(span, title){
    var m = title.match(/>>(\d+)(?:-(\d+))?/);
    if (!m) return;
    if (!m[1] || m[1] - m[0] < 0) m[1] = m[0];
    popupTimer = setTimeout(function(){
      var anchors = getRes(m[0]-0, m[1]-0);
      if (!anchors.length) return;
      var wrapper = document.createElement('div');
      wrapper.className = 'anchor_wrapper';
      for (var i=0, l=anchors.length; i<l; i++) {
        var node = anchros[i].cloneNode(true);
        node.id = '';
        wrapper.appendChild(node);
      }
      span.appendChild(wrapper);
    },500);
  }
  window.removePopupAnchor = function(span){
    clearTimeout(popupTimer);
    var popup = span.firstChild.nextSibling;
    if (popup) span.removeChild(popup);
  }

  function setPopupAnchor(_doc){
    var anchor = _doc.getElementsByClassName('anchor');
    for (var i=0, l=anchor.length; i<l; i++) {
      if (!anchor[i].onmouseover) {
        anchor[i].onmouseover = 'preparePopupAnchor(this, this.title)';
        anchor[i].onmouseout = 'removePopupAnchor(this)';
      }
    }
  }

  window.documentFilter.push(setPopupAnchor);
})();

// popup ids.
(function(){
  var style = document.createElement('style');
  style.appendChild(document.createTextNode(
    '.id:hover{background-color:#ddd;}'+
    '.id_wrapper{'+
      'position:absolute;'+
      'background-color:#e6e6fa;'+
      'border:outset 1px #710100;'+
      'opacity:0.95;'+
      'left:3em;'+
      'margin-top:1em;'+
     '}'
  ));
  document.getElementsByTagName('head')[0].appendChild(style);

  function getId(id){
    var res = [];
    var span = document.getElementsByClassName('id');
    var thread = document.getElementsByClassName('thread')[0];
    for (var i=0, l=span.length; i<l; i++) {
      if (span[i].title === id) {
        var head = span[i].parentNode;
        if (head.parentNode === trhead) {
          res.push(head, head.nextSibling);
        }
      }
    }
    return res;
  }
  var popupTimer = null;
  window.preparePopupID = function(span, id){
    popupTimer = setTimeout(function(){
      var ids = getRes(id);
      if (!ids.length) return;
      var wrapper = document.createElement('div');
      wrapper.className = 'id_wrapper';
      for (var i=0, l=ids.length; i<l; i++) {
        var node = ids[i].cloneNode(true);
        node.id = '';
        var childIds = node.getElementsByClassName('id');
        for (var i=0, l=childIds.length; i<l; i++) {
          childIds[i].onmouseover = '';
          childIds[i].onmouseout = '';
        }
        wrapper.appendChild(node);
      }
      span.appendChild(wrapper);
    },500);
  }
  window.removePopupAnchor = function(span){
    clearTimeout(popupTimer);
    var popup = span.firstChild.nextSibling;
    if (popup) span.removeChild(popup);
  }

  function setPopupId(_doc){
    var ids = _doc.getElementsByClassName('id');
    if (!ids.length || ids[0].title.indexOf('ID:?') === 0) return;
    for (var i=0, l=ids.length; i<l; i++) {
      if (!ids[i].onmouseover) {
        ids[i].onmouseover = 'preparePopupId(this, this.title)';
        ids[i].onmouseout = 'removePopupId(this)';
      }
    }
  }

  window.documentFilter.push(setPopupId);
})();

// fetch new res
function fetchNewRes(callback){
  var xhr = new XMLHttpRequest;
  xhr.open('GET',location.href,true);
  xhr.onload = function(){
    var thread = document.getElementsByClassName('thread')[0];
    var children = thread.children;
    var n = children.length;
    var current = 1;
    while(n--) {
      if (/res_(\d+)/.test(children[i].id)) {
        current = +RegExp.$1;
        break;
      }
    }
    var m = xhr.responseText.match(new RegExp('<dl class="thread">.*?(<dt id="res_' + (current+1) + '">.*?)</dl>'));
    if (!m) return;
    var newres = m[1];
    var range=document.createRange();
    range.selectNodeContents(document.body);
    df=range.createContextualFragment(s);
    if (window.documentFilter) {
      for (var i=0,l=documentFilter.length; i<l; i++){
        documentFilter[i](df);
      }
    }
    thread.appendChild(df);
  }
  xhr.send(null);
}

