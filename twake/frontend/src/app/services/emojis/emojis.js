import emojis_json from 'emojione/emoji.json';

import Globals from 'services/Globals.js';

class Emojis {
  constructor() {
    this.emojisList = [];
    this.searcheableEmojis = {}; //Keyword to emojis list object
    this.emojisByCode = {};
    this.emojisByAscii = {};
    this.emojisByCateg = {};
    this.emojisReduced = {};
    this.emojisByCategByBloc = {};
    this.emojisBlocs = [];
    Globals.window.emojiservice = this;
    this.init();
  }

  getEmoticon(shortname) {
    if (shortname[0] == ':') {
      return { shortname: shortname, id: shortname };
    }
    return this.emojisByAscii[shortname];
  }

  createEmojisFromStrategy() {
    this.emojisList = []; //List of emojis
    this.searcheableEmojis = {}; //Keyword to emojis list object
    this.emojisByCode = {}; //Emoji by shortname
    this.emojisByAscii = {}; //Emoji by ascii
    this.emojisByCateg = {}; //Emojis by category
    this.emojisReduced = {}; //Emojis alternative (tones) are grouped with original emoji

    Object.keys(emojis_json).forEach(emoji_id => {
      var emoji = emojis_json[emoji_id];

      //Keep only displayable emojis
      if (emoji.display == 1) {
        emoji.id = emoji.shortname;
        this.emojisByCode[emoji.id];
        this.emojisByAscii[emoji.ascii];

        //Add emojis by category
        if (!this.emojisByCateg[emoji.category]) this.emojisByCateg[emoji.category] = [];
        this.emojisByCateg[emoji.category].push(emoji);

        if (!emoji.diversity) {
          if (!this.emojisReduced[emoji_id]) this.emojisReduced[emoji_id] = {};
          this.emojisReduced[emoji_id]['default'] = emoji;
          emoji.diversities.forEach(alternate_id => {
            var alternate_emoji = emojis_json[alternate_id];
            this.emojisReduced[emoji_id][alternate_emoji.diversity] = alternate_emoji;
          });
        }
      }
    });

    Object.keys(this.emojisReduced).forEach(emoji_id => {
      //Get original emoji
      var emoji = this.emojisReduced[emoji_id]['default'];

      this.emojisList.push(emoji);

      //Add emojis to keyword object
      var keywords =
        emoji.keywords.join(' ') +
        ' ' +
        emoji.name +
        ' ' +
        emoji.shortname.substr(1, emoji.shortname.length - 2);
      emoji.shortname_alternates.forEach(shortname => {
        keywords += ' ' + shortname.substr(1, shortname.length - 2);
      });
      keywords = keywords.split(' ').map(keyword => keyword.trim().toLocaleLowerCase());
      keywords.forEach(keyword => {
        //Add default emoji + all diversities
        if (!this.searcheableEmojis[keyword]) this.searcheableEmojis[keyword] = [];
        this.searcheableEmojis[keyword] = this.searcheableEmojis[keyword].concat(
<<<<<<< HEAD
          Object.keys(this.emojisReduced[emoji_id]).map(key => this.emojisReduced[emoji_id][key])
=======
          Object.keys(this.emojisReduced[emoji_id]).map(key => this.emojisReduced[emoji_id][key]),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        );
      });
    });

    return;
  }

  emojiListToBloc(emojisList) {
    var emojisBlocs = [];
    var emojisByCategByBloc = {};
    var bloc_by_category = {};
    emojisList
      .sort((a, b) => a.order - b.order)
      .forEach(emoji => {
        var category = emoji.category;
        if (!bloc_by_category[category]) {
          bloc_by_category[category] = 0;
        }
        var bloc = bloc_by_category[category];

        if (!emojisByCategByBloc[category]) {
          emojisByCategByBloc[category] = [];
        }
        if (!emojisByCategByBloc[category][bloc]) {
          emojisByCategByBloc[category].push([]);
        }
        emojisByCategByBloc[category][bloc].push(emoji);
        if (emojisByCategByBloc[category][bloc].length == 6) {
          bloc_by_category[category]++;
        }
      });
    Object.keys(emojisByCategByBloc).forEach(category => {
      emojisBlocs.push({ type: 'category', value: category });
      emojisBlocs = emojisBlocs.concat(emojisByCategByBloc[category]);
    });

    return [emojisBlocs, emojisByCategByBloc];
  }

  init() {
    this.createEmojisFromStrategy();
    var tmp = this.emojiListToBloc(this.emojisList);
    this.emojisBlocs = tmp[0];
    this.emojisByCategByBloc = tmp[1];
  }

  search(start_with, callback, no_blocs) {
    var candidates = [];

    if (this.searching) {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.search(start_with, callback);
      }, 500);
      return;
    }

    this.searching = true;

    if (start_with) {
      start_with = start_with.toLocaleLowerCase().replace(':', '');

      Object.keys(this.emojisByCode).forEach(code => {
        if (candidates.length > 20) {
          return false;
        }
        if (code.startsWith(':' + start_with)) {
          candidates.push(this.emojisByCode[code]);
        }
      });
      Object.keys(this.searcheableEmojis).forEach(keyword => {
        if (candidates.length > 60) {
          return false;
        }
        if (keyword.startsWith(start_with)) {
          this.searcheableEmojis[keyword].forEach(emot => {
            if (candidates.indexOf(emot) == -1) {
              candidates = candidates.concat(emot);
            }
          });
        }
      });

      //Diversity versions after classic yellow versions
      candidates.sort((a, b) => {
        if (a.diversity && !b.diversity) {
          return 1;
        }
        if (!a.diversity && b.diversity) {
          return -1;
        }
        return a.order - b.order;
      });

      if (!no_blocs) {
        candidates = this.emojiListToBloc(candidates)[0];
        candidates = candidates.slice(0, 60);
      } else {
        candidates = candidates.slice(0, 10);
      }
    } else {
      if (!no_blocs) {
        candidates = this.emojisBlocs;
      } else {
        candidates = this.emojisByCateg['people'];
        candidates.sort((a, b) => {
          if (a.diversity && !b.diversity) {
            return 1;
          }
          if (!a.diversity && b.diversity) {
            return -1;
          }
          return a.order - b.order;
        });
      }
    }

    this.searching = false;
    if (callback) {
      callback(candidates);
    } else {
      return candidates;
    }
  }

  getByAscii(ascii) {
    return this.emojisByAscii[ascii];
  }

  getByCode(code) {
    return this.emojisByCode[code];
  }
}

const emojis = new Emojis();
export default emojis;
