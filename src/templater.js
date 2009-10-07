/*
 *  templater.js : public domain
 */

templater = function(root, data){
  if (typeof root !== 'object') {
    var re = templater.keyword_re;
    return String(root).replace(re,function($0,$1,$2){
      if ($2 === 'escape') {
        return templater.html_escape(data[$1]);
      } else { // maybe there will be more filters
        return data[$1];
      }
    });
  }
  var re = templater.keyword_only_re;
  if (root['template']) {
    return root['template'].map(function(x){
      return templater(x, data);
    }).join(root['separator'] || '');
  } else if (typeof root['for'] !== 'undefined' && typeof root['do'] !== 'undefined') {
    if (!re.test(root['for'])) throw 'invalid format : ' + root['for'];
    var list = data[RegExp.$1];
    var r = root['do'];
    return list.map(function(d){
      return templater(r, d);
    }).join(root['separator'] || '');
  } else if (typeof root['if'] !== 'undefined' && typeof root['then'] !== 'undefined') {
    if (!re.test(root['if'])) throw 'invalid format : ' + root['if'];
    var cond = data[RegExp.$1];
    if (cond) {
      return templater(root['then'], data);
    } else if (typeof root['else'] !== 'undefined') {
      return templater(root['else'], data);
    }
  } else {
    throw 'invalid object';
  }
}

templater.keyword_re = /{{([^|]*?)(?:\|(escape))?}}/g;
templater.keyword_only_re = /^{{([^|]*?)}}$/;
templater.unsafe = /[<>"'&]/g;
templater.escape_hash = {"<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;","&":"&amp;"};
templater.html_escape = function(str){
  return String(str).replace(templater.unsafe, function(n){return templater.escape_hash[n];});
};

