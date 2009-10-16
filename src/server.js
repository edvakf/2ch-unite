/*
 * server.js : public domain
 * dependency : 2ch.js
 */

var debug = true;
function log(text){
  if (debug) opera.postError(text);
}

var nichan = new Nichan();
var webserver = opera.io.webserver;
var servicePath = webserver.currentServicePath;
//log('launching service at '+servicePath);

var appdir = opera.io.filesystem.mountSystemDirectory('application');

function dispatch(e){
  var req = e.connection.request;
  var res = e.connection.response;
  var relPath = req.uri.slice( servicePath.length )

  //log(relPath);
  switch (true) {
  case /^\?/.test(relPath) :
    var threadUrl = req.getItem('url')[0];
    if (/^(http:\/\/.+?\/test\/read\.cgi\/.+?\/\d+)\/?([^#?]*)(?:[#?].*)?$/.test(threadUrl)) {
      res.setStatusCode('302','Found');
      threadUrl = RegExp.$1 + '/' + (RegExp.$2 ? '#' + RegExp.$2 : '');
      res.setResponseHeader('Location', req.protocol + '://' + req.host + servicePath + threadUrl );
      return res.close();
    }
  case /^http:\/\/.+?\/test\/read\.cgi\/.+?\/\d+/.test(relPath) : 
    //log(req.uri);
    return read(e, !!req.getItem('quick'));
  default :
    //return res.closeAndRedispatch(); //can't use in a zip??
    var file = appdir.resolve('/public_html/'+(relPath||'index.html'));
    res.writeFile(file);
    res.close();
    return;
  }
  res.setStatus('404','Not Found');
  res.close();
}

function read(e, quick){
  var req = e.connection.request;
  var res = e.connection.response;
  threadUrl = req.uri.slice( servicePath.length );
  //log(threadUrl);
  m = threadUrl.match(/^http:\/\/(.+?)\/test\/read\.cgi\/(.+?)\/(\d+)/);
  if (!m) {
    res.setStatusCode('400','Bad Request');
    res.write('Invalid URL: ' + threadUrl);
    res.close();
  } else {
    var info = {host:m[1], board:m[2], thread:m[3]};
    var dat = quick ? nichan.get_dat_from_local(info) : nichan.get_dat(info);
    if (!dat) {
      res.setStatusCode('404','Not Found');
      res.close();
    } else {
      html = nichan.dat2html(dat,info);
      html = html.replace(/<dl class="thread">[\s\S]*?<\/dl>/i,function(m){return res_filter(m)});
      res.write(html);
      res.close();
    }
  }
}

function res_filter(html){
  var hash_hankaku = {"１":"1","２":"2","３":"3","４":"4","５":"5","６":"6","７":"7","８":"8","９":"9","０":"0"};
  var hankaku = function(z){return hash_hankaku[z]};
  var re_zenkaku = /[\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff10]/g; // /[１２３４５６７８９０]/g
  var re_anchor_html = /<a href="\.\.\/test\/read\.cgi\/.*?" target="_blank">(&gt;&gt;\d+*?)<\/a>/g;
  var re_anchor_text = /(?:＞＞|&gt;＞|＞&gt;|&gt;&gt;|＞|&gt;)(([\d\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff10]+)(?:[-\u30fc\u2212\u2013\u30fc\u2014\u2015][\d\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff10]+)?)/g; // /(＞＞|&gt;＞|＞&gt;|&gt;&gt;|＞|&gt;)([\d１２３４５６７８９０]+(?:[-ー−–ー—―][\d１２３４５６７８９０]+)?)/g
  var re_hyphen = /[\u30fc\u2212\u2013\u30fc\u2014\u2015]/g; // /[ー−–ー—―]/g

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

window.onload = function () {
  if (webserver){
    //webserver.addEventListener('_index', index, false);
    //webserver.addEventListener('read',read,false);
    webserver.addEventListener('_request',dispatch,false);
  }
}



