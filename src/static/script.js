$(async function() {
	$('.visible-pre-completion').prop('hidden', true);
	$('.visible-post-completion').prop('hidden', false);
	
	const handleSize = () => {
		const cert = $('#certificate');
		cert.css({
			backgroundImage: `url('${cert.attr('data-src')}')`,
			backgroundSize: 'cover'
		});
		const height = cert.attr('data-height');
		const width = cert.attr('data-width');
		if (height && width) {
			const computedWidth = $('#certificate-wrapper').width();
			const computedHeight = computedWidth * Number(height) / Number(width);
			if (width < computedWidth)
				cert.css({
					height: height,
					width: width
				})
			else
				cert.css({
					width: computedWidth,
					height: computedHeight
				});
		}
	};

	handleSize();
	$(window).on('resize', handleSize);
});

const downloadCert = async type => {
	const msg = `Downloading ${type}...`;
	console.log(msg);
	Toastify({
		text: msg,
		duration: 2000,
		gravity: 'top',
		position: 'right',
		backgroundColor: '#4C4C4C'
	}).showToast();
	const certFile = await fetch(certificate[type]);
	download(await certFile.blob(), 'certificate.png', 'image/png');
}