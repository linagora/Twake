import UserService from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';
import PseudoMarkdownDictionary from 'components/Twacode/PseudoMarkdownDictionary.js';
import anchorme from 'anchorme';
import emojis_original_service from 'emojione';
import Globals from 'services/Globals.js';
import React, { Component } from 'react';

class PseudoMarkdownCompiler {
  constructor() {
    this.saved_messages = {};

    this.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    this.bullets = {
      '• ': () => '• ',
      '- ': () => '- ',
      '([0-9]+)\\. ': match => {
        var i = parseInt(match[1]);
        return i + 1 + '. ';
      },
      '([a-z])\\. ': match => {
        var i = this.alphabet.toLowerCase().indexOf(match[1]);
        return this.alphabet.toLowerCase()[i + 1] + '. ';
      },
      '([A-Z])\\. ': match => {
        var i = this.alphabet.indexOf(match[1]);
        return this.alphabet[i + 1] + '. ';
      },
    };

    this.pseudo_markdown = {
      text_block_parent: {
        name: 'text',
        object: PseudoMarkdownDictionary.render_block.text_block_parent.object,
        simple_object: child => child,
      },
      text: {
        name: 'text',
        object: PseudoMarkdownDictionary.render_block.text.object,
        simple_object: child => child,
      },
      '\n': {
        name: 'br',
        end: '^',
        allowed_chars: '.',
        object: PseudoMarkdownDictionary.render_block.br.object,
        simple_object: child => child,
      },
      '[': {
        name: 'markdown_link',
        allowed_char_before: '', //"(^| )",
        allowed_chars: '.+?\\]\\([^ ]+',
        disable_recursion: true,
        end: '\\)',
        object: PseudoMarkdownDictionary.render_block.markdown_link.object,
      },
      ':': {
        name: 'emoji',
        allowed_char_before: '', //"(^| )",
        allowed_chars: '[a-z_]+',
        disable_recursion: true,
        end: ':',
        object: PseudoMarkdownDictionary.render_block.emoji.object,
      },
      '@': {
        name: 'user',
        allowed_char_before: '(^|\\B)',
        allowed_chars: '[a-z_.-A-Z0-9:]+',
        disable_recursion: true,
        after_end: ' |$|[^a-zA-Z0-9]',
        object: PseudoMarkdownDictionary.render_block.user.object,
        simple_object: (child, obj) => '@' + (obj.content || '').split(':')[0] + ' ',
        text_transform: PseudoMarkdownDictionary.render_block.user.text_transform,
      },
      '#': {
        name: 'channel',
        allowed_char_before: '(^|\\B)',
        allowed_chars: '[a-z_.-A-Z0-9\u00C0-\u017F:]+',
        disable_recursion: true,
        after_end: ' |$[^a-zA-Z0-9]',
        object: PseudoMarkdownDictionary.render_block.channel.object,
        simple_object: (child, obj) => '#' + (obj.content || '').split(':')[0] + ' ',
        text_transform: PseudoMarkdownDictionary.render_block.channel.text_transform,
      },
      '```': {
        name: 'mcode',
        end: '```',
        after_end: '$|\n',
        view: true,
        allowed_chars: '(.|\n)',
        disable_recursion: true,
        object: PseudoMarkdownDictionary.render_block.mcode.object,
        text_transform: PseudoMarkdownDictionary.render_block.mcode.text_transform,
        simple_object: (child, obj) => {
          const str = (obj.content || '').trim();
          return str.length > 40 ? str.substr(0, 37) + '...' : str;
        },
      },
      '`': {
        name: 'icode',
        end: '`',
        allowed_char_before: '(^|\\B)',
        allowed_chars: '.',
        disable_recursion: true,
        object: PseudoMarkdownDictionary.render_block.icode.object,
        text_transform: PseudoMarkdownDictionary.render_block.icode.text_transform,
      },
      __: {
        name: 'underline',
        end: '__',
        allowed_char_before: '(^|\\B)',
        allowed_chars: '.',
        object: PseudoMarkdownDictionary.render_block.underline.object,
        text_transform: PseudoMarkdownDictionary.render_block.underline.text_transform,
      },
      '~~': {
        name: 'strikethrough',
        end: '~~',
        allowed_char_before: '(^|\\B)',
        allowed_chars: '.',
        object: PseudoMarkdownDictionary.render_block.strikethrough.object,
        text_transform: PseudoMarkdownDictionary.render_block.strikethrough.text_transform,
      },
      '**': {
        name: 'bold',
        end: '\\*\\*',
        allowed_char_before: '(^|\\B|.)',
        allowed_chars: '.',
        object: PseudoMarkdownDictionary.render_block.bold.object,
        text_transform: PseudoMarkdownDictionary.render_block.bold.text_transform,
      },
      '*': {
        name: 'italic',
        end: '\\*',
        allowed_char_before: '(^|\\B)',
        allowed_chars: '.',
        object: PseudoMarkdownDictionary.render_block.italic.object,
        text_transform: PseudoMarkdownDictionary.render_block.italic.text_transform,
      },
      _: {
        name: 'italic',
        end: '_',
        allowed_char_before: '(^|\\B)',
        allowed_chars: '.',
        object: PseudoMarkdownDictionary.render_block.italic.object,
        text_transform: PseudoMarkdownDictionary.render_block.italic.text_transform,
      },
      '>>>': {
        name: 'mquote',
        allowed_char_before: '^',
        view: true,
        end: false,
        allowed_chars: '(.|\n)',
        object: PseudoMarkdownDictionary.render_block.mquote.object,
        simple_object: child => '',
        text_transform: PseudoMarkdownDictionary.render_block.mquote.text_transform,
      },
      '>': {
        name: 'quote',
        view: true,
        allowed_char_before: '^',
        after_end: '$|\n',
        object: PseudoMarkdownDictionary.render_block.quote.object,
        simple_object: child => '',
        text_transform: PseudoMarkdownDictionary.render_block.quote.text_transform,
      },
    };

    this.pseudo_markdown_types = {
      nop: {
        object: PseudoMarkdownDictionary.render_block.nop.object,
        simple_object: child => child,
        text_transform: PseudoMarkdownDictionary.render_block.nop.text_transform,
      },
      url: {
        object: PseudoMarkdownDictionary.render_block.url.object,
        text_transform: PseudoMarkdownDictionary.render_block.url.text_transform,
      },
      email: {
        object: PseudoMarkdownDictionary.render_block.email.object,
        text_transform: PseudoMarkdownDictionary.render_block.email.text_transform,
      },
      system: {
        apps_only: true,
        object: PseudoMarkdownDictionary.render_block.system.object,
        simple_object: child => child,
        text_transform: PseudoMarkdownDictionary.render_block.system.text_transform,
      },
      file: {
        view: true,
        object: PseudoMarkdownDictionary.render_block.file.object,
        simple_object: child => '',
        text_transform: PseudoMarkdownDictionary.render_block.file.text_transform,
      },
      image: {
        view: true,
        apps_only: true,
        object: PseudoMarkdownDictionary.render_block.image.object,
        simple_object: child => '',
        text_transform: PseudoMarkdownDictionary.render_block.image.text_transform,
      },
      icon: {
        apps_only: true,
        object: PseudoMarkdownDictionary.render_block.icon.object,
        text_transform: PseudoMarkdownDictionary.render_block.icon.text_transform,
      },
      progress_bar: {
        view: true,
        apps_only: true,
        object: PseudoMarkdownDictionary.render_block.progress_bar.object,
        simple_object: (child, object) => (object.progress || 0) + '%',
        text_transform: PseudoMarkdownDictionary.render_block.progress_bar.text_transform,
      },
      attachment: {
        view: true,
        apps_only: true,
        object: PseudoMarkdownDictionary.render_block.attachment.object,
        simple_object: (child, object) => child,
        text_transform: PseudoMarkdownDictionary.render_block.attachment.text_transform,
      },
      button: {
        view: true,
        apps_only: true,
        object: PseudoMarkdownDictionary.render_block.button.object,
        simple_object: child => '',
        text_transform: PseudoMarkdownDictionary.render_block.button.text_transform,
      },
      copiable: {
        view: true,
        apps_only: true,
        object: PseudoMarkdownDictionary.render_block.copiable.object,
        simple_object: child => '',
        text_transform: PseudoMarkdownDictionary.render_block.copiable.text_transform,
      },
      input: {
        view: true,
        apps_only: true,
        object: PseudoMarkdownDictionary.render_block.input.object,
        simple_object: child => '',
        text_transform: PseudoMarkdownDictionary.render_block.input.text_transform,
      },
      select: {
        view: true,
        apps_only: true,
        object: PseudoMarkdownDictionary.render_block.select.object,
        simple_object: child => '',
        text_transform: PseudoMarkdownDictionary.render_block.select.text_transform,
      },
    };

    Object.keys(this.pseudo_markdown).forEach(id => {
      var item = this.pseudo_markdown[id];
      this.pseudo_markdown_types[item.name] = item;
    });

    Globals.window.pmc = this;
  }

