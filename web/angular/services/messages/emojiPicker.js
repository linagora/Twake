function serviceEmojiPicker(app){
  return app.controller("emojiPickerCtrl", function($rootScope, $http){

    var that = this;

  })
  .directive("emojiButton", function($msgParsing, $sce, $compile){
      return{
          restrict: 'A',
          link: function($scope, $element, $attrs){
            $($element).emojioneArea({
              standalone: true,
              autocomplete: false,
              events: {
                emojibtn_click: function (button, event) {
                  var name = jQuery(button).data("name");

                  jQuery($element).parent().find(".emojione.open")[0].src=jQuery(button).children()[0].currentSrc;

                  var txtarea = jQuery($element).parent().parent().find(".input-container").find("textarea")[0];
                  //IE support
                  if (document.selection) {
                      txtarea.focus();
                      sel = document.selection.createRange();
                      sel.text = name;
                  }
                  //MOZILLA and others
                  else if (txtarea.selectionStart || txtarea.selectionStart == '0') {
                      var startPos = txtarea.selectionStart;
                      var endPos = txtarea.selectionEnd;
                      txtarea.value = txtarea.value.substring(0, startPos)
                          + name
                          + txtarea.value.substring(endPos, txtarea.value.length);
                  } else {
                      txtarea.value += name;
                  }

                  jQuery(txtarea).change(); //update angular

                }
              }
            });
            var icon = '<img class="emojione open" onclick="jQuery(this).parent().find(\'.emojionearea-button\').click();" src="https://cdn.jsdelivr.net/emojione/assets/png/1f600.png">'
            jQuery($element).parent().find(".emojionearea-editor").remove();
            jQuery($element).parent().find(".emojionearea-button").css({'display':'none'});
            jQuery($element).parent().find(".emojionearea-search").find("input")[0].placeholder = "Search";
            jQuery($element).parent().find(".emojionearea-standalone").prepend(icon);
          }
      }
  })
  .directive("emojiAutocomplete", function($msgParsing, $sce, $compile){
      return{
          restrict: 'A',
          link: function($scope, $element, $attrs){
                $($element).textcomplete([ {
                    match: /\B:([\-+\w]{2}[\-+\w]*)$/,
                    search: function (term, callback) {


                        var results = [];
                        var results2 = [];
                        var results3 = [];
                        $.each(emojiStrategy,function(shortname,data) {
                            if(shortname.indexOf(term) > -1) { results.push(shortname); }
                            else {
                                if((data.aliases !== null) && (data.aliases.indexOf(term) > -1)) {
                                    results2.push(shortname);
                                }
                                else if((data.keywords !== null) && (data.keywords.indexOf(term) > -1)) {
                                    results3.push(shortname);
                                }
                            }
                        });

                        if(term.length >= 3) {
                            results.sort(function(a,b) { return (a.length > b.length); });
                            results2.sort(function(a,b) { return (a.length > b.length); });
                            results3.sort();
                        }
                        var newResults = results.concat(results2).concat(results3);

                        callback(newResults);
                    },
                    template: function (shortname) {
                        return '<img class="emojione" src="https://cdn.jsdelivr.net/emojione/assets/png/'+emojiStrategy[shortname].unicode+'.png"/> :'+shortname+':';
                    },
                    replace: function (shortname) {
                        return ':'+shortname+': ';
                    },
                    index: 1,
                    maxCount: 10,
                    placement: 'top'
                }
                ],{
                  placement: 'top'
                }).on({
                    'textComplete:select': function (e,f,g) {
                        jQuery($element).trigger("change");
                    }
                  }
                );
              }
      }
  })
  ;
};
