/**
 * Determines the User-Agent to be able
 * to apply corrections for each browser
 * individually
 */
const userAgent = navigator.userAgent.toLowerCase();

// try catch Safari
if (userAgent.indexOf('safari') != -1) {
 	// but not Chrome
 	if (userAgent.indexOf('chrome') > -1) {

	} else {
		// mobile only
		if (/iPad|iPhone|iPod/.test(userAgent)) {
			// fix 3px padding bug of <textarea>
			const style = document.createElement('style')
			style.innerHTML = 'textarea { margin-left: -3px; }'
			document.body.appendChild(style)
		}
	}
}