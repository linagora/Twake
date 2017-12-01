function serviceMsgParsing(app) {

	return app.service('$msgParsing', function ($rootScope, $api, $user, $ws, $window) {

		var that = this;
		$rootScope.cps = this;

		var entityMap = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;'
		};

		var invEntityMap = {
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&nbsp;': ' '
		};

		// file = {isDirectory: bool, name: "name"}
		this.isImage = function (file) {

			if (!file.isDirectory) {

				var name = file.name;
				var nameParts = name.split(".");

				if (nameParts.length === 2) {
					return ["png", "jpg", "jpeg", "gif", "tiff"].indexOf(nameParts[1].toLowerCase()) > -1;
				}

				return false;
			}

			return false;
		};

		this.parseUploadedFile = function (fileUrl, fileIsImage, fileName, fileIsBig) {

			if (!fileIsImage || fileIsBig) {
				return "<div class='drive_element message_element'><div class='icon drive_element_icon file'></div>" + fileName + "</div>";
			}
			else {
				return "<img ng-load='chat.isAtBottomEdge && chat.scrollToBottom()' src='" + fileUrl + "'/>";
			}

			return fileUrl;
		};

		this.runFunctions = function (arr, text) {
			for (i = 0; i < arr.length; i++) {
				var funct = arr[i];

				var matched = funct.function;
				var notfound = funct.function;
				for (j = 0; j < funct.params.length; j++) {
					matched += '{' + funct.params[j] + '}';
					notfound += '&#123;' + funct.params[j] + '&#125;';
				}

				switch (funct.function) {

					//Coloring the text
					case 'color':
						if (funct.params.length < 2) {
							break;
						}

						var color = funct.params[0];
						var texte = funct.params[1];
						text = text.replace(matched, "<span style='color:" + color + "'>" + texte + "</span>");

						break;

					//Cite another message
					case 'quote':

						var nbParam = 0;
						while (funct.params[nbParam]) {
							nbParam++;
						}

						if (nbParam > 3) {
							break;
						}

						var content = funct.params[nbParam - 1];
						var pseudo = "";
						var date = "";

						if (nbParam >= 2) {
							pseudo = funct.params[0]
						}
						if (nbParam == 3) {
							date = funct.params[1]
						}

						var citation = "";
						if (nbParam >= 2) {
							citation += "<div class='username'>" + pseudo + "";
							citation += "<div class='date'>" + date + "</div></div>";
						}
						citation += content;

						text = text.replace(matched, "<span class='cite'>" + citation + "</span>");

						break;

					default:
						text = text.replace(matched, notfound);
						break;

				}
			}

			return text;
		}


		this.escapeHtml = function (string) {
			string = String(string).replace(/[&<>]/g, function (s) {
				return entityMap[s];
			});
			string = String(string).replace('{{', '<span>&#123;</span>&#123;');
			string = String(string).replace('}}', '&#125;<span>&#125;</span>');
			return String(string).replace(/  /g, ' &nbsp;');
		}

		this.preKeepLinebreak = function (string) {
			return String(string).replace(/(\n|\r)/g, "<sbr>");
		}

		this.invEscapeHtml = function (string) {
			return String(string).replace(/&[a-z0-9A-Z#]+;/g, function (s) {
				if (!invEntityMap[s]) {
					return s;
				}
				return invEntityMap[s];
			});
		}

		this.keepLinebreak = function (string) {
			return String(string).replace(/<sbr>/g, "\n");
		}

		var specialChar = {
			'\\*': '&#42;',
			'\\-': '&#45;',
			'\\_': '&#95;',
			'\\~': '&#126;',
			'\\&lt;': '&#60;',
			'\\&gt;': '&#62;',
			'\\<': '&#60;',
			'\\>': '&#62;',
			'\\{': '&#123;',
			'\\}': '&#125;',
			'\\@': '&#64;',
		};

		this.doEscapeChar = function (text) {
			return String(text).replace(/\\[*_\-~\<\>{}@]/g, function (s) {
				if (!specialChar[s]) {
					return s;
				}
				return specialChar[s];
			}).replace(/\\&.t;/g, function (s) {
				if (!specialChar[s]) {
					return s;
				}
				return specialChar[s];
			});
		}

		this.parse = function (text) {

			text = that.escapeHtml(text);
			text = that.doEscapeChar(text);

			/*Links*/
			text = $window.anchorme(text, {
					truncate: [26, 15],
					attributes: [
						/*function(urlObj){
						 if(urlObj.protocol !== "mailto:") return {name:"target",value:"blank"};
						 },*/
						function (urlObj) {
							if (urlObj.protocol !== "mailto:") {
								if (urlObj.raw.substr(0, 7) === "http://" || urlObj.raw.substr(0, 8) === "https://") {
									return {name: "ng-click", value: "href.goInNewTabExternal('" + urlObj.raw + "')"};
								}
								else {
									return {
										name: "ng-click",
										value: "href.goInNewTabExternal('http://" + urlObj.raw + "')"
									};
								}
							}
						},
						{
							name: "class",
							value: "mlink"
						}
					],
					exclude: function (urlObj) {
						var url = urlObj.raw.toLowerCase();
						if (url.endsWith(".png")) return true;
						if (url.endsWith(".svg")) return true;
						if (url.endsWith(".jpg")) return true;
						if (url.endsWith(".jpeg")) return true;
						if (url.endsWith(".gif")) return true;
						if (url.endsWith(".tiff")) return true;
					}
				}
			);

			text = text.replace("<a href=", "<a ");

			/*******
			 AST LL(1)
			 ********/
			var tokensEquals = {
				"&lt;&lt;&lt;": "&gt;&gt;&gt;",
				"&gt;&gt;&gt;": "&lt;&lt;&lt;",
				"&gt;&gt;": "&lt;&lt;",
				"&lt;&lt;": "&gt;&gt;"
			};
			var tokensReplace = {
				"**": function (text) { /* BOLD */
					return "<b>" + text + "</b>";
				},
				"~~": function (text) { /* Italic */
					return "<em>" + text + "</em>";
				},
				"__": function (text) {
					return "<u>" + text + "</u>";
				},
				"--": function (text) {
					return "<s>" + text + "</s>";
				},
				"¨¨": function (text) {
					return "<span class='upperline'>" + text + "</span>";
				},
				"&gt;&gt;&gt;": function () {
				},
				"&lt;&lt;&lt;": function (text) { /* Code block */
					var mode = "";
					var modeAsked = text.match(new RegExp('^(\\w+)( |\n|\r)'));
					if (modeAsked != null) {
						mode = ",mode: '" + modeAsked[1] + "'";
						text = text.substr(modeAsked[1].length + 1);
					}
					var size = "";
					var nbline = text.split(/\r\n|\r|\n/).length;
					if (nbline > 3) {
						size = "small";
					}
					if (nbline > 14) {
						size = "medium";
					}
					if (nbline > 24) {
						size = "large";
					}
					var sizepx = (nbline * 16) + "px";
					text = that.preKeepLinebreak(text);
					text = text.replace(new RegExp("&nbsp;", "g"), " ");
					return "<div class=\"" + size + "\" style='height:" + sizepx + "' ui-ace=\"{useWrapMode : true,theme:'terminal'" + mode + "}\" readonly>" + (text) + "</div>"
				},
				"&gt;&gt;": function () {
				},
				"&lt;&lt;": function (text) { /* Monospace */
					return "<span class='monospace'>" + text + "</span>";
				},
			};
			var tokens = Object.keys(tokensReplace);

			var getNextToken = function (txt, pos) {
				for (i = 0; i < tokens.length; i++) {
					if (txt.substr(pos, tokens[i].length) == tokens[i]) {
						return tokens[i];
					}
				}
				return false;
			}

			var cursor = 0;
			var ast = {};
			ast.content = [];
			ast.parent = ast;
			var currentPosition = ast;
			var inText = false;
			for (cursor = 0; cursor < text.length; cursor++) {
				nextToken = getNextToken(text, cursor);
				if (nextToken) {
					if (inText) {
						currentPosition = currentPosition.parent; //Sortir du mode texte
					}

					token = nextToken;

					if (currentPosition.type == token || (tokensEquals[token] && tokensEquals[token] == currentPosition.type)) {//Fermer la balise
						currentPosition = currentPosition.parent;
					} else {
						currentPosition.content.push({
							"content": [],
							"type": token,
							"parent": currentPosition
						});
						currentPosition = currentPosition.content[currentPosition.content.length - 1];
					}
					inText = false;

					cursor += nextToken.length - 1;

				} else { //Simple text
					if (!inText) {
						inText = true;
						currentPosition.content.push({
							"text": "",
							"parent": currentPosition
						});
						currentPosition = currentPosition.content[currentPosition.content.length - 1];
					}
					currentPosition.text += text[cursor];
				}
			}

			/* Generate html from AST */
			var constructAST = function (ast) {
				var text = "";
				var i = 0;

				if (ast.content) {
					for (i = 0; i < ast.content.length; i++) {
						text += constructAST(ast.content[i]);
					}
				} else if (ast.text) {
					text += ast.text;
				}

				if (tokensReplace[ast.type] != undefined) {
					text = tokensReplace[ast.type](text);
				}

				return text;
			}
			text = constructAST(ast);

			/* Img */
			var regImg = new RegExp('([^ \r\n\\.]+.[^ \r\n\\/]+\\/(?:(?!\\.png)|(?!\\.jpeg)|(?!\\.jpg)|(?!\\.tiff)|(?!\\.gif)|(?!\\.svg)[^ \r\n])+(?:\\.png|\\.tiff|\\.jpeg|\\.jpg|\\.svg|\\.gif))', 'g')
			var text = text.replace(regImg, "<a ng-click='href.goInNewTabExternal(\"$1\")' class='image'><img ng-load='chat.isAtBottomEdge && chat.scrollToBottom()' src='$1'/></a>");

			/*Hexa color*/
			var regHexa = new RegExp('((?:^| |\n|\t))#([0-9abcdef]{3}([0-9abcdef]{3})?)([^a-z0-9]|$|^)', 'gi');
			var text = text.replace(regHexa, "$1<span class='msg-color' style='background: #$2'><span class='in' style='background: #$2'></span></span>#$2 ");

			/*Pseudo user*/
			var regPseudo = new RegExp('(?:^| )@([^ \n\r]*)', 'g');
			//var text = text.replace(regPseudo, "<a ng-click='href.goInNewTab(\"/user/$1\")'>@$1</a>");
			var text = text.replace(regPseudo, "<span class='popupMessageProfil' data-name='$1' ng-controller='popupMessageProfilCtrl as ctrl' ng-init='ctrl.name=\"$1\"' ><a ng-click='ctrl.clickOn()' >@$1</a><span style='position:relative;' ><div  ng-include='ctrl.include' data-name=\"$1\"'></div></span></span>");

			/***********
			 Detection de fonctions dans le texte
			 ************/
			var arr = [1];
			countrecur = 0;
			while (arr.length > 0 && countrecur < 10) {
				countrecur += 1;
				var regfonctions = new RegExp('((?:\\w)+)((?:{[^{}]*})+)[^{]', 'g');
				arr = [];
				(text + " ").replace(regfonctions, function (res) {
					arr.push(res.substr(0, res.length - 1));
					return res;
				});

				/*
				 forme des fonction après parsing :
				 array[
				 {
				 "function" : nom de la fonction
				 "params" : [
				 array de paramètres ...
				 ]
				 }
				 ]
				 */

				for (i = 0; i < arr.length; i++) {
					var splited = arr[i].split('{');
					var name = splited[0];
					var params = [];
					for (j = 1; j < splited.length; j++) {
						params.push(splited[j].substring(0, splited[j].length - 1));
					}
					arr[i] = {"function": name, "params": params};
				}

				if (arr.length > 0) {
					text = this.runFunctions(arr, text);
				}

			}
			if (countrecur == 10) {
				text = "<span class='quotegg'>To loop is human, to recurse is divine</span>"; //Easter egg
			}

			//Activate :) -> :smile:
			$window.emojione.ascii = true;
			text = $window.emojione.toImage(text);

			/*Add linebreak*/
			text = text.replace(/(\n|\r)/g, "<br>");
			text = that.keepLinebreak(text);

			return text;
		}


		/* Parse message on receive (once) */
		this.parseOnReceive = function (text) {
			if (!(text.substr(0, 1) == "\\" && text.match(new RegExp('^\\\\[a-z]')) != null )) {
				return text;
			}

			text = text.substr(1);
			var command = text.split(" ")[0];

			text = text.substr(command.length + 1);

			params = text.replace(/\s+/g, ' ').split(" ");

			/*console.log("COMMAND = "+command);
			 console.log(params);*/

			switch (command) {
				case "signal":
					jQuery(".message-container").addClass("signal");
					setTimeout(function () {
						jQuery(".message-container").removeClass("signal");
					}, 4000);
					text = "";
					break;

				case "say":
					var lang = undefined;
					if (params[0].match(/\[.{2,5}\]/)) {
						lang = params.shift();
						lang = lang.substr(1, lang.length - 2);

					}
					new twake_TTS(params.join(" "), lang);

				/* Easter eggs */
				case "rvideo":
					jQuery("video").toggleClass("videoanimation_rotate");
					text = "";
					break;
				case "breakall":
					jQuery("div").addClass("vortex_rotate");
					setTimeout(function () {
						jQuery("div").removeClass("vortex_rotate");
					}, 10000);
					text = "";
					break;

				default:
					text = "";
					break;
			}

			return text;

		};


	})
		.directive('msgParsing', function ($msgParsing, $sce, $compile) {
			return {
				restrict: 'A',
				link: function ($scope, $element, $attrs) {
					$scope.$watch($attrs.msgParsing, function (newValue, oldValue) {
						var template = $msgParsing.parse(newValue);
						template = "<span>" + template + "</span>";
						var linkFn = $compile(template);
						var content = linkFn($scope);
						$element.empty();
						$element.append(content);
					});
				}
			}
		})

		;
}
