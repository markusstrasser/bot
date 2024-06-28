import Prism from 'prismjs';
import 'prismjs/themes/prism.css';

export function highlight(node: HTMLElement, { code, language }: { code: string; language: string }) {
  const highlight = () => {
    node.innerHTML = Prism.highlight(code, Prism.languages[language], language);
  };

  highlight();

  return {
    update({ code: newCode, language: newLanguage }) {
      code = newCode;
      language = newLanguage;
      highlight();
    }
  };
}