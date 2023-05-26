customElements.define('word-solver',
    class WordSolver extends HTMLElement {
        constructor() {
            super();
            this.wordcount = 0;
        }

        connectedCallback() {
            const solverTemplate = document.getElementById('word-solver');
            const solverNode = solverTemplate.content.cloneNode(true)
            const wordInput = solverNode.querySelector('word-input');

            const solutionsElem = solverNode.querySelector('.solutions');
            wordInput.addEventListener('solutionschanged', (event) => {
                this.updateSolutions(solutionsElem, event.detail);
            });

            this.update(solverNode);

            // TODO: It seems wrong we have to make this open to be able to modify it in attributeChangedCallback.
            const shadow = this.attachShadow({ mode: 'open' });
            shadow.append(solverNode);
        }

        updateSolutions(solutionsElem, solutions) {
            const items = [];
            for (let word of solutions) {
                const liElem = document.createElement("li");
                liElem.innerText = word;
                items.push(liElem);
            }
            const ulElem = solutionsElem.querySelector('ul');
            ulElem.replaceChildren(...items);
        }

        static get observedAttributes() {
            return ['wordcount'];
        }

        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) {
                return;
            }
            this[property] = newValue;
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
            this.pattern = '_______';
            this.valid = '';
            this.required = '';
            this._solutions = [];
        }

        get solutions() {
            return this._solutions;
        }

        connectedCallback() {
            const wordTemplate = document.getElementById('word-input');
            const wordNode = wordTemplate.content.cloneNode(true)

            const patternElem = wordNode.querySelector('.pattern');
            patternElem.value = this.pattern;
            patternElem.addEventListener('input', (event) => {
                this.pattern = patternElem.value;
                this.updateLetters(this.shadowRoot);
                this.updateSolution();
            });

            this.updateAlphabet(wordNode);
            this.updateLetters(wordNode);

            const shadow = this.attachShadow({ mode: 'open' });
            shadow.append(wordNode);

            // TODO: This doesn't work initially because it takes a while for solve()
            // to be registered.
            // this.updateSolution();
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

                elem.addEventListener('click', (event) => {
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

        updateLetters(root) {
            this.letterElems = this.createLetters()
            const elem = root.querySelector('.letters');
            elem.replaceChildren(...this.letterElems);

            for (let [i, elem] of this.letterElems.entries()) {
                elem.addEventListener('keydown', (event) => {
                    if (this.handleKeyDown(elem, i, event)) {
                        this.updateSolution();
                        event.preventDefault();
                        return false;
                    }
                });
            }
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
            this.valid = Array.from(valid.keys()).sort().join('');
            this.required = Array.from(required.keys()).sort().join('');
            console.log(this.valid, this.required);
            this.updateSolution();
        }

        createLetters() {
            const template = document.getElementById('letter-input');

            const elems = [];
            for (let chr of this.pattern) {
                const node = template.content.cloneNode(true);
                const elem = node.querySelector('.letter');
                if (chr != '_') {
                    elem.value = chr;
                }
                elems.push(elem);
            }
            return elems;
        }

        handleKeyDown(elem, letterIdx, event) {
            if (event.key.length == 1 && !event.metaKey && !event.ctrlKey) {
                if (this.isAlphabetic(event.key)) {
                    elem.value = event.key.toLowerCase();
                    this.focusNext(letterIdx);
                } else if (event.key == ' ') {
                    elem.value = '';
                    this.focusNext(letterIdx);
                }
                // Ignore all other single keys like punctuation.
                return true;
            } else if (event.key == 'Backspace') {
                elem.value = '';
                this.focusPrev(letterIdx);
                return true;
            } else if (event.key == 'ArrowLeft') {
                this.focusPrev(letterIdx);
                return true;
            } else if (event.key == 'ArrowRight') {
                this.focusNext(letterIdx);
                return true;
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

        isAlphabetic(key) {
            return key.length == 1 &&
                ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z'))
        }

        updateSolution() {
            if (!this.letterElems) {
                return;
            }

            let pattern = '';
            for (let [i, elem] of this.letterElems.entries()) {
                let c = elem.value || '_';
                pattern += c;
            }
            this._solutions = solve(pattern, this.valid, this.required);
            const event = new CustomEvent("solutionschanged", { detail: this._solutions });
            this.dispatchEvent(event);
        }

        static get observedAttributes() {
            return ['pattern', 'valid', 'required'];
        }

        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) {
                return;
            }
            this[property] = newValue;
            if (this.shadowRoot) {
                this.updateLetters(this.shadowRoot, this.pattern);
            }
        }
    }
);