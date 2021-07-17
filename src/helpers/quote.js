const quotes = [
	`The distance between your dreams and reality is called action.`,
	`Some things/people are truly a waste of time. Learn how to hack your way out, fellow.`,
	`जुगाड़ू बनो । अच्छा लगता है ।`,
	`Don't make a Jugaad your escape; Use it as a faster, cheaper, alternative solution.`,
	`There are 2 ways to be happy:\n1. Change the situation.\n2. Change your mindset.`,
	`It always feels impossible until it is done.`
];

const getQuote = () => quotes[Math.floor(Math.random() * quotes.length)];

module.exports = {
	getQuote
};