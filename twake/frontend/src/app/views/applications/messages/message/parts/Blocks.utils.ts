export const preparse = (str: string) => {
  return (
    str
      //Fix markdown simple line break
      .replace(/\n/g, '  \n')
      //Prevent html security issues
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      //Prepare mentions
      .replace(/([ \t]|^)@([\w]+)/g, '$1<user id="$2"/>')
      .replace(/([ \t]|^)#([\w]+)/g, '$1<channel id="$2"/>')
      //Prepare code
      .replace(/[^\n]\r?\n{1}`{3}/, '\n\n```')
      // prepare quote
      .replace(/^(>{1})([^>]*)\n(.*)/gm, '> $2\n\n$3')
  );
};

export const preunparse = (str: string) => {
  return (
    str
      //Prepare mentions
      .replace(/([ \t]|^)<user id="([\w]+)"\/>/g, '$1@$2')
      .replace(/([ \t]|^)<channel id="([\w]+)"\/>/g, '$1#$2')
      //Prevent html security issues
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  );
};
