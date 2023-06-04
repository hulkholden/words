customElements.define('word-solver',
    class WordSolver extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            const solverTemplate = document.getElementById('word-solver');
            const solverNode = solverTemplate.content.cloneNode(true)

            const wordInput = solverNode.querySelector('word-input');
            wordInput.addEventListener('change', event => {
                this.updateSolution();
            });

            this.update(solverNode);

            const shadow = this.attachShadow({ mode: 'open' });
            shadow.append(solverNode);
        }

        set wordcount(value) { this.setAttribute('wordcount', value) }
        get wordcount() { return this.getAttribute('wordcount') || 0 }

        updateSolution() {
            const wordInput = this.shadowRoot.querySelector('word-input');
            solveAsync(wordInput.pattern, wordInput.valid, wordInput.required)
                .then(value => this.setSolutions(value));
        }

        setSolutions(solutions) {
            const solutionsElem = this.shadowRoot.querySelector('.solutions');
            const items = [];
            for (let word of solutions) {
                const wordElem = document.createElement("span");
                wordElem.classList.add("word");
                wordElem.innerText = word;
                items.push(wordElem);
            }
            solutionsElem.replaceChildren(...items);
        }

        static get observedAttributes() {
            return ['wordcount'];
        }

        attributeChangedCallback(property, oldValue, newValue) {
            if (this.shadowRoot) {
                this.update(this.shadowRoot);
            }
        }

        update(root) {
            const countElem = root.querySelector('.word-count');
            countElem.innerText = `${this.wordcount}`;
        }
    }
);

