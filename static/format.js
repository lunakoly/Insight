/**
 * Maps html operators to
 * their html entities.
 */
const htmlReplacements = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;'
}

/**
 * Attempts to return an html entity of the
 * given operator. Returns it's argument otherwise.
 */
function replace(entity) {
	return htmlReplacements[entity] || entity
}

/**
 * Escapes all html operators.
 */
export function escape(string) {
	return string.replace(/&|<|>/g, replace)
}

/**
 * Wraps lines with <div></br></div>
 */
export function divide(string) {
	return string
			.split('\n')
			.map(it => `<div class="line">${it}</br></div>`)
			.join('')
}

/**
 * Returns styled span
 */
export function wrap(text, styleClass) {
	return `<span class="${styleClass}">${text}</span>`
}

/**
 * Replaces a part of string specified
 * by the indices
 */
export function insert(string, substring, start, length) {
	return string.substring(0, start) + substring + string.substring(start + length)
}