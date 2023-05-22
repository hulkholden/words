customElements.define('word-input',
    class WordInput extends HTMLElement {
        constructor() {
            super();
            this.pattern = '_';
        }

        connectedCallback() {
            const shadow = this.attachShadow({ mode: 'closed' });
            const wordTemplate = document.getElementById('word-input');
            const wordNode = wordTemplate.content.cloneNode(true)
            const lettersElem = wordNode.querySelector('.letters');

            const letterTemplate = document.getElementById('letter-input');

            const letterElems = new Array();
            for (let chr of this.pattern) {
                const letterNode = letterTemplate.content.cloneNode(true);
                const letterElem = letterNode.querySelector('.letter');
                if (chr != '_') {
                    letterElem.value = chr;
                }
                lettersElem.appendChild(letterNode);
                letterElems.push(letterElem);
            }

            for (let [i, elem] of letterElems.entries()) {
                elem.addEventListener('keydown', (event) => {
                    if (event.key.length == 1 && !event.metaKey && !event.ctrlKey) {
                        if (this.isValidLetter(event.key)) {
                            elem.value = event.key.toLowerCase();
                        }
                        event.preventDefault();
                        return false;
                    }
                });
                elem.addEventListener('keyup', (event) => {
                    let focusPrev = false;
                    let focusNext = false;

                    if (this.isValidLetter(event.key)) {
                        elem.value = event.key.toLowerCase();
                        focusNext = true;
                    } else if (event.key == ' ') {
                        elem.value = '';
                        focusNext = true;
                    } else if (event.key == 'Backspace') {
                        focusPrev = true;
                    } else {
                        // TODO: Should we always clear the value for unknown keys?
                        // elem.value = '';
                    }

                    if (focusPrev) {
                        if (i > 0) {
                            letterElems[i - 1].focus();
                        }
                    } else if (focusNext) {
                        if ((i + 1) < letterElems.length) {
                            letterElems[i + 1].focus();
                            letterElems[i + 1].setSelectionRange(0, 0);
                        }
                    }
                });
            }

            shadow.append(wordNode);
        }

        isValidLetter(key) {
            return key.length == 1 &&
                ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z'))
        }

        static get observedAttributes() {
            return ['pattern'];
        }

        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) {
                return;
            }
            this[property] = newValue;
        }
    }
);