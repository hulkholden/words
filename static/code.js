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
            this.update(this.shadowRoot);
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
                this.updateSolution();
            });

            const validElem = wordNode.querySelector('.valid');
            validElem.value = this.valid;
            validElem.addEventListener('input', (event) => {
                this.valid = validElem.value;
                this.updateSolution();
            });

            const requiredElem = wordNode.querySelector('.required');
            requiredElem.value = this.required;
            requiredElem.addEventListener('input', (event) => {
                this.required = requiredElem.value;
                this.updateSolution();
            });

            this.updateLetters(wordNode, this.pattern);

            const shadow = this.attachShadow({ mode: 'open' });
            shadow.append(wordNode);

            // TODO: This doesn't work initially because it takes a while for solve()
            // to be registered.
            // this.updateSolution();
        }

        updateLetters(root, pattern) {
            this.letterElems = this.createLetters(pattern)
            const lettersElem = root.querySelector('.letters');
            lettersElem.replaceChildren(...this.letterElems);

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

        createLetters(pattern) {
            const letterTemplate = document.getElementById('letter-input');

            const letterElems = [];
            for (let chr of pattern) {
                const letterNode = letterTemplate.content.cloneNode(true);
                const letterElem = letterNode.querySelector('.letter');
                if (chr != '_') {
                    letterElem.value = chr;
                }
                letterElems.push(letterElem);
            }
            return letterElems;
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
        }
    }
);