  compileStringToLinkObject(string) {
    //Monkey hack for new markdown links, not the best place for this code
    var link_found = anchorme(string.replace(/\[.*?\]\(.*?\)/gm, ''), {
      list: true,
      ips: false,
      files: false,
    });

    var result = [];

    if (link_found.length == 0) {
      return [string];
    } else {
      var first_link = link_found[0];
      var pos = string.indexOf(first_link.raw);
      if (pos > 0) {
        result = result.concat(this.compileStringToLinkObject(string.slice(0, pos)));
      }
      result.push({
        type: first_link.reason,
        content: first_link.raw,
      });
      if (pos + first_link.raw.length < string.length) {
        result = result.concat(
          this.compileStringToLinkObject(string.slice(pos + first_link.raw.length)),
        );
      }
    }

    return result;
  }

  transformChannelsUsers(str) {
    //Users
    str = (str || '').replace(
      /(\B@)([a-z_.-A-Z0-9]*[a-z_A-Z0-9-])(( |$|([^a-zA-Z0-9]|$){2}))/g,
      (full_match, match1, username, match3) => {
        var values = username.split(':');
        if (values.length == 1) {
          if (username == 'me') {
            username = UserService.getCurrentUser().username;
          }
          var user_id = Collections.get('users').findBy({ username: username })[0];
          if (user_id && user_id.id) {
            user_id = user_id.id;
            return match1 + username + ':' + user_id + match3;
          } else {
            return full_match;
          }
        } else {
          return full_match;
        }
      },
    );
    //Channels
    str = str.replace(
      /(\B#)([a-z_.-A-Z0-9\u00C0-\u017F]*[a-z_A-Z0-9-])(( |$|([^a-zA-Z0-9]|$){2}))/g,
      (full_match, match1, channel, match3) => {
        var values = channel.split(':');
        if (values.length == 1) {
          var channel_id = Collections.get('channels')
            .findBy({})
            .filter(
              item =>
                item.name.toLocaleLowerCase().replace(/[^a-z0-9_\-.\u00C0-\u017F]/g, '') == channel,
            )[0];
          if (channel_id && channel_id.id) {
            channel_id = channel_id.id;
            return match1 + channel + ':' + channel_id + match3;
          } else {
            return full_match;
          }
        } else {
          return full_match;
        }
      },
    );
    return str;
  }

  transformBackChannelsUsers(str) {
    //Users
    str = str.replace(/\B(@[^\s]*?):.*?(( |$|[^a-zA-Z0-9-]))/g, '$1$2');
    //Channels
    str = str.replace(/\B(#[^\s]*?):.*?(( |$|[^a-zA-Z0-9-]))/g, '$1$2');
    return str;
  }

  compileToJSON(str, recursive) {
    if (!recursive) {
      var result = [];
      var original_str = str;
      var _str = str.split('```'); //Priority to code
      _str.forEach((str, i) => {
        if (i % 2 == 0) {
          if (str) {
            str = this.transformChannelsUsers(str);

            emojis_original_service.ascii = true;
            str = emojis_original_service.shortnameToUnicode(str);
            str = emojis_original_service.toShort(str);

            var links = this.compileStringToLinkObject(str);
            links.forEach(item => {
              if (typeof item == 'string') {
                result.push(this.compileToJSON(item, true));
              } else {
                result.push(item);
              }
            });
          }
        } else {
          var object = {
            start: '```',
            content: str,
            end: '\n```',
          };
          result.push(object);
          //original_str += "```\n"+str+"\n```";
        }
      });

      const all = {
        original_str: original_str,
        fallback_string: original_str.substr(0, 280) + (original_str.length > 280 ? '...' : ''),
        prepared: result,
      };

      return all;
    }

    var original_str = str;

    var result = [];

    var min_index_of = -1;
    var min_index_of_key = null;

    var ret = [];
    Object.keys(this.pseudo_markdown)
      .sort((a, b) => b.length - a.length)
      .forEach(starting_value => {
        if (starting_value == 'text') {
          return;
        }

        const allowed_char_before = this.pseudo_markdown[starting_value].allowed_char_before;
        let tmp = str;
        let offset = 0;
        let indexes = [];
        let did_match = -1;
        do {
          did_match = tmp.indexOf(starting_value);

          let match_char_before =
            !allowed_char_before ||
            null !== tmp.slice(0, did_match).match(new RegExp(allowed_char_before + '$', 'gmi'));
          match_char_before = match_char_before && tmp[did_match - 1] !== '\\';

          tmp = tmp.slice(did_match + 1);
          if (did_match >= 0 && match_char_before) indexes.push(did_match + offset);
          offset = offset + did_match + 1;
        } while (did_match >= 0);

        if (indexes.length > 0) {
          const mini = Math.min(...indexes);
          if (min_index_of < 0 || mini < min_index_of) {
            min_index_of = mini;
            min_index_of_key = starting_value;
          }
        }
      });

    str = original_str;

    if (min_index_of_key) {
      var str_left = str.substr(0, min_index_of);
      var char = min_index_of_key;
      var str_right = str.substr(min_index_of + char.length);

      //Seach end of element in str_right
      var match = -1;
      var add_to_value = '';
      while (match < 0 || (match && match[1][match[1].length - 1] == '\\')) {
        if (match && match !== -1) {
          //It mean we found an antislashed element
          add_to_value += match[0];
        }
        const countManaged =
          (this.pseudo_markdown[char].allowed_chars || '').slice(-1) === '+' ||
          (this.pseudo_markdown[char].allowed_chars || '').slice(-1) === '}';
        const regex =
          '^(' +
          (this.pseudo_markdown[char].allowed_chars || '.') +
          (countManaged ? '' : '*') +
          (this.pseudo_markdown[char].end ? '?' : '') +
          ')' +
          (this.pseudo_markdown[char].end ? '(' + this.pseudo_markdown[char].end + ')' : '');
        match = str_right.substr(add_to_value.length).match(new RegExp(regex, ''));
      }
      let completion_end_char = '';
      if (match) {
        match[0] = add_to_value + match[0];
        match[1] = add_to_value + match[1];
        completion_end_char = this.pseudo_markdown[char].after_end ? match[3] || '' : '';
      }

      if (!match) {
        str_left = str_left + char;
        result = result.concat(str_left);
      } else {
        if (str_left) {
          result = result.concat(str_left);
        }

        //Generate object
        var object = {
          start: char,
          content: this.pseudo_markdown[char].disable_recursion
            ? match[1]
            : this.compileToJSON(match[1], 1),
          end: match[2],
        };
        result.push(object);

        str_right = completion_end_char + str_right.substr(match[0].length);
      }

      result = result.concat(this.compileToJSON(str_right, 1));

      ret = result;
    } else {
      if (original_str) {
        ret = original_str;
      } else {
        ret = [];
      }
    }

    return ret;
  }

  compileToHTML(json, is_app, event_container, text_transform = undefined) {
    if (!text_transform) {
      text_transform = {};
    }

    if (!json) {
      return this.pseudo_markdown['text'].object('');
    }

    if (json.formatted || json.prepared) json = json.formatted || json.prepared;

    if (typeof json == 'string') {
      json = [json];
    }

    if (json.type || json.start) {
      json = [json];
    }

    var el = null;
    var child_contain_view = false;
    var result = [];
    try {
      json.forEach(item => {
        if (typeof item == 'string') {
          result.push(
            this.pseudo_markdown['text'].object(item, is_app, event_container, text_transform),
          );
        } else if (Array.isArray(item)) {
          el = this.compileToHTML(item, is_app, event_container, text_transform);
          child_contain_view = child_contain_view || el.child_contain_view;
          result.push(el);
        } else {
          var type = this.pseudo_markdown[item.start];
          if (item.type == 'compile' && is_app && typeof item.content == 'string') {
            el = this.compileToHTML(
              this.compileToJSON(item.content),
              is_app,
              event_container,
              text_transform,
            );
            child_contain_view = child_contain_view || el.child_contain_view;
            result.push(el);
          } else {
            if (item.type) {
              type = this.pseudo_markdown_types[item.type];
            }
            if (type) {
              if (!type.apps_only || is_app) {
                //If text transform do it
                var old_text_transform = JSON.parse(JSON.stringify(text_transform));
                text_transform = JSON.parse(JSON.stringify(text_transform));
                if (type.text_transform) {
                  Object.keys(type.text_transform).forEach(key => {
                    text_transform[key] = type.text_transform[key];
                  });
                }

                el = this.compileToHTML(
                  item.content || '',
                  is_app,
                  event_container,
                  text_transform,
                );
                if (type.view) {
                  child_contain_view = true;
                }
                child_contain_view = child_contain_view || el.child_contain_view;

                result.push(
                  type.object(el, item, event_container, text_transform, child_contain_view),
                );

                text_transform = old_text_transform;
              }
            }
          }
        }
      });
    } catch (e) {
      return this.pseudo_markdown['text'].object('An error occured while showing this message.');
    }
    result.child_contain_view = child_contain_view;

    result.forEach(item => {
      if (!item.child_contain_view && child_contain_view) {
        item = this.pseudo_markdown['text_block_parent'].object(item);
      }
    });

    return result;
  }

  compileToSimpleHTML(
    json,
    is_app = false,
    text_transform = undefined,
    result_analysis = undefined,
  ) {
    if (!text_transform) {
      text_transform = {};
    }

    if (!json) {
      return this.pseudo_markdown['text'].object('');
    }

    if (!result_analysis) {
      result_analysis = {
        has_string: false,
      };
    }

    if (json.formatted || json.prepared) json = json.formatted || json.prepared;

    if (typeof json == 'string') {
      json = [json];
    }

    if (json.type || json.start) {
      json = [json];
    }

    try {
      var result = [];
      json.forEach(item => {
        if (typeof item == 'string') {
          result_analysis.has_string = true;
          result.push(
            this.pseudo_markdown['text'].object(item, is_app, {}, text_transform, result_analysis),
          );
        } else if (Array.isArray(item)) {
          result.push(this.compileToSimpleHTML(item, is_app, text_transform, result_analysis));
        } else {
          let type = this.pseudo_markdown[item.start];
          if (item.type) {
            type = this.pseudo_markdown_types[item.type];
          }
          if (type) {
            if (item.type == 'compile' && is_app && typeof item.content == 'string') {
              result.push(
                this.compileToSimpleHTML(
                  this.compileToJSON(item.content),
                  is_app,
                  text_transform,
                  result_analysis,
                ),
              );
            } else {
              if (item.type) {
                type = this.pseudo_markdown_types[item.type];
              }
              if (type) {
                if (!type.apps_only || is_app) {
                  //If text transform do it
                  var old_text_transform = JSON.parse(JSON.stringify(text_transform));
                  text_transform = JSON.parse(JSON.stringify(text_transform));
                  if (type.text_transform) {
                    Object.keys(type.text_transform).forEach(key => {
                      text_transform[key] = type.text_transform[key];
                    });
                  }

                  result.push(
                    (type.simple_object || type.object)(
                      this.compileToSimpleHTML(
                        item.content || '',
                        is_app,
                        text_transform,
                        result_analysis,
                      ),
                      item,
                      {},
                    ),
                  );

                  text_transform = old_text_transform;
                }
              }
            }
          }
        }
      });
    } catch (e) {
      console.log(e);
      return this.pseudo_markdown['text'].object('An error occured while showing this message.');
    }

    if (!result_analysis.has_string) {
      return this.pseudo_markdown['text'].object('No text content to display.');
    }

    return result;
  }

  compileToText(json, no_antislash) {
    if (!json) {
      return '';
    }

    if (typeof json == 'string') {
      json = [json];
    }

    if (json.original_str) {
      return this.transformBackChannelsUsers(json.original_str);
    }

    if (json.type || json.start) {
      json = [json];
    }

    var result = '';
    try {
      json.forEach(item => {
        if (typeof item == 'string') {
          var tmp = item;
          Object.keys(this.pseudo_markdown).forEach(starting_value => {
            var starting_value_reg = starting_value;
            var allowed_chars = this.pseudo_markdown[starting_value].allowed_chars;
            if (starting_value == '*') {
              starting_value_reg = '\\*';
            }
            if (allowed_chars) {
              var reg = new RegExp(starting_value_reg, 'gm');
              tmp = tmp.replace(reg + '(' + allowed_chars + ')', '\\' + starting_value + '$1');
            } else {
              var reg = new RegExp(starting_value_reg, 'gm');
              tmp = tmp.replace(reg, '\\' + starting_value);
            }
          });

          result += tmp;
        } else if (Array.isArray(item)) {
          result += this.compileToText(item);
        } else {
          result += item.start || '';
          var no_antislash =
            (this.pseudo_markdown[item.start] || {}).disable_recursion || item.type; //no recursion was set or is a type (link actually)
          result += this.compileToText(item.content, no_antislash);
          result += item.end || '';
        }
      });
    } catch (e) {
      return '';
    }

    return this.transformBackChannelsUsers(result);
  }

  insertAtCursor(myField, myValue) {
    //IE support
    if (document.selection) {
      myField.focus();
      let sel = document.selection.createRange();
      sel.text = myValue;
    }
    //MOZILLA and others
    else if (myField.selectionStart || myField.selectionStart == '0') {
      var startPos = myField.selectionStart;
      var endPos = myField.selectionEnd;
      myField.value =
        myField.value.substring(0, startPos) +
        myValue +
        myField.value.substring(endPos, myField.value.length);
    } else {
      myField.value += myValue;
    }
  }

  //Call this function after each line break
  autoCompleteBulletList(input, didEnter) {
    var getCursorPos = input => {
      if ('selectionStart' in input && document.activeElement == input) {
        return {
          start: input.selectionStart,
          end: input.selectionEnd,
        };
      } else if (input.createTextRange) {
        var sel = document.selection.createRange();
        if (sel.parentElement() === input) {
          var rng = input.createTextRange();
          rng.moveToBookmark(sel.getBookmark());
          for (
            var len = 0;
            rng.compareEndPoints('EndToStart', rng) > 0;
            rng.moveEnd('character', -1)
          ) {
            len++;
          }
          rng.setEndPoint('StartToStart', input.createTextRange());
          for (
            var pos = { start: 0, end: len };
            rng.compareEndPoints('EndToStart', rng) > 0;
            rng.moveEnd('character', -1)
          ) {
            pos.start++;
            pos.end++;
          }
          return pos;
        }
      }
      return -1;
    };
    var setCaretPosition = (ctrl, pos) => {
      // Modern browsers
      if (ctrl.setSelectionRange) {
        ctrl.focus();
        ctrl.setSelectionRange(pos, pos);

        // IE8 and below
      } else if (ctrl.createTextRange) {
        var range = ctrl.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
      }
    };

    if (didEnter) {
      var cursor_position = (getCursorPos(input) || {}).start;
      if (cursor_position === false || cursor_position < 0) {
        return;
      }
      var value = input.value;

      var str_before = value.substr(0, cursor_position);
      var str_after = value.substr(cursor_position);

      var src_line_before = str_before.split('\n').pop();
      var addon = '';
      var to_remove = 0;
      Object.keys(this.bullets).forEach(regex => {
        var match = src_line_before.match(new RegExp('^' + regex, ''));
        if (match) {
          if (src_line_before.length > match[0].length) {
            addon = this.bullets[regex](match);
          } else {
            to_remove = src_line_before.length;
          }
        }
      });

      if (to_remove > 0) {
        input.value = str_before.substr(0, str_before.length - to_remove) + str_after;
        setCaretPosition(input, cursor_position - to_remove);
      } else {
        input.value = str_before + '\n' + addon + str_after;
        setCaretPosition(input, cursor_position + addon.length + 1);
      }

      return input.value;
    }
  }
}

const service = new PseudoMarkdownCompiler();
export default service;