customElements.define('word-input',
    class WordInput extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            const wordTemplate = document.getElementById('word-input');
            const wordNode = wordTemplate.content.cloneNode(true)

            this.updateAlphabet(wordNode);

            const addButton = wordNode.querySelector('.add-letter');
            addButton.addEventListener('click', event => {
                this.addLetter();
            })

            const shadow = this.attachShadow({ mode: 'open' });
            shadow.append(wordNode);

            this.updateLetters();
        }

        updateAlphabet(root) {
            const elems0 = this.createAlphabetRow("qwertyuiop");
            const elems1 = this.createAlphabetRow("asdfghjkl");
            const elems2 = this.createAlphabetRow("zxcvbnm");

            const elem = root.querySelector('.alphabet');
            elem.replaceChildren(elems0, elems1, elems2);
        }

        createAlphabetRow(letters) {
            const template = document.getElementById('alphabet-letter');

            const divElem = document.createElement('div');
            divElem.classList.add('alphabet-row');

            const elems = [];
            for (let chr of letters) {
                const node = template.content.cloneNode(true);
                const elem = node.querySelector('.alphabet-letter');
                elem.innerText = chr;
                elem.value = chr;
                elems.push(elem);

                // TODO: add some state->int and int->state helpers.
                let state = "off";
                if (this.required.includes(chr)) {
                    state = "required";
                } else if (this.valid.includes(chr)) {
                    state = "allowed";
                }
                elem.setAttribute("state", state);

                elem.addEventListener('click', event => {
                    let value = elem.getAttribute("state") || "off";
                    if (value == "off") {
                        value = "allowed";
                    } else if (value == "allowed") {
                        value = "required";
                    } else if (value == "required") {
                        value = "off";
                    }
                    elem.setAttribute("state", value);
                    this.alphabetSelectionChanged();
                });
            }
            divElem.replaceChildren(...elems);
            return divElem;
        }

        alphabetSelectionChanged() {
            const elems = this.shadowRoot.querySelectorAll('.alphabet-letter');

            let valid = new Map();
            let required = new Map();
            for (let elem of elems) {
                let state = elem.getAttribute("state") || "off";
                if (state == "allowed") {
                    valid.set(elem.value, true);
                } else if (state == "required") {
                    required.set(elem.value, true);
                }
            }
            const validChars = Array.from(valid.keys()).sort().join('');
            const requiredChars = Array.from(required.keys()).sort().join('');
            this.setAttribute("valid", validChars);
            this.setAttribute("required", requiredChars);
        }

        letterElems() {
            const parentElem = this.shadowRoot.querySelector('.letters');
            return Array.from(parentElem.querySelectorAll(".letter"));
        }

        addLetter() {
            this.setAttribute("pattern", this.pattern + '_');
        }

        updateLetters() {
            const parentElem = this.shadowRoot.querySelector('.letters');
            const elems = this.letterElems();
            const letters = Array.from(this.pattern);
            for (let [i, chr] of letters.entries()) {
                if (chr == '_') {
                    chr = '';
                }
                if (i < elems.length) {
                    elems[i].value = chr;
                    continue;
                }
                const elem = this.createLetterElement();
                elem.value = chr;
                elems.push(elem);
                parentElem.appendChild(elem);
            }

            // Remove any elements for letters that have been deleted.
            while (elems.length > letters.length) {
                const elem = elems.pop();
                parentElem.removeChild(elem);
            }
        }

        createLetterElement() {
            const template = document.getElementById('letter-input');
            const node = template.content.cloneNode(true);
            const elem = node.querySelector('.letter');
            elem.addEventListener('keydown', event => {
                if (this.handleKeyDown(elem, event)) {
                    event.preventDefault();
                    return false;
                }
            });
            elem.addEventListener('input', event => {
                this.lettersChanged();
            });
            return elem;
        }

        removeLetterAtIdx(idx) {
            const parentElem = this.shadowRoot.querySelector('.letters');
            const elems = this.letterElems();
            if (idx < 0 || idx >= elems.length) {
                return;
            }
            parentElem.removeChild(elems[idx]);
        }

        handleKeyDown(elem, event) {
            const elems = this.letterElems();
            const letterIdx = elems.indexOf(elem);
            if (letterIdx < 0) {
                throw new Error("Element not found: " + letterIdx);
                return;
            }

            if (event.key.length == 1 && !event.metaKey && !event.ctrlKey) {
                let advance = false;
                if (this.isAlphabetic(event.key)) {
                    elem.value = event.key.toLowerCase();
                    advance = true;
                } else if (event.key == ' ') {
                    elem.value = '';
                    advance = true;
                }
                // Ignore all other single keys like punctuation.

                if (advance) {
                    this.lettersChanged();
                    if (letterIdx + 1 >= elems.length) {
                        this.addLetter();
                    }
                    this.focusIdx(letterIdx + 1);
                }
                return true;
            } else if (event.key == 'Backspace' || event.key == 'Delete') {
                if (elem.value == '' && elems.length > 1) {
                    this.removeLetterAtIdx(letterIdx);
                } else {
                    elem.value = '';
                }
                this.focusIdx(letterIdx - 1);
                this.lettersChanged();
                return true;
            } else if (event.key == 'ArrowLeft') {
                this.focusIdx(letterIdx - 1);
                return true;
            } else if (event.key == 'ArrowRight') {
                this.focusIdx(letterIdx + 1);
                return true;
            }
        }

        lettersChanged() {
            let pattern = '';
            for (let [i, elem] of this.letterElems().entries()) {
                let c = elem.value || '_';
                pattern += c;
            }
            this.setAttribute("pattern", pattern)
        }

        focusIdx(idx) {
            const elems = this.letterElems();
            if (idx < 0 || idx >= elems.length) {
                return;
            }
            elems[idx].focus();
            elems[idx].setSelectionRange(0, 1);
        }

        isAlphabetic(key) {
            return key.length == 1 &&
                ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z'))
        }

        sendChangeEvent() {
            const event = new Event("change");
            this.dispatchEvent(event);
        }

        set pattern(value) { this.setAttribute('pattern', value) }
        get pattern() { return this.getAttribute('pattern') || '_______' }

        set valid(value) { this.setAttribute('valid', value) }
        get valid() { return this.getAttribute('valid') || '' }

        set required(value) { this.setAttribute('required', value) }
        get required() { return this.getAttribute('required') || '' }

        static get observedAttributes() {
            return ['pattern', 'valid', 'required'];
        }

        attributeChangedCallback(property, oldValue, newValue) {
            if (this.shadowRoot) {
                this.updateLetters(this.shadowRoot, this.pattern);
            }
            // TODO: this ends up calling solve() multiple times as the attributes are
            // first set up. Is there a nicer way to do this?
            this.sendChangeEvent();
        }
    }
);

async function solveAsync(pattern, valid, required) {
    while (!window.solve) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return window.solve(pattern, valid, required);
}
