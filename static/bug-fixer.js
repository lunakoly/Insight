const userAgent = navigator.userAgent.toLowerCase();

if (userAgent.indexOf('safari') != -1) {
 	if (userAgent.indexOf('chrome') > -1) {
 		// Chrome
	} else {
		const style = document.createElement('style')

		style.innerHTML = 'textarea { margin-left: -3px; }'

		document.body.appendChild(style)
	}
}