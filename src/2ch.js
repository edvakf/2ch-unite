var debug = false;
function log(text){
  if (debug) opera.postError(text);
}

Nich = function(){
  try{
    this.dir = opera.io.filesystem.mountSystemDirectory('storage');
  }catch(e){
    log(e);
    this.dir = null;
  }
};
Nich.prototype.get_dat = function(info){
  var dat = this.get_dat_from_local(info);
  if (!dat || dat.split('\n').length < 1000) {
    var _dat = this.get_dat_from_2ch(info);
    if (_dat && (!dat || _dat.length > dat.length)) {
      dat = _dat;
      this.save_dat(dat, info);
    }
  }
  return dat;
}
Nich.prototype.get_dat_from_2ch = function(info){
  var url = 'http://' + info.host + '/' + info.board + '/dat/' + info.thread + '.dat'
  log(url);
  var dat = null;
  var xhr = new XMLHttpRequest;
  xhr.open('GET',url,false);
  xhr.onreadystatechange = function(){
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // responseText should already be converted to utf-8
        dat = xhr.responseText;
        log(xhr.responseText.slice(0,500));
      } else {
        log(xhr.status);
      }
    }
  };
  xhr.send();
  return dat;
}
Nich.prototype.get_dat_from_local = function(info){
  try{
    var filename = info.host + '_' + info.board + '_' + info.thread + '.dat'
    var stream = this.dir.open(this.dir.resolve('/storage/' + filename), opera.io.filemode.READ);
    if (stream) {
      var ret =  stream.read(1000000, 'utf-8');
      stream.close();
      return ret;
    }
  }catch(e){ // FILE_NOT_FOUND_ERR
    log(e);
    return null;
  }
}
Nich.prototype.save_dat = function(dat, info){
  try{
    var filename = info.host + '_' + info.board + '_' + info.thread + '.dat'
    var stream = this.dir.open(this.dir.resolve('/storage/' + filename), opera.io.filemode.WRITE);
    stream.write(dat);
    stream.close();
  }catch(e){
    log(e);
  }
}
Nich.prototype.dat2html = function(dat, info){
  var self = this;
  return dat.split('\n').map(function(res, i){
      var m = res.match(/^(.*?)<>(.*?)<>(.*?)(ID:.*?)?<>(.*?)<>(.*)$/);
      if (!m) return; // invalid dat file (maybe modified manually...)
      var num = i+1;
      var title = (m[6] === '') ? '' :
        '<h1 style="color:red;font-size:larger;font-weight:normal;margin:-.5em 0 0;">' + m[6] + '</h1>\n<dl class="thread">\n';
      var name = (m[2] === '') ? 
        '<font color=green><b class="name">' + m[1] + '</b></font>' :
        '<a href="mailto:' + m[2] + '"><b class="name">' + m[1] + '</b></a>';
      var id = (typeof m[4] === 'undefined') ? '' :
        '<span class="id">' + m[4] + '</span>';
      var html = title + '<dt id="res_' + num + '">' + num + ' ：' + name + '：' + m[3] + id +
        '<dd>' + self.html_filter(m[5]) + '<br><br>';
      return html;
    }).join('\n') + '</dl>';
}
Nich.prototype.html_filter = function(html){
  var hankaku = {"１":"1","２":"2","３":"3","４":"4","５":"5","６":"6","７":"7","８":"8","９":"9","０":"0"};
  return html.replace(
    /<a href="\.\.\/test\/read\.cgi\/.*?" target="_blank">(.*?)<\/a>/g,
    '$1'
  ).replace(
    // /(＞＞|&gt;＞|＞&gt;|&gt;&gt;|＞|&gt;)([\d１２３４５６７８９０]+(?:[-ー−–ー—―][\d１２３４５６７８９０]+)?)/g
    /(＞＞|&gt;＞|＞&gt;|&gt;&gt;|＞|&gt;)([\d\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff10]+(?:[-\u30fc\u2212\u2013\u30fc\u2014\u2015][\d\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff10]+)?)/g,
    function($0, $1, $2){
      return '<a class="anchor" href="#an_' + $2.replace(
        // /[１２３４５６７８９０]/g
        /[\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff10]/g,
        function(n){return hankaku[n]}
      ).replace(
        // /[ー−–ー—―]/g
        /[\u30fc\u2212\u2013\u30fc\u2014\u2015]/g,
        '-'
      ) + '">' + $1 + $2 + '</a>';
    }
  ).replace(
    /h?(ttps?:\/\/[^\s\])'"）」】<>]+)(&gt;|&lt;)|h?(ttps?:\/\/[^\s\])'"）」】<>]+)/g,
    function($0, $1, $2, $3) {
      if ($1) {
        var u = $1;
        var n = $2;
      } else {
        var u = $3;
        var n = '';
      }
      return '<a href="h' + u + '" class="external">' + u + '</a>' + n;
    }
  );
}

/* not done yet. maybe unneeded.
Nich.prototype.get_boards = function(){
  if (this.boards) return this.boards;
  var url = 'http://menu.2ch.net/bbsmenu.html'
  var xhr = XMLHttpRequest;
  xhr.open('GET',url,false);
  xhr.onload = function(){
    var m = xhr.responseText.match(/<font size=2>(.*?)</font>/);
    var boards = [];
    var category = '';
    m[1].split('\n').forEach(function(str){
      var mm = str.match(/(:?【<B>(.+?)<\/B>】)(.+)/i);
      if (mm) {
        category = mm[1];
        str = mm[2];
      }
      var mm = str.match(/<A HREF=(\S+?)>(.+?)<\/A>/i);
      if (!mm) return;
      boards.push({category : category, host : mm[1], board : mm[2]});
    });
    this.boards = boards;
    return boards;
  }
  xhr.send();
}
*/

var nichan = new Nich();


window.onload = function () {
  var webserver = opera.io.webserver
  if (webserver){
    //webserver.addEventListener('_index', index, false);
    webserver.addEventListener('read',read,false);
  }
}

function read(e){
  var request = e.connection.request;
  var response = e.connection.response;
  thread_url = request.getItem('url');
  if (!thread_url) {
    response.url = './'
  }
  m = thread_url[0].match(/^http:\/\/(.+?)\/test\/read\.cgi\/(.+?)\/(\d+)/);
  if (!m) {
    response.setStatusCode('400','Bad Request');
    response.write('Invalid URL.');
    response.close();
  } else {
    var dat = nichan.get_dat({host:m[1], board:m[2], thread:m[3]});
    if (!dat) {
      response.setStatusCode('404','Not Found');
      //response.write('Thread Not Found');
      response.close();
    } else {
      response.write(nichan.dat2html(dat));
      response.close();
    }
  }
}

