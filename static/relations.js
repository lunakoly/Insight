import * as format from './format.js'


/**
 * Handler that does nothing
 */
export class EmptyHighlighter {
	constructor() {

	}

	/**
	 * Highlights the text
	 */
	highlight(text) {
		return text
	}
}


/**
 * Handler that may contain regex rules
 * for code highlighting
 */
export class RegexHighlighter extends EmptyHighlighter {
	constructor() {
		super()

		/**
		 * (Regex, Style Class) rule pairs
		 */
		this.rules = []
	}

	/**
	 * Adds a rule for highlighting
	 */
	defineRule(regex, styleClass) {
		this.rules.push({ regex: regex, styleClass: styleClass })
		return this
	}

	/**
	 * Highlights the text
	 */
	highlight(text) {
		for (let each of this.rules)
			text = text.replace(each.regex, it => format.wrap(it, each.styleClass))
		return text
	}
}


/**
 * Defines a parsing context
 */
export class Scope {
	constructor(styleClass, transitions = {}) {
		this.transitions = transitions
		this.styleClass = styleClass
	}

	/**
	 * Wraps a portion of text with a
	 * styleClass. Inserts that portion into
	 * the text and returns it as a result with
	 * the position pointing after the insertion
	 */
	wrap(text, styleClass, start, end) {
		const read = text.substring(start, end)
		const wrapped = format.wrap(read, styleClass)
		const result = format.insert(text, wrapped, start, end - start)
		return [result, start + wrapped.length]
	}

	/**
	 * Tests if the next part of text
	 * satisfies the pattern
	 */
	lookAhead(pattern, text, start) {
		const regex = new RegExp(pattern, 'g')
		const matches = regex.exec(text.substring(start))

		if (matches != null && matches.index == 0)
			return matches[0]

		return null
	}

	/**
	 * Highlights the next part of text
	 */
	proceed(text, index) {
		let it = index;

		while (it < text.length) {
			let found = false

			for (let each of Object.keys(this.transitions)) {
				const item = this.transitions[each]
				const match = this.lookAhead(each, text, it)

				if (match != null) {
					found = true

					if (item.styleClass)
						[text, it] = this.wrap(text, item.styleClass, it, it + match.length)
					else
						it += match.length

					if (item.pop)
						return this.wrap(text, this.styleClass, index, it)

					if (item.push)
						[text, it] = item.push.proceed(text, it)

					break
				}
			}

			if (!found)
				it++
		}

		return this.wrap(text, this.styleClass, index, it)
	}
}

/**
 * Handler that does highlighting
 * by contextual rules
 */
export class ScopedHighlighter extends EmptyHighlighter {
	constructor() {
		super()

		/**
		 * Stack of contexts
		 */
		this.scopes = []
	}

	/**
	 * Adds a scope
	 */
	pushScope(scope) {
		this.scopes.push(scope)
	}

	/**
	 * Returns the last added scope
	 */
	getLastScope() {
		return this.scopes[this.scopes.length - 1]
	}

	/**
	 * Resets scope settings
	 */
	clearScopes() {
		this.scopes = []
	}

	/**
	 * Highlights the text
	 */
	highlight(text) {
		const top = this.getLastScope()

		if (top) {
			const [result, index] = top.proceed(text, 0)
			return result
		}

		return text
	}
}


/**
 * Escapes html entities in observable.value
 * performs highlighting, reformats lines
 * and return the result
 */
export function analyze(observable, observer) {
	const escaped = format.escape(observable.value)
	const value = observer.highlighter.highlight(escaped)
	return format.divide(value)
}

/**
 * Assigns a new value to the observer value
 */
export function assign(observable, observer, value) {
	const start = observable.selectionStart
	const end   = observable.selectionEnd

	observable.value = value

	observable.selectionStart = start
	observable.selectionEnd   = end

	observer.innerHTML = analyze(observable, observer)
}

/**
 * Inserts a sequence at the selection position
 */
export function inject(observable, observer, sequence) {
	assign(
		observable,
		observer,
		observable.value.substring(0, observable.selectionStart) +
		sequence +
		observable.value.substring(observable.selectionEnd)
	)

	observable.selectionStart += sequence.length
	observable.selectionEnd = observable.selectionStart
}

/**
 * Removes a portion described by changes.selectionStart
 * and changes.selectionEnd and inserts changes.sequence there
 */
export function insert(observable, observer, changes) {
	let start = observable.selectionStart
	let end   = observable.selectionEnd

	observable.value = observable.value.substring(0, changes.selectionStart) +
		   			   changes.sequence +
		   			   observable.value.substring(changes.selectionEnd)

	if (end > changes.selectionStart) {
		const min = Math.min(end, changes.selectionEnd)
		end += changes.sequence.length - (min - changes.selectionStart)
	}

	if (start > changes.selectionStart) {
		const min = Math.min(start, changes.selectionEnd)
		start += changes.sequence.length - (min - changes.selectionStart)
	}

	observable.selectionStart = start
	observable.selectionEnd   = end

	observer.innerHTML = analyze(observable, observer)
}


/**
 * Initializes value observation
 * for the given element
 */
export function assignObservable(element) {
	const highlighter = element.dataset.highlighter

	if (highlighter == 'regex')
		element.highlighter = new RegexHighlighter()
	else if (highlighter == 'scoped')
		element.highlighter = new ScopedHighlighter()
	else
		element.highlighter = new EmptyHighlighter()

	const observable = document.querySelector(element.dataset.observe)

	if (observable) {
		observable.addEventListener('input', e => {
			element.innerHTML = analyze(observable, element)
		})

		// initial
		element.innerHTML = analyze(observable, element)
	}
}


/**
 * Register observations
 */
export function assignAllObservables() {
	const observers = document.querySelectorAll('[data-observe]')

	for (let each of observers) {
		assignObservable(each)
	}
}


// analyze existing elements
assignAllObservables()