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
            this.letterElems = letterElems;

            for (let [i, elem] of letterElems.entries()) {
                elem.addEventListener('keydown', (event) => {
                    return this.onKeyDown(elem, i, event);
                });
                elem.addEventListener('keyup', (event) => {
                    return this.onKeyUp(elem, i, event);
                });
            }

            shadow.append(wordNode);
        }

        onKeyDown(elem, letterIdx, event) {
            if (event.key.length == 1 && !event.metaKey && !event.ctrlKey) {
                if (this.isValidLetter(event.key)) {
                    elem.value = event.key.toLowerCase();
                }
                event.preventDefault();
                return false;
            }
        }

        onKeyUp(elem, letterIdx, event) {
            if (this.isValidLetter(event.key)) {
                elem.value = event.key.toLowerCase();
                this.focusNext(letterIdx);
            } else if (event.key == ' ') {
                elem.value = '';
                this.focusNext(letterIdx);
            } else if (event.key == 'Backspace') {
                elem.value = '';
                this.focusPrev(letterIdx);
            } else if (event.key == 'ArrowLeft') {
                this.focusPrev(letterIdx);
            } else if (event.key == 'ArrowRight') {
                this.focusNext(letterIdx);
            }
        }

        focusPrev(letterIdx) { this.focusIdx(letterIdx - 1); }
        focusNext(letterIdx) { this.focusIdx(letterIdx + 1); }

        focusIdx(newIdx) {
            if (newIdx >= 0 && newIdx < this.letterElems.length) {
                this.letterElems[newIdx].focus();
                this.letterElems[newIdx].setSelectionRange(0, 1);
            }
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