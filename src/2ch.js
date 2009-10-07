/*
 * 2ch.js : public domain
 * dependency : templater.js
 */
debug = true;
var log = function(e){if (debug) opera.postError(e)}

Nichan = function(){
  this.dir = opera.io.filesystem.mountSystemDirectory('shared');
};
Nichan.prototype.get_and_save_dat = function(info){
  var dat = this.get_dat_from_local(info);
  var _dat = this.get_dat_from_2ch(info);
  if (_dat && (!dat || _dat.length > dat.length)) {
    dat = _dat;
    this.save_dat(dat, info);
  }
  return dat;
}
Nichan.prototype.get_dat = function(info){
  var dat = this.get_dat_from_local(info);
  if (!dat) return this.get_and_save_dat(info);
  var self = this;
  setTimeout(function(){self.get_and_save_dat(info)},100);
  return dat;
}
Nichan.prototype.get_dat_from_2ch = function(info){
  var url = 'http://' + info.host + '/' + info.board + '/dat/' + info.thread + '.dat'
  //log(url);
  var dat = null;
  var xhr = new XMLHttpRequest;
  xhr.open('GET',url,false);
  xhr.onreadystatechange = function(){
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // responseText should already be converted to utf-8
        dat = xhr.responseText;
      } else {
        //log(xhr.status);
      }
    }
  };
  xhr.send();
  return dat;
}
Nichan.prototype.get_dat_from_local = function(info){
  try{
    var filename = info.host + '_' + info.board + '_' + info.thread + '.dat'
    var stream = this.dir.open(this.dir.resolve('/' + filename), opera.io.filemode.READ);
    if (stream) {
      var ret =  stream.read(1000000, 'shift_jis');
      stream.close();
      return ret;
    }
  }catch(e){ // FILE_NOT_FOUND_ERR
    log(e);
    return null;
  }
}
Nichan.prototype.save_dat = function(dat, info){
  try{
    var filename = info.host + '_' + info.board + '_' + info.thread + '.dat'
    var stream = this.dir.open(this.dir.resolve('/' + filename), opera.io.filemode.WRITE);
    // stream.write(dat,'shift_jis'); // this won't write with shift_jis http://orera.g.hatena.ne.jp/edvakf/20091004/1254635221
    stream.writeLine(dat.slice(0,-1),'shift_jis');  // slice(0,-1) removes the last 'newline', which will be re-added by writeLine
    stream.close();
  }catch(e){
    log(e);
  }
}

Nichan.prototype.dat2obj = function(dat, info){
  var obj = {title:'', res:[], host:info.host, board:info.board, thread:info.thread};
  dat.split('\n').forEach(function(res, i){
    var m = res.match(/^(.*?)<>(.*?)<>(.*?)<>(.*?)<>(.*)$/);
    if (!m) return; // invalid dat file (maybe modified manually...)
    obj.res.push({num: i+1, name: m[1], mail: m[2], time: m[3], content: m[4]});
    if (i === 0) obj.title = m[5];
  });
  return obj;
}

Nichan.prototype.dat2html = function(dat, info){
  var data = this.dat2obj(dat, info);
  var t = new Date;
  var html = templater(Nichan.page_template, data);
  log((new Date-t)/1000);
  return html;
}

Nichan.res_template = {
  'template': [
    '<dt>',
    '{{num}}：',
    {'if':'{{mail}}',
      'then':'<a href="mailto:{{mail}}"><b>{{name}}</b></a>',
      'else':'<font color=green><b>{{name}}</b></font>'},
    '：{{time}}',
    '<dd>',
    '{{content}}'
    '<br><br>'],
  'separator':''
}

Nichan.page_template = {
  'template': [
    '<html>',
    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
    '<head>',
    '<base href="http://{{host}}/{{board}}/">',
    '<title>{{title}}</title>',
    '</head>',
    '<body bgcolor=#efefef text=black link=blue alink=red vlink=#660099>',
    '<div style="margin-top:1em;"><span style="float:left;">',
    '<a href="http://2ch.net/">２ちゃんねる</a>',
    '<a href="./">■掲示板に戻る■</a>',
    '</span>',
    '<span style="float:right;">',
    '[PR]<a href=http://www.opera.com/>Opera最強伝説</a>[PR]',
    '</span>&nbsp;</div>',
    '<hr style="background-color:#888;color:#888;border-width:0;height:1px;position:relative;">',
    '<h1 style="color:red;font-size:larger;font-weight:normal;margin:-.5em 0 0;">{{title}}</h1>',
    '<dl class="thread">',
    {'for':'{{res}}', 
      'do':Nichan.res_template,
      'separator':'\n'}
    '</dl>',
    '<hr>',
    '<a href="./">掲示板に戻る</a>',
    '<a href="../test/read.cgi/software/1254222421/">全部</a>',
    '<form method=POST action="">',
    '<input type=submit value="書き込む" name=submit>',
    '名前： <input name=FROM size=19>',
    'E-mail<font size=1> (省略可) </font>: <input name=mail size=19><br>',
    '<textarea rows=5 cols=70 wrap=off name=MESSAGE></textarea>',
    '<input type=hidden name=bbs value={{board}}>',
    '<input type=hidden name=key value={{thread}}>',
    '<input type=hidden name=time value=>',
    '</form>',
    '</body>',
    '</html>'],
  'separator':'\n'
}

/*
Nichan.prototype.dat2html = function(dat, info){
  var self = this;
  var title = '';
  var thread_html = dat.split('\n').map(function(res, i){
    var m = res.match(/^(.*?)<>(.*?)<>(.*?)<>(.*?)<>(.*)$/);
    if (!m) return; // invalid dat file (maybe modified manually...)
    var num = i+1;
    var name = m[1], mail = m[2], time = m[3], text = m[4];
    if (num === 1) title = m[5];
    name = (mail === '') ? 
      '<font color=green><b class="name">' + name + '</b></font>' :
      '<a href="mailto:' + mail + '"><b class="name">' + name + '</b></a>';
    time = time.replace(/ID:\S+/,'<span class="id" title="$1">$1</span>').replace(/BE:\S+/,'<span class="be" title="$1">$1</span>');
    return '<dt id="res_' + num + '">' + num + ' ：' + name + '：' + time + '<dd>' + self.res_filter(text) + '<br><br>';
  }).join('\n');
  
  return {title: title, thread_html: thread_html};
}
Nichan.prototype.res_filter = function(html){
  var hash_hankaku = {"１":"1","２":"2","３":"3","４":"4","５":"5","６":"6","７":"7","８":"8","９":"9","０":"0"};
  var hankaku = function(z){return hash_hankaku[z]};
  var re_zenkaku = /[\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff10]/g; // /[１２３４５６７８９０]/g
  var re_anchor_html = /<a href="\.\.\/test\/read\.cgi\/.*?" target="_blank">(.*?)<\/a>/g;
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
*/

/* not done yet. maybe unneeded.
Nichan.prototype.get_boards = function(){
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